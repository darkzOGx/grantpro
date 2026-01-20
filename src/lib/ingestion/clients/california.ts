/**
 * California Grants Portal Client
 *
 * Ingests grants from the California Open Data Portal CSV export.
 * Source: https://data.ca.gov/dataset/california-grants-portal
 */

import { GrantCategory, GrantSourceType } from "@prisma/client";
import { BaseClient, ClientConfig, FetchResult } from "./BaseClient";
import { registerClient } from "../registry";
import {
  CaliforniaGrantCSV,
  NormalizedGrant,
  inferCategoryFromKeywords,
} from "../types";

// ============================================
// Configuration
// ============================================

const CONFIG: ClientConfig = {
  name: "ca_grants",
  displayName: "California Grants Portal",
  sourceType: "STATE_CSV",
  baseUrl: "https://data.ca.gov",
  rateLimit: { requestsPerSecond: 2 },
};

const CA_GRANTS_CSV_URL =
  "https://data.ca.gov/dataset/e1b1c799-cdd4-4219-af6d-93b79747fffb/resource/111c8c88-21f6-453c-ae2c-b4785a0624f5/download/california-grants-portal-data.csv";

// ============================================
// Client Implementation
// ============================================

export class CaliforniaGrantsClient extends BaseClient {
  constructor() {
    super(CONFIG);
  }

  // ============================================
  // BaseClient Abstract Method Implementations
  // ============================================

  /**
   * Fetch open grants from California portal
   */
  async fetchGrants(): Promise<FetchResult<CaliforniaGrantCSV>> {
    this.log("Fetching grants from California portal...");

    const allGrants = await this.fetchGrantsCsv();
    const now = new Date();

    // Filter to only open grants
    const openGrants = allGrants.filter((grant) => {
      if (!grant.ApplicationDeadline) return true; // No deadline = ongoing

      try {
        const deadline = new Date(grant.ApplicationDeadline);
        return deadline > now;
      } catch {
        return true; // Include if we can't parse the date
      }
    });

    this.log(`Found ${openGrants.length} open grants (of ${allGrants.length} total)`);

    return {
      data: openGrants,
      totalCount: openGrants.length,
      hasMore: false,
    };
  }

  /**
   * Normalize a California grant to internal schema
   */
  normalizeGrant(csvGrant: CaliforniaGrantCSV): NormalizedGrant {
    // Parse funding amount
    const { min, max } = this.parseFundingAmount(csvGrant.EstAvailFunds);

    // Infer category from title and description
    const textForCategory = `${csvGrant.Title} ${csvGrant.Description || ""} ${csvGrant.Categories || ""}`;
    const category = this.mapCategory(csvGrant.Categories, textForCategory);

    // Parse deadline
    let deadline: Date;
    try {
      deadline = csvGrant.ApplicationDeadline
        ? new Date(csvGrant.ApplicationDeadline)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    } catch {
      deadline = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    return {
      title: csvGrant.Title,
      category,
      sourceType: "STATE" as GrantSourceType,
      fundingAmountMin: min,
      fundingAmountMax: max,
      deadline,
      externalId: csvGrant.GrantID || csvGrant.PortalID || "",
      sourceUrl: csvGrant.GrantURL,
      description: csvGrant.Description || csvGrant.Purpose,
      eligibilityCriteria: csvGrant.ApplicantType,
      applicationUrl: csvGrant.GrantURL,
      requirements: {
        geographicEligibility: csvGrant.Geography,
        matchingFundsRequired: csvGrant.MatchingFunds && !csvGrant.MatchingFunds.toLowerCase().includes("not required"),
        categories: csvGrant.Categories?.split(";").map((c) => c.trim()),
        applicantTypeNotes: csvGrant.ApplicantTypeNotes,
        fundingSource: csvGrant.FundingSource,
      },
      isActive: true,
    };
  }

  /**
   * Get external ID from raw grant data
   */
  getExternalId(csvGrant: CaliforniaGrantCSV): string {
    return csvGrant.GrantID || csvGrant.PortalID || "";
  }

  // ============================================
  // Public API Methods
  // ============================================

  /**
   * Fetch and parse the California Grants Portal CSV
   */
  async fetchGrantsCsv(): Promise<CaliforniaGrantCSV[]> {
    const csvText = await this.fetchText(CA_GRANTS_CSV_URL);
    return this.parseCSV(csvText);
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Parse CSV text into structured objects
   */
  private parseCSV(csvText: string): CaliforniaGrantCSV[] {
    const lines = csvText.split("\n");
    if (lines.length < 2) {
      return [];
    }

    // Parse header row
    const headers = this.parseCSVLine(lines[0]);
    const grants: CaliforniaGrantCSV[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line);
      if (values.length !== headers.length) continue;

      const grant: Record<string, string> = {};
      headers.forEach((header, index) => {
        grant[header.trim()] = values[index]?.trim() || "";
      });

      grants.push(grant as unknown as CaliforniaGrantCSV);
    }

    return grants;
  }

  /**
   * Parse a single CSV line handling quoted fields
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Parse funding amount string into min/max values
   */
  private parseFundingAmount(amountStr?: string): { min: number; max: number } {
    if (!amountStr) {
      return { min: 0, max: 0 };
    }

    // Remove $ and commas, handle ranges
    const cleaned = amountStr.replace(/[$,]/g, "").trim();

    // Check for range (e.g., "10000 - 50000" or "10000-50000")
    const rangeMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
    if (rangeMatch) {
      return {
        min: parseFloat(rangeMatch[1]),
        max: parseFloat(rangeMatch[2]),
      };
    }

    // Single value
    const singleMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
    if (singleMatch) {
      const value = parseFloat(singleMatch[1]);
      return { min: value, max: value };
    }

    return { min: 0, max: 0 };
  }

  /**
   * Map California category strings to our GrantCategory enum
   */
  private mapCategory(categories?: string, text?: string): GrantCategory {
    const lower = (categories || "").toLowerCase();

    if (
      lower.includes("food") ||
      lower.includes("nutrition") ||
      lower.includes("agriculture")
    ) {
      return "NUTRITION";
    }
    if (
      lower.includes("art") ||
      lower.includes("culture") ||
      lower.includes("humanities")
    ) {
      return "ARTS";
    }
    if (
      lower.includes("science") ||
      lower.includes("technology") ||
      lower.includes("stem")
    ) {
      return "STEM";
    }
    if (
      lower.includes("infrastructure") ||
      lower.includes("energy") ||
      lower.includes("environment")
    ) {
      return "INFRASTRUCTURE";
    }
    if (lower.includes("education") || lower.includes("school")) {
      return "STATE";
    }

    // Fall back to keyword inference
    if (text) {
      return inferCategoryFromKeywords(text);
    }

    return "STATE";
  }
}

// ============================================
// Self-Registration
// ============================================

registerClient(new CaliforniaGrantsClient());

// Export for direct access if needed
export const californiaGrantsClient = new CaliforniaGrantsClient();
