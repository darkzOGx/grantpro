/**
 * Grant Ingestion Orchestrator
 *
 * Coordinates ingestion from all sources using a registry-based architecture.
 * Sources self-register via the client registry when imported.
 */

import { prisma } from "@/lib/prisma";
import { clientRegistry } from "./registry";
import { BaseClient } from "./clients/BaseClient";
import { generateGrantChecksum } from "./normalizer";
import { NormalizedGrant, IngestionResult } from "./types";

// Import all clients to trigger self-registration
import "./clients/grants-gov";
import "./clients/california";
import "./clients/usaspending";
import "./clients/nsf-awards";
import "./clients/propublica";
import "./clients/candid";
import "./clients/sam-gov";

// ============================================
// Orchestrator Class
// ============================================

export class IngestionOrchestrator {
  /**
   * Run ingestion for a specific source by name
   */
  async runIngestion(sourceName: string): Promise<IngestionResult> {
    // Get client from registry
    const client = clientRegistry.getClient(sourceName);
    if (!client) {
      throw new Error(
        `Unknown source: ${sourceName}. Available sources: ${clientRegistry.getClientNames().join(", ")}`
      );
    }

    // Get or create ingestion source record
    const source = await this.ensureSource(client);

    // Create run record
    const run = await prisma.ingestionRun.create({
      data: {
        sourceId: source.id,
        sourceName: source.name,
        status: "RUNNING",
      },
    });

    try {
      // Initialize client if needed
      if (client.initialize) {
        await client.initialize();
      }

      // Run generic ingestion
      const result = await this.ingestFromClient(client, source.id);

      // Cleanup if needed
      if (client.cleanup) {
        await client.cleanup();
      }

      // Update run record
      await prisma.ingestionRun.update({
        where: { id: run.id },
        data: {
          status: result.totalErrors > 0 ? "PARTIAL" : "SUCCESS",
          completedAt: new Date(),
          totalFetched: result.totalFetched,
          totalNew: result.totalNew,
          totalUpdated: result.totalUpdated,
          totalErrors: result.totalErrors,
          errorLog: result.errors.length > 0 ? result.errors : undefined,
        },
      });

      // Update source last sync
      await prisma.ingestionSource.update({
        where: { id: source.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: result.totalErrors > 0 ? "partial" : "success",
          lastSyncCount: result.totalNew + result.totalUpdated,
        },
      });

      return result;
    } catch (error) {
      // Update run with failure
      await prisma.ingestionRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errorLog: { message: (error as Error).message },
        },
      });

      // Update source status
      await prisma.ingestionSource.update({
        where: { id: source.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: "error",
        },
      });

      throw error;
    }
  }

  /**
   * Run ingestion for all enabled sources
   */
  async runAllIngestions(): Promise<Map<string, IngestionResult>> {
    const results = new Map<string, IngestionResult>();
    const enabledClients = clientRegistry.getEnabledClients();

    console.log(`Running ingestion for ${enabledClients.length} enabled sources...`);

    for (const client of enabledClients) {
      try {
        console.log(`\n[Orchestrator] Starting: ${client.config.displayName}`);
        const result = await this.runIngestion(client.config.name);
        results.set(client.config.name, result);
        console.log(
          `[Orchestrator] Completed: ${client.config.displayName} - ` +
            `${result.totalNew} new, ${result.totalUpdated} updated, ${result.totalErrors} errors`
        );
      } catch (error) {
        console.error(
          `[Orchestrator] Failed: ${client.config.displayName}:`,
          (error as Error).message
        );
        // Continue with next source
      }
    }

    return results;
  }

  /**
   * Generic ingestion from any client
   */
  private async ingestFromClient(
    client: BaseClient,
    sourceId: string
  ): Promise<IngestionResult> {
    const result: IngestionResult = {
      sourceId,
      sourceName: client.config.name,
      totalFetched: 0,
      totalNew: 0,
      totalUpdated: 0,
      totalErrors: 0,
      errors: [],
    };

    // Fetch data using client's fetchGrants method
    const { data } = await client.fetchGrants();
    result.totalFetched = data.length;

    console.log(
      `[${client.config.name}] Processing ${data.length} items...`
    );

    // Process each item
    for (const rawData of data) {
      try {
        // Use client's normalizer
        const normalized = client.normalizeGrant(rawData);
        const saveResult = await this.saveGrant(sourceId, normalized, rawData);

        if (saveResult === "new") {
          result.totalNew++;
        } else if (saveResult === "updated") {
          result.totalUpdated++;
        }
      } catch (error) {
        result.totalErrors++;
        result.errors.push({
          externalId: client.getExternalId(rawData),
          message: (error as Error).message,
        });
      }
    }

    return result;
  }

  /**
   * Save or update a normalized grant
   */
  private async saveGrant(
    sourceId: string,
    normalized: NormalizedGrant,
    rawData: unknown
  ): Promise<"new" | "updated" | "unchanged"> {
    const checksum = generateGrantChecksum(normalized);

    // Check if we've seen this grant before
    const existingRaw = await prisma.rawGrant.findUnique({
      where: {
        sourceId_externalId: {
          sourceId,
          externalId: normalized.externalId,
        },
      },
    });

    if (existingRaw) {
      // Check if changed
      if (existingRaw.checksum === checksum) {
        return "unchanged";
      }

      // Update existing
      await prisma.rawGrant.update({
        where: { id: existingRaw.id },
        data: {
          rawData: rawData as object,
          checksum,
          normalizedAt: new Date(),
        },
      });

      // Update the grant
      if (existingRaw.grantId) {
        await prisma.grant.update({
          where: { id: existingRaw.grantId },
          data: {
            title: normalized.title,
            fundingAmountMin: normalized.fundingAmountMin,
            fundingAmountMax: normalized.fundingAmountMax,
            deadline: normalized.deadline,
            description: normalized.description,
            eligibilityCriteria: normalized.eligibilityCriteria,
            requirements: normalized.requirements as object,
            isActive: normalized.isActive,
            lastSyncedAt: new Date(),
          },
        });
      }

      return "updated";
    }

    // Create new grant
    const grant = await prisma.grant.create({
      data: {
        title: normalized.title,
        category: normalized.category,
        sourceType: normalized.sourceType,
        fundingAmountMin: normalized.fundingAmountMin,
        fundingAmountMax: normalized.fundingAmountMax,
        deadline: normalized.deadline,
        description: normalized.description,
        eligibilityCriteria: normalized.eligibilityCriteria,
        applicationUrl: normalized.applicationUrl,
        requirements: normalized.requirements as object,
        isActive: normalized.isActive,
        externalId: normalized.externalId,
        sourceUrl: normalized.sourceUrl,
        cfda: normalized.cfda,
        agencyCode: normalized.agencyCode,
        ingestionSourceId: sourceId,
        lastSyncedAt: new Date(),
      },
    });

    // Create raw grant record
    await prisma.rawGrant.create({
      data: {
        sourceId,
        externalId: normalized.externalId,
        rawData: rawData as object,
        checksum,
        status: "NORMALIZED",
        normalizedAt: new Date(),
        grantId: grant.id,
      },
    });

    return "new";
  }

  /**
   * Ensure an ingestion source exists based on client config
   */
  private async ensureSource(client: BaseClient) {
    const config = client.config;

    return prisma.ingestionSource.upsert({
      where: { name: config.name },
      update: {},
      create: {
        name: config.name,
        displayName: config.displayName,
        sourceType: config.sourceType,
        baseUrl: config.baseUrl,
        isActive: true,
      },
    });
  }

  // ============================================
  // Status & Monitoring Methods
  // ============================================

  /**
   * Get all configured sources and their status
   */
  async getSourcesStatus() {
    return prisma.ingestionSource.findMany({
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get recent ingestion runs
   */
  async getRecentRuns(limit = 10) {
    return prisma.ingestionRun.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get summary of registered clients
   */
  getRegisteredClients() {
    return clientRegistry.getSummary();
  }

  /**
   * Enable or disable a source
   */
  setSourceEnabled(sourceName: string, enabled: boolean): boolean {
    return clientRegistry.setEnabled(sourceName, enabled);
  }

  /**
   * Get available source names
   */
  getAvailableSources(): string[] {
    return clientRegistry.getClientNames();
  }
}

// ============================================
// Singleton Export
// ============================================

export const ingestionOrchestrator = new IngestionOrchestrator();

// Re-export registry for external access
export { clientRegistry } from "./registry";
export { BaseClient } from "./clients/BaseClient";
export type { ClientConfig, FetchResult } from "./clients/BaseClient";
export { registerClient } from "./registry";
