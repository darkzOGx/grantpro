/**
 * ProPublica Nonprofit Explorer API Client
 *
 * Accesses IRS 990 data for private foundations to build funder profiles.
 * API Reference: https://projects.propublica.org/nonprofits/api
 */

import { GrantCategory, GrantSourceType } from "@prisma/client";
import { BaseClient, ClientConfig, FetchResult } from "./BaseClient";
import { registerClient } from "../registry";
import {
  ProPublicaOrganization,
  ProPublicaFiling,
  NormalizedGrant,
} from "../types";

// ============================================
// Configuration
// ============================================

const CONFIG: ClientConfig = {
  name: "propublica",
  displayName: "ProPublica Nonprofit Explorer",
  sourceType: "FOUNDATION_990",
  baseUrl: "https://projects.propublica.org/nonprofits/api/v2",
  rateLimit: { requestsPerSecond: 2 },
};

// Search terms for education foundations
const EDUCATION_SEARCH_TERMS = [
  "education foundation",
  "school foundation",
  "scholarship fund",
  "youth foundation",
  "learning foundation",
];

// NTEE codes for education-related organizations
const EDUCATION_NTEE_CODES = [
  "B", // Education (general)
  "B01",
  "B02", // Alliance/Advocacy, Management & Technical Assistance
  "B11",
  "B12", // Early Childhood, Elementary Education
  "B20", // Elementary, Secondary Education
  "B21", // Kindergarten, Preschool
  "B24", // Primary, Elementary Schools
  "B25", // Secondary, High School
  "B28", // Specialized Education Institutions
  "B29", // Charter Schools
  "B30", // Vocational, Technical Schools
  "B40", // Higher Education Institutions
  "B50", // Graduate, Professional Schools
  "B60", // Adult, Continuing Education
  "B70", // Libraries
  "B80", // Student Services, Organizations of Students
  "B82", // Scholarships, Student Financial Aid Services
  "B83", // Student Sororities, Fraternities
  "B84", // Alumni Associations
  "B90",
  "B92", // Educational Services, Remedial Reading, Math
  "B94", // Parent/Teacher Group
  "B99", // Education N.E.C.
];

// ============================================
// Client Implementation
// ============================================

export class ProPublicaClient extends BaseClient {
  constructor() {
    super(CONFIG);
  }

  // ============================================
  // BaseClient Abstract Method Implementations
  // ============================================

  /**
   * Fetch education-focused foundations
   */
  async fetchGrants(): Promise<FetchResult<ProPublicaOrganization>> {
    this.log("Fetching education foundations from ProPublica...");

    const allFoundations: ProPublicaOrganization[] = [];
    const seenEins = new Set<string>();

    for (const term of EDUCATION_SEARCH_TERMS) {
      try {
        this.log(`  Searching: "${term}"...`);
        const results = await this.searchFoundations(term);

        for (const org of results) {
          if (!seenEins.has(org.ein)) {
            seenEins.add(org.ein);
            allFoundations.push(org);
          }
        }

        await this.delay(500); // Rate limiting
      } catch (error) {
        this.error(`Error searching for "${term}":`, error);
      }
    }

    // Score and filter by education relevance
    const scored = allFoundations.map((org) => ({
      org,
      score: this.calculateEducationRelevance(org),
    }));

    const relevantFoundations = scored
      .filter((s) => s.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.org);

    this.log(`Found ${relevantFoundations.length} education-relevant foundations`);

    return {
      data: relevantFoundations,
      totalCount: relevantFoundations.length,
      hasMore: false,
    };
  }

  /**
   * Normalize a ProPublica foundation to internal schema
   */
  normalizeGrant(org: ProPublicaOrganization): NormalizedGrant {
    // Estimate funding: use 5% of assets (typical foundation payout rate)
    const estimatedGiving =
      (org.asset_amount ? Math.round(org.asset_amount * 0.05) : 0) ||
      org.income_amount ||
      0;

    // Set a reasonable min (typical small grant) and max (estimated giving capacity)
    const fundingMin = estimatedGiving > 0 ? Math.min(1000, estimatedGiving) : 0;
    const fundingMax = estimatedGiving;

    // Foundations don't have deadlines - set far future
    const deadline = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000);

