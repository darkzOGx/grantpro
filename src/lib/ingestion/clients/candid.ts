/**
 * Candid Grants API Client
 *
 * Accesses comprehensive foundation and corporate grant data.
 * API Reference: https://developer.candid.org/
 *
 * Covers:
 * - 235,000+ private foundations
 * - Corporate foundations (Honda, Toshiba, Lowe's, Verizon, etc.)
 * - Daily updates from 35+ data sources
 */

import { GrantCategory, GrantSourceType } from "@prisma/client";
import { BaseClient, ClientConfig, FetchResult } from "./BaseClient";
import { registerClient } from "../registry";
import {
  CandidFunder,
  CandidSearchParams,
  CandidTransaction,
  NormalizedGrant,
} from "../types";

// ============================================
// Configuration
// ============================================

const CONFIG: ClientConfig = {
  name: "candid",
  displayName: "Candid Grants API",
  sourceType: "PRIVATE_API",
  baseUrl: "https://api.candid.org/grants/v1",
  rateLimit: { requestsPerSecond: 2, burstLimit: 5 }, // Conservative for trial
};

// Education-related PCS (Philanthropy Classification System) subject codes
const EDUCATION_SUBJECT_CODES = [
  "ED", // Education (general)
  "ED01", // Elementary & Secondary Education
  "ED02", // Higher Education
  "ED03", // Adult Education
  "ED04", // Special Education
  "ED05", // Vocational Education
  "YD", // Youth Development
];

// Known corporate foundations to explicitly search for
const CORPORATE_FOUNDATION_SEARCHES = [
  "Honda Foundation",
  "Honda USA Foundation",
  "Toshiba Foundation",
  "Toshiba America Foundation",
  "Lowes Foundation",
  "Lowe's Foundation",
  "Verizon Foundation",
];

// ============================================
// Client Implementation
// ============================================

export class CandidClient extends BaseClient {
  private apiKey: string;

  constructor() {
    super(CONFIG);
    const key = process.env.CANDID_API_KEY;
    if (!key) {
      this.warn("CANDID_API_KEY not set - Candid client will not function");
    }
    this.apiKey = key || "";
  }

  // ============================================
  // BaseClient Abstract Method Implementations
  // ============================================

  /**
   * Fetch education-focused funders from Candid
   */
  async fetchGrants(): Promise<FetchResult<CandidFunder>> {
    if (!this.apiKey) {
      this.warn("Skipping Candid - no API key configured");
      return { data: [], totalCount: 0, hasMore: false };
    }

    this.log("Fetching education grants from Candid API...");

    const allFunders: CandidFunder[] = [];
    const seenKeys = new Set<string>();

    // Search by education subject codes
    for (const subjectCode of EDUCATION_SUBJECT_CODES) {
      try {
        this.log(`  Searching subject code: ${subjectCode}...`);

        const funders = await this.searchFunders({
          subject: [subjectCode],
          min_amt: 10000, // Focus on meaningful grants
          sort_by: "amount",
          sort_order: "desc",
        });

        for (const funder of funders) {
          if (!seenKeys.has(funder.funder_key)) {
            seenKeys.add(funder.funder_key);
            allFunders.push(funder);
          }
        }

        this.log(`    Found ${funders.length} funders`);
        await this.delay(500);
      } catch (error) {
        this.error(`  Error searching ${subjectCode}:`, (error as Error).message);
      }
    }

    // Also search for known corporate foundations
    for (const term of CORPORATE_FOUNDATION_SEARCHES) {
      try {
        this.log(`  Searching corporate: "${term}"...`);
        const funders = await this.searchFunders({ query: term });

        for (const funder of funders) {
          if (!seenKeys.has(funder.funder_key)) {
            seenKeys.add(funder.funder_key);
            allFunders.push(funder);
          }
        }
        await this.delay(500);
      } catch (error) {
        this.error(`  Error searching "${term}":`, (error as Error).message);
      }
    }

    this.log(`Total unique Candid funders: ${allFunders.length}`);

    return {
      data: allFunders,
      totalCount: allFunders.length,
      hasMore: false,
    };
  }

  /**
   * Normalize a Candid funder to internal schema
   */
  normalizeGrant(funder: CandidFunder): NormalizedGrant {
    // Determine if corporate or private foundation
    const isCorporate = this.isCorporateFunder(funder.funder_name);

    // Estimate typical grant range from total giving
    const avgGrantSize = funder.count > 0 ? funder.amount / funder.count : 0;
    const fundingMin = Math.round(avgGrantSize * 0.5);
    const fundingMax = Math.round(avgGrantSize * 2);

    // Set far future deadline (foundations accept applications ongoing)
    const deadline = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000);

    const category: GrantCategory = isCorporate
      ? "CORPORATE"
      : "PRIVATE_FOUNDATION";
    const sourceType: GrantSourceType = isCorporate
      ? "CORPORATE"
      : "PRIVATE_FOUNDATION";

