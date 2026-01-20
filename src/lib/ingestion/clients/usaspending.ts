/**
 * USAspending.gov API Client
 *
 * Free public API for historical federal spending data.
 * API Docs: https://api.usaspending.gov/
 *
 * Use cases:
 * - Historical award data for benchmarking
 * - Peer district funding analysis
 * - CFDA program spending trends
 */

import { GrantCategory, GrantSourceType } from "@prisma/client";
import { BaseClient, ClientConfig, FetchResult } from "./BaseClient";
import { registerClient } from "../registry";
import {
  USAspendingAward,
  USAspendingSearchParams,
  NormalizedGrant,
  inferCategoryFromCFDA,
} from "../types";

// ============================================
// Configuration
// ============================================

const CONFIG: ClientConfig = {
  name: "usaspending",
  displayName: "USAspending.gov",
  sourceType: "FEDERAL_API",
  baseUrl: "https://api.usaspending.gov/api/v2",
  rateLimit: { requestsPerSecond: 3 },
};

// Key education CFDA numbers for K-12
const EDUCATION_CFDAS = [
  "84.010", // Title I Grants
  "84.027", // IDEA Special Education
  "84.367", // Title II-A Teacher Quality
  "84.365", // English Language Acquisition
  "84.424", // Full-Service Community Schools
  "84.425", // ESSER Funds
  "10.553", // School Breakfast Program
  "10.555", // National School Lunch Program
  "84.181", // 21st Century Community Learning Centers
  "45.024", // NEA Grants in Arts Education
];

// ============================================
// Client Implementation
// ============================================

export class USAspendingClient extends BaseClient {
  constructor() {
    super(CONFIG);
  }

  // ============================================
  // BaseClient Abstract Method Implementations
  // ============================================

  /**
   * Fetch K-12 education awards
   */
  async fetchGrants(): Promise<FetchResult<USAspendingAward>> {
    this.log("Fetching K-12 education awards...");

    const allAwards: USAspendingAward[] = [];

    for (const cfda of EDUCATION_CFDAS) {
      try {
        this.log(`  Fetching awards for CFDA ${cfda}...`);
        const result = await this.searchByCFDA(cfda, {
          limit: 50,
          startDate: "2023-01-01",
        });
        this.log(`    Found ${result.results.length} awards`);
        allAwards.push(...result.results);
        await this.delay(300); // Rate limiting
      } catch (error) {
        this.error(`  Error fetching CFDA ${cfda}:`, (error as Error).message);
      }
    }

    // Dedupe by Award ID
    const unique = Array.from(
      new Map(allAwards.map((a) => [a["Award ID"], a])).values()
    );

    this.log(`Total unique K-12 awards: ${unique.length}`);

    return {
      data: unique,
      totalCount: unique.length,
      hasMore: false,
    };
  }

