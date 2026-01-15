/**
 * Grant Ingestion Orchestrator
 * 
 * Coordinates ingestion from all sources and manages the pipeline.
 */

import { prisma } from "@/lib/prisma";
import { IngestionSourceType } from "@prisma/client";
import { GrantsGovClient } from "./clients/grants-gov";
import { CaliforniaGrantsClient } from "./clients/california";
import {
    normalizeGrantsGovOpportunity,
    normalizeCaliforniaGrant,
    generateGrantChecksum,
} from "./normalizer";
import { NormalizedGrant, IngestionResult } from "./types";

export class IngestionOrchestrator {
    private grantsGovClient: GrantsGovClient;
    private californiaClient: CaliforniaGrantsClient;

    constructor() {
        this.grantsGovClient = new GrantsGovClient();
        this.californiaClient = new CaliforniaGrantsClient();
    }

    /**
     * Run ingestion for a specific source
     */
    async runIngestion(sourceName: string): Promise<IngestionResult> {
        // Get or create ingestion source record
        const source = await this.ensureSource(sourceName);

        // Create run record
        const run = await prisma.ingestionRun.create({
            data: {
                sourceId: source.id,
                sourceName: source.name,
                status: "RUNNING",
            },
        });

        try {
            let result: IngestionResult;

            switch (source.name) {
                case "grants_gov":
                    result = await this.ingestGrantsGov(source.id);
                    break;
                case "ca_grants":
                    result = await this.ingestCaliforniaGrants(source.id);
                    break;
                default:
                    throw new Error(`Unknown source: ${source.name}`);
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
     * Ingest grants from Grants.gov
     */
    private async ingestGrantsGov(sourceId: string): Promise<IngestionResult> {
        const result: IngestionResult = {
            sourceId,
            sourceName: "grants_gov",
            totalFetched: 0,
            totalNew: 0,
            totalUpdated: 0,
            totalErrors: 0,
            errors: [],
        };

        // Fetch education-related grants
        const opportunities = await this.grantsGovClient.fetchEducationGrants();
        result.totalFetched = opportunities.length;

        for (const opp of opportunities) {
            try {
                const normalized = normalizeGrantsGovOpportunity(opp);
                const saveResult = await this.saveGrant(sourceId, normalized, opp);

                if (saveResult === "new") {
                    result.totalNew++;
                } else if (saveResult === "updated") {
                    result.totalUpdated++;
                }
            } catch (error) {
                result.totalErrors++;
                result.errors.push({
                    externalId: opp.opportunityId,
                    message: (error as Error).message,
                });
            }
        }

        return result;
    }

    /**
     * Ingest grants from California Grants Portal
     */
    private async ingestCaliforniaGrants(sourceId: string): Promise<IngestionResult> {
        const result: IngestionResult = {
            sourceId,
            sourceName: "ca_grants",
            totalFetched: 0,
            totalNew: 0,
            totalUpdated: 0,
            totalErrors: 0,
            errors: [],
        };

        // Fetch open grants from CSV
        const csvGrants = await this.californiaClient.fetchOpenGrants();
        result.totalFetched = csvGrants.length;

        for (const csvGrant of csvGrants) {
            try {
                const normalized = normalizeCaliforniaGrant(csvGrant);
                const saveResult = await this.saveGrant(sourceId, normalized, csvGrant);

                if (saveResult === "new") {
                    result.totalNew++;
                } else if (saveResult === "updated") {
                    result.totalUpdated++;
                }
            } catch (error) {
                result.totalErrors++;
                result.errors.push({
                    externalId: csvGrant.GrantID,
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
     * Ensure an ingestion source exists
     */
    private async ensureSource(sourceName: string) {
        const sourceConfigs: Record<string, { displayName: string; sourceType: IngestionSourceType; baseUrl: string }> = {
            grants_gov: {
                displayName: "Grants.gov",
                sourceType: "FEDERAL_API",
                baseUrl: "https://www.grants.gov",
            },
            ca_grants: {
                displayName: "California Grants Portal",
                sourceType: "STATE_CSV",
                baseUrl: "https://grants.ca.gov",
            },
            sam_gov: {
                displayName: "SAM.gov Assistance Listings",
                sourceType: "FEDERAL_API",
                baseUrl: "https://sam.gov",
            },
            propublica_990: {
                displayName: "ProPublica Nonprofit Explorer",
                sourceType: "FOUNDATION_990",
                baseUrl: "https://projects.propublica.org/nonprofits",
            },
        };

        const config = sourceConfigs[sourceName];
        if (!config) {
            throw new Error(`Unknown source: ${sourceName}`);
        }

        return prisma.ingestionSource.upsert({
            where: { name: sourceName },
            update: {},
            create: {
                name: sourceName,
                displayName: config.displayName,
                sourceType: config.sourceType,
                baseUrl: config.baseUrl,
                isActive: true,
            },
        });
    }

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
}

export const ingestionOrchestrator = new IngestionOrchestrator();