    return {
      title: org.name,
      category: "PRIVATE_FOUNDATION" as GrantCategory,
      sourceType: "PRIVATE_FOUNDATION" as GrantSourceType,
      fundingAmountMin: fundingMin,
      fundingAmountMax: fundingMax,
      deadline,
      externalId: String(org.ein),
      sourceUrl: `https://projects.propublica.org/nonprofits/organizations/${org.ein}`,
      cfda: undefined,
      agencyCode: undefined,
      description: `Private foundation based in ${org.city}, ${org.state}. NTEE Code: ${org.ntee_code || "Unknown"}`,
      eligibilityCriteria: undefined,
      applicationUrl: undefined,
      requirements: {
        nteeCode: org.ntee_code,
        assets: org.asset_amount,
        annualRevenue: org.revenue_amount,
      },
      isActive: true,
    };
  }

  /**
   * Get external ID from raw organization data
   */
  getExternalId(org: ProPublicaOrganization): string {
    return String(org.ein);
  }

  // ============================================
  // Public API Methods
  // ============================================

  /**
   * Search for nonprofit organizations by keyword
   */
  async searchOrganizations(
    query: string,
    state?: string
  ): Promise<ProPublicaOrganization[]> {
    const params = new URLSearchParams({ q: query });
    if (state) {
      params.append("state", state.toUpperCase());
    }

    const url = `${this.config.baseUrl}/search.json?${params}`;
    const data = await this.fetchJson<{ organizations?: ProPublicaOrganization[] }>(
      url
    );
    return (data.organizations || []) as ProPublicaOrganization[];
  }

  /**
   * Get organization details by EIN
   */
  async getOrganization(ein: string): Promise<{
    organization: ProPublicaOrganization;
    filings: ProPublicaFiling[];
  }> {
    // Clean EIN (remove dashes)
    const cleanEin = ein.replace(/-/g, "");
    const url = `${this.config.baseUrl}/organizations/${cleanEin}.json`;

    const data = await this.fetchJson<{
      organization: ProPublicaOrganization;
      filings_with_data?: ProPublicaFiling[];
    }>(url);

    return {
      organization: data.organization as ProPublicaOrganization,
      filings: (data.filings_with_data || []) as ProPublicaFiling[],
    };
  }

  /**
   * Search for private foundations (990-PF filers)
   */
  async searchFoundations(query: string): Promise<ProPublicaOrganization[]> {
    const orgs = await this.searchOrganizations(query);

    // Filter for likely foundations
    return orgs.filter((org) => {
      // T codes are typically philanthropic organizations
      return (
        org.ntee_code?.startsWith("T") ||
        org.name.toLowerCase().includes("foundation") ||
        org.name.toLowerCase().includes("fund")
      );
    });
  }

  /**
   * Get the most recent 990-PF filing for a foundation
   */
  async getLatestFiling(ein: string): Promise<ProPublicaFiling | null> {
    try {
      const { filings } = await this.getOrganization(ein);

      // Find most recent 990-PF filing
      const pf990s = filings
        .filter((f) => f.formtype === "990PF")
        .sort((a, b) => b.tax_prd_yr - a.tax_prd_yr);

      return pf990s[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Build a funder profile with historical giving data
   */
  async buildFunderProfile(ein: string): Promise<{
    organization: ProPublicaOrganization;
    filings: ProPublicaFiling[];
    totalAssets?: number;
    avgAnnualGiving?: number;
  }> {
    const { organization, filings } = await this.getOrganization(ein);

    // Calculate metrics from filings
    const pf990s = filings.filter((f) => f.formtype === "990PF");

    const totalAssets =
      organization.asset_amount || pf990s[0]?.totassetsend || 0;

    // Estimate average giving from total expenses (rough proxy)
    const recentFilings = pf990s.slice(0, 3);
    const avgAnnualGiving =
      recentFilings.length > 0
        ? recentFilings.reduce((sum, f) => sum + (f.totfuncexpns || 0), 0) /
          recentFilings.length
        : 0;

    return {
      organization,
      filings: pf990s,
      totalAssets,
      avgAnnualGiving,
    };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Check if organization funds education based on NTEE code
   */
  private isEducationFunder(nteeCode?: string): boolean {
    if (!nteeCode) return false;
    return EDUCATION_NTEE_CODES.some((code) =>
      nteeCode.toUpperCase().startsWith(code)
    );
  }

  /**
   * Calculate education relevance score (0-1)
   */
  private calculateEducationRelevance(org: ProPublicaOrganization): number {
    let score = 0;

    // NTEE code match
    if (this.isEducationFunder(org.ntee_code)) {
      score += 0.5;
    }

    // Name contains education keywords
    const eduKeywords = [
      "education",
      "school",
      "student",
      "scholar",
      "learn",
      "teach",
    ];
    const nameMatch = eduKeywords.some((kw) =>
      org.name.toLowerCase().includes(kw)
    );
    if (nameMatch) score += 0.3;

    // Has meaningful assets (> $100k suggests active foundation)
    if (org.asset_amount && org.asset_amount > 100000) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }
}

// ============================================
// Self-Registration
// ============================================

registerClient(new ProPublicaClient());

// Export for direct access if needed
export const proPublicaClient = new ProPublicaClient();