    return {
      title: funder.funder_name,
      category,
      sourceType,
      fundingAmountMin: fundingMin,
      fundingAmountMax: fundingMax,
      deadline,
      externalId: funder.funder_key,
      sourceUrl:
        funder.profile_url ||
        `https://candid.org/profile/${funder.ein || funder.funder_key}`,
      cfda: undefined,
      agencyCode: undefined,
      description: this.buildDescription(funder, isCorporate),
      eligibilityCriteria: undefined,
      applicationUrl: funder.profile_url,
      requirements: {
        ein: funder.ein,
        totalGiving: funder.amount,
        grantCount: funder.count,
        sealLevel: funder.seal_level,
        lastUpdated: funder.last_updated,
        location: `${funder.funder_city || "Unknown"}, ${funder.funder_state || "Unknown"}`,
      },
      isActive: true,
    };
  }

  /**
   * Get external ID from raw funder data
   */
  getExternalId(funder: CandidFunder): string {
    return funder.funder_key;
  }

  // ============================================
  // Public API Methods
  // ============================================

  /**
   * Search for funders by criteria
   */
  async searchFunders(params: CandidSearchParams): Promise<CandidFunder[]> {
    const url = new URL(`${this.config.baseUrl}/funders`);

    if (params.query) url.searchParams.set("query", params.query);
    if (params.subject) url.searchParams.set("subject", params.subject.join(","));
    if (params.year) url.searchParams.set("year", params.year.join(","));
    if (params.min_amt)
      url.searchParams.set("min_amt", params.min_amt.toString());
    if (params.max_amt)
      url.searchParams.set("max_amt", params.max_amt.toString());
    if (params.page) url.searchParams.set("page", params.page.toString());
    url.searchParams.set("sort_by", params.sort_by || "amount");
    url.searchParams.set("sort_order", params.sort_order || "desc");

    const data = await this.fetchJson<{ funders?: CandidFunder[] }>(
      url.toString(),
      { headers: this.getHeaders() }
    );

    return data.funders || [];
  }

  /**
   * Search for transactions (individual grants)
   */
  async searchTransactions(
    params: CandidSearchParams
  ): Promise<CandidTransaction[]> {
    const url = new URL(`${this.config.baseUrl}/transactions`);

    if (params.query) url.searchParams.set("query", params.query);
    if (params.subject) url.searchParams.set("subject", params.subject.join(","));
    if (params.year) url.searchParams.set("year", params.year.join(","));
    if (params.min_amt)
      url.searchParams.set("min_amt", params.min_amt.toString());
    if (params.page) url.searchParams.set("page", params.page.toString());

    const data = await this.fetchJson<{ transactions?: CandidTransaction[] }>(
      url.toString(),
      { headers: this.getHeaders() }
    );

    return data.transactions || [];
  }

  /**
   * Get a specific funder by ID
   */
  async getFunder(funderId: string): Promise<CandidFunder | null> {
    try {
      const url = `${this.config.baseUrl}/funders/${funderId}`;
      return await this.fetchJson<CandidFunder>(url, {
        headers: this.getHeaders(),
      });
    } catch {
      return null;
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Get headers for API requests
   */
  private getHeaders(): Record<string, string> {
    return {
      "Subscription-Key": this.apiKey,
      "Content-Type": "application/json",
    };
  }

  /**
   * Check if a funder name indicates a corporate foundation
   */
  private isCorporateFunder(name: string): boolean {
    const corporateIndicators = [
      "honda",
      "toshiba",
      "lowes",
      "lowe's",
      "verizon",
      "walmart",
      "target",
      "microsoft",
      "google",
      "apple",
      "coca-cola",
      "pepsi",
      "toyota",
      "ford",
      "intel",
      "corporate",
      "company",
      "inc.",
      "corp.",
      "llc",
    ];
    const lower = name.toLowerCase();
    return corporateIndicators.some((indicator) => lower.includes(indicator));
  }

  /**
   * Build a description for the funder
   */
  private buildDescription(funder: CandidFunder, isCorporate: boolean): string {
    const type = isCorporate ? "Corporate" : "Private";
    const location =
      funder.funder_city && funder.funder_state
        ? `${funder.funder_city}, ${funder.funder_state}`
        : "Unknown location";

    let desc = `${type} foundation based in ${location}.`;
    desc += ` Total giving: $${funder.amount.toLocaleString()} across ${funder.count} grants.`;

    if (funder.seal_level) {
      desc += ` GuideStar Seal: ${funder.seal_level}.`;
    }

    return desc;
  }
}

// ============================================
// Self-Registration
// ============================================

registerClient(new CandidClient());

// Export for direct access if needed
export const candidClient = new CandidClient();
