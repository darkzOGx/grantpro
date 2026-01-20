/**
 * NSF Awards API Client
 *
 * Free public API for National Science Foundation award data.
 * API Docs: https://www.nsf.gov/developer/
 *
 * Use cases:
 * - STEM research grants with K-12 outreach components
 * - University partnerships for school districts
 * - "Broader Impacts" funding opportunities
 */

import { GrantCategory, GrantSourceType } from "@prisma/client";
import { BaseClient, ClientConfig, FetchResult } from "./BaseClient";
import { registerClient } from "../registry";
import { NSFAward, NSFSearchParams, NormalizedGrant } from "../types";

// ============================================
// Configuration
// ============================================

const CONFIG: ClientConfig = {
  name: "nsf_awards",
  displayName: "NSF Awards",
  sourceType: "FEDERAL_API",
  baseUrl: "https://api.nsf.gov/services/v1",
  rateLimit: { requestsPerSecond: 2 },
};

// Education-focused keywords
const EDUCATION_KEYWORDS = [
  "K-12 education",
  "STEM education",
  "K-12 outreach",
  "science education",
  "teacher professional development",
  "educational technology",
  "broadening participation",
];

// ============================================
// Client Implementation
// ============================================

export class NSFAwardsClient extends BaseClient {
  constructor() {
    super(CONFIG);
  }

  // ============================================
  // BaseClient Abstract Method Implementations
  // ============================================

  /**
   * Fetch education-focused NSF awards
   */
  async fetchGrants(): Promise<FetchResult<NSFAward>> {
    this.log("Fetching education-focused NSF awards...");

    const allAwards: NSFAward[] = [];
    const seenIds = new Set<string>();

    for (const keyword of EDUCATION_KEYWORDS) {
      try {
        this.log(`  Searching: "${keyword}"...`);

        // Get recent awards (last 2 years)
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const dateStart = `${String(twoYearsAgo.getMonth() + 1).padStart(2, "0")}/01/${twoYearsAgo.getFullYear()}`;

        const { awards, total } = await this.searchAwards({
          keyword,
          dateStart,
          resultsPerPage: 25,
        });

        this.log(`    Found ${awards.length} of ${total} total`);

        for (const award of awards) {
          if (!seenIds.has(award.id)) {
            seenIds.add(award.id);
            allAwards.push(award);
          }
        }

        await this.delay(500); // Rate limiting
      } catch (error) {
        this.error(`  Error searching "${keyword}":`, (error as Error).message);
      }
    }

    this.log(`Total unique NSF education awards: ${allAwards.length}`);

    return {
      data: allAwards,
      totalCount: allAwards.length,
      hasMore: false,
    };
  }

  /**
   * Normalize an NSF award to internal schema
   */
  normalizeGrant(award: NSFAward): NormalizedGrant {
    // Parse funding amount
    const fundingAmount = parseInt(award.estimatedTotalAmt || "0", 10);

    // Parse deadline (use expiration date)
    let deadline: Date;
    try {
      if (award.expDate) {
        // NSF dates are MM/DD/YYYY
        const parts = award.expDate.split("/");
        deadline = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
      } else {
        deadline = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      }
    } catch {
      deadline = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    const piName = [award.piFirstName, award.piLastName]
      .filter(Boolean)
      .join(" ");

    return {
      title: award.title,
      category: "STEM" as GrantCategory, // All NSF awards are STEM
      sourceType: "FEDERAL" as GrantSourceType,
      fundingAmountMin: fundingAmount,
      fundingAmountMax: fundingAmount,
      deadline,
      externalId: award.id,
      sourceUrl: `https://www.nsf.gov/awardsearch/showAward?AWD_ID=${award.id}`,
      cfda: "47.076", // NSF Education and Human Resources
      agencyCode: "NSF",
      description: award.abstractText,
      eligibilityCriteria: undefined,
      applicationUrl: undefined,
      requirements: {
        awardee: award.awardeeName,
        awardeeLocation: `${award.awardeeCity}, ${award.awardeeStateCode}`,
        principalInvestigator: piName,
        piEmail: award.piEmail,
        programName: award.fundProgramName || award.primaryProgram,
      },
      isActive: deadline > new Date(),
    };
  }

  /**
   * Get external ID from raw award data
   */
  getExternalId(award: NSFAward): string {
    return award.id;
  }

  // ============================================
  // Public API Methods
  // ============================================

  /**
   * Search for NSF awards
   */
  async searchAwards(
    params: NSFSearchParams
  ): Promise<{ awards: NSFAward[]; total: number }> {
    const urlParams = new URLSearchParams();

    // Required fields to return
    urlParams.append(
      "printFields",
      [
        "id",
        "title",
        "abstractText",
        "awardeeName",
        "awardeeCity",
        "awardeeStateCode",
        "startDate",
        "expDate",
        "estimatedTotalAmt",
        "fundsObligatedAmt",
        "piFirstName",
        "piLastName",
        "piEmail",
        "coPDPI",
        "fundProgramName",
        "primaryProgram",
        "projectOutComesReport",
      ].join(",")
    );

    // Search keyword
    if (params.keyword) {
      urlParams.append("keyword", params.keyword);
    }

    // Program name filter
    if (params.fundProgramName) {
      urlParams.append("fundProgramName", params.fundProgramName);
    }

    // Date range
    if (params.dateStart) {
      urlParams.append("dateStart", params.dateStart); // MM/DD/YYYY
    }
    if (params.dateEnd) {
      urlParams.append("dateEnd", params.dateEnd);
    }

    // Pagination
    urlParams.append("offset", String(params.offset || 1));
    urlParams.append("rpp", String(params.resultsPerPage || 25)); // max 25

    const url = `${this.config.baseUrl}/awards.json?${urlParams}`;
    const data = await this.fetchJson<{
      response: { award?: NSFAward[]; totalRecords?: string };
    }>(url);

    // NSF wraps response in "response" object
    const awards = data.response?.award || [];
    const total = parseInt(data.response?.totalRecords || "0", 10);

    return { awards, total };
  }

  /**
   * Get single award by ID
   */
  async getAward(awardId: string): Promise<NSFAward | null> {
    const url = `${this.config.baseUrl}/awards/${awardId}.json?printFields=id,title,abstractText,awardeeName,awardeeCity,awardeeStateCode,startDate,expDate,estimatedTotalAmt,fundsObligatedAmt,piFirstName,piLastName,piEmail,fundProgramName,primaryProgram,projectOutComesReport`;

    try {
      const data = await this.fetchJson<{
        response: { award?: NSFAward[] };
      }>(url);
      const awards = data.response?.award || [];
      return awards[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Search for active DRK-12 program awards
   * DRK-12 (Discovery Research PreK-12) is NSF's main K-12 program
   */
  async searchDRK12Awards(): Promise<NSFAward[]> {
    this.log("Fetching DRK-12 program awards...");

    try {
      const { awards } = await this.searchAwards({
        fundProgramName: "DRK-12",
        resultsPerPage: 25,
      });
      return awards;
    } catch (error) {
      this.error("Error fetching DRK-12 awards:", error);
      return [];
    }
  }
}

// ============================================
// Self-Registration
// ============================================

registerClient(new NSFAwardsClient());

// Export for direct access if needed
export const nsfAwardsClient = new NSFAwardsClient();