  /**
   * Normalize a USAspending award to internal schema
   */
  normalizeGrant(award: USAspendingAward): NormalizedGrant {
    // Infer category from CFDA number
    let category: GrantCategory = "FEDERAL";
    if (award["CFDA Number"]) {
      category = inferCategoryFromCFDA(award["CFDA Number"]);
    }

    // Parse dates
    let deadline: Date;
    try {
      deadline = award["End Date"]
        ? new Date(award["End Date"])
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    } catch {
      deadline = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    const fundingAmount = award["Award Amount"] || 0;

    return {
      title: `${award["Recipient Name"]} - ${award["CFDA Number"] || "Federal Award"}`,
      category,
      sourceType: "FEDERAL" as GrantSourceType,
      fundingAmountMin: fundingAmount,
      fundingAmountMax: fundingAmount,
      deadline,
      externalId: award["Award ID"],
      sourceUrl: `https://www.usaspending.gov/award/${award["Award ID"]}`,
      cfda: award["CFDA Number"],
      agencyCode: award["Awarding Agency"],
      description: award.Description,
      eligibilityCriteria: undefined,
      applicationUrl: undefined,
      requirements: {
        awardType: award["Award Type"],
        subAgency: award["Awarding Sub Agency"],
        totalOutlays: award["Total Outlays"],
      },
      isActive: false, // Historical awards
    };
  }

  /**
   * Get external ID from raw award data
   */
  getExternalId(award: USAspendingAward): string {
    return award["Award ID"];
  }

  // ============================================
  // Public API Methods
  // ============================================

  /**
   * Search for awards by CFDA number
   */
  async searchByCFDA(
    cfdaNumber: string,
    params: USAspendingSearchParams = {}
  ): Promise<{ results: USAspendingAward[]; page_metadata: { total: number } }> {
    const url = `${this.config.baseUrl}/search/spending_by_award/`;

    const requestBody = {
      filters: {
        award_type_codes: ["02", "03", "04", "05"], // Grants
        program_numbers: [cfdaNumber],
        time_period: params.timePeriod || [
          {
            start_date: params.startDate || "2020-01-01",
            end_date: params.endDate || new Date().toISOString().split("T")[0],
          },
        ],
      },
      fields: [
        "Award ID",
        "Recipient Name",
        "Award Amount",
        "Total Outlays",
        "Description",
        "Start Date",
        "End Date",
        "Awarding Agency",
        "Awarding Sub Agency",
        "Award Type",
        "CFDA Number",
        "recipient_id",
      ],
      page: params.page || 1,
      limit: params.limit || 100,
      sort: params.sort || "Award Amount",
      order: params.order || "desc",
    };

    return this.postJson(url, requestBody);
  }

  /**
   * Search for education-related awards
   */
  async searchEducationAwards(
    params: USAspendingSearchParams = {}
  ): Promise<USAspendingAward[]> {
    const url = `${this.config.baseUrl}/search/spending_by_award/`;

    const requestBody = {
      filters: {
        award_type_codes: ["02", "03", "04", "05"], // Grants only
        agencies: [
          { type: "funding", tier: "toptier", name: "Department of Education" },
        ],
        time_period: [
          {
            start_date: params.startDate || "2023-01-01",
            end_date: params.endDate || new Date().toISOString().split("T")[0],
          },
        ],
      },
      fields: [
        "Award ID",
        "Recipient Name",
        "Award Amount",
        "Total Outlays",
        "Description",
        "Start Date",
        "End Date",
        "Awarding Agency",
        "Awarding Sub Agency",
        "Award Type",
        "CFDA Number",
        "recipient_id",
      ],
      page: params.page || 1,
      limit: params.limit || 100,
      sort: "Award Amount",
      order: "desc",
    };

    const data = await this.postJson<{ results: USAspendingAward[] }>(
      url,
      requestBody
    );
    return data.results || [];
  }

  /**
   * Get recipient profile (school district info)
   */
  async getRecipientProfile(recipientId: string): Promise<{
    name: string;
    location: { city_name: string; state_code: string };
    total_federal_amount: number;
    total_transaction_count: number;
  } | null> {
    const url = `${this.config.baseUrl}/recipient/${recipientId}/`;

    try {
      return await this.fetchJson(url);
    } catch {
      return null;
    }
  }

  /**
   * Get CFDA program totals (for benchmarking)
   */
  async getCFDATotals(cfdaNumber: string): Promise<{
    cfda_title: string;
    cfda_federal_agency: string;
    obligations: number;
    outlays: number;
  } | null> {
    try {
      const url = `${this.config.baseUrl}/references/cfda/totals/?cfda=${cfdaNumber}`;
      const data = await this.fetchJson<{
        results: Array<{
          cfda_title: string;
          cfda_federal_agency: string;
          obligations: number;
          outlays: number;
        }>;
      }>(url);
      return data.results?.[0] || null;
    } catch {
      return null;
    }
  }
}

// ============================================
// Self-Registration
// ============================================

registerClient(new USAspendingClient());

// Export for direct access if needed
export const usaSpendingClient = new USAspendingClient();
