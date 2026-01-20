/**
 * Grants.gov API Client
 *
 * RESTful API for searching and retrieving federal grant opportunities.
 * Supports both Simpler.Grants.gov (modern) and legacy Grants.gov APIs.
 */

import { GrantCategory, GrantSourceType } from "@prisma/client";
import { BaseClient, ClientConfig, FetchResult } from "./BaseClient";
import { registerClient } from "../registry";
import {
  GrantsGovSearchParams,
  GrantsGovSearchHit,
  GrantsGovOpportunity,
  NormalizedGrant,
  inferCategoryFromCFDA,
  inferCategoryFromKeywords,
} from "../types";

// ============================================
// Configuration
// ============================================

const CONFIG: ClientConfig = {
  name: "grants_gov",
  displayName: "Grants.gov",
  sourceType: "FEDERAL_API",
  baseUrl: "https://api.simpler.grants.gov/v1",
  rateLimit: { requestsPerSecond: 5, burstLimit: 10 },
};

const GRANTS_GOV_LEGACY_URL = "https://apply07.grants.gov/grantsws/rest";

// Education-related keywords for school districts
const EDUCATION_KEYWORDS = [
  "education",
  "school",
  "K-12",
  "student",
  "teacher",
  "classroom",
  "STEM education",
  "arts education",
  "nutrition",
  "school lunch",
  "early childhood",
  "literacy",
  "after school",
  "youth development",
];

// ============================================
// Client Implementation
// ============================================

export class GrantsGovClient extends BaseClient {
  private apiKey?: string;

  constructor() {
    super(CONFIG);
    this.apiKey = process.env.GRANTS_GOV_API_KEY;
  }

  // ============================================
  // BaseClient Abstract Method Implementations
  // ============================================

  /**
   * Fetch education-related grant opportunities
   */
  async fetchGrants(): Promise<FetchResult<GrantsGovOpportunity>> {
    this.log("Fetching school district relevant grants...");

    const allHits: GrantsGovSearchHit[] = [];
    const batchSize = 100;

    // Search with multiple keywords to get diverse results
    for (const keyword of EDUCATION_KEYWORDS) {
      this.log(`  Searching: "${keyword}"...`);

      try {
        const result = await this.searchOpportunities({
          keyword,
          oppStatus: "posted",
          rows: batchSize,
          startRecordNum: 0,
        });

        this.log(`    Found ${result.hits.length} grants for "${keyword}"`);
        allHits.push(...result.hits);
      } catch (error) {
        this.warn(`    Error searching "${keyword}": ${(error as Error).message}`);
      }

      // Use inherited rate limiting
      await this.delay(200);
    }

    // Deduplicate by ID
    const uniqueHits = Array.from(
      new Map(allHits.map((hit) => [hit.id, hit])).values()
    );

    this.log(`Found ${uniqueHits.length} unique education-related grants. Processing...`);

    // Fetch details for each (in parallel batches)
    const detailedGrants: GrantsGovOpportunity[] = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < uniqueHits.length; i += BATCH_SIZE) {
      const batch = uniqueHits.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async (hit) => {
        const details = await this.getOpportunityDetails(hit.id);

        if (details) {
          return {
            ...details,
            opportunityId: details.opportunityId || hit.id,
            opportunityTitle: details.opportunityTitle || hit.title,
          };
        } else {
          // Fallback to basic info from search hit
          return this.createFallbackOpportunity(hit);
        }
      });

      const results = await Promise.all(promises);
      detailedGrants.push(...(results.filter(Boolean) as GrantsGovOpportunity[]));

      await this.delay(100);
    }

    return {
      data: detailedGrants,
      totalCount: detailedGrants.length,
      hasMore: false,
    };
  }

  /**
   * Normalize a Grants.gov opportunity to internal schema
   */
  normalizeGrant(opp: GrantsGovOpportunity): NormalizedGrant {
    // Extract CFDA number if available
    const cfda = opp.cfdaList?.[0]?.cfdaNumber;

    // Determine category from CFDA or keywords
    let category: GrantCategory = "FEDERAL";
    if (cfda) {
      category = inferCategoryFromCFDA(cfda);
    } else {
      const text = `${opp.opportunityTitle} ${opp.synopsis?.synopsisDesc || ""} ${opp.categoryOfFunding || ""}`;
      category = inferCategoryFromKeywords(text);
    }

    // Parse funding amounts
    const fundingAmountMin = opp.awardFloor || 0;
    const fundingAmountMax =
      opp.awardCeiling || opp.estimatedTotalProgramFunding || fundingAmountMin;

    // Parse deadline
    let deadline: Date;
    try {
      deadline = opp.closeDate
        ? new Date(opp.closeDate)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    } catch {
      deadline = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    // Generate appropriate URL based on ID format
    // UUIDs (from Simpler API) use simpler.grants.gov
    // Numeric IDs (from legacy API) use grants.gov
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        opp.opportunityId
      );
    const grantUrl = isUUID
      ? `https://simpler.grants.gov/opportunity/${opp.opportunityId}`
      : `https://www.grants.gov/search-results-detail/${opp.opportunityId}`;

    return {
      title: opp.opportunityTitle,
      category,
      sourceType: "FEDERAL" as GrantSourceType,
      fundingAmountMin,
      fundingAmountMax,
      deadline,
      externalId: opp.opportunityId,
      sourceUrl: grantUrl,
      cfda,
      agencyCode: opp.agencyCode || opp.owningAgencyCode,
      description: opp.synopsis?.synopsisDesc,
      eligibilityCriteria: [
        ...(opp.eligibleApplicants || []),
        opp.additionalEligibilityInfo,
      ]
        .filter(Boolean)
        .join("\n"),
      applicationUrl: grantUrl,
      requirements: {
        eligibleApplicants: opp.eligibleApplicants,
        fundingInstrumentType: opp.fundingInstrumentType,
        categoryOfFunding: opp.categoryOfFunding,
        costSharing: opp.costSharing,
        expectedNumberOfAwards: opp.expectedNumberOfAwards,
        cfdaList: opp.cfdaList,
      },
      isActive: opp.oppStatus === "posted",
    };
  }

  /**
   * Get external ID from raw opportunity data
   */
  getExternalId(opp: GrantsGovOpportunity): string {
    return opp.opportunityId;
  }

  // ============================================
  // Public API Methods
  // ============================================

  /**
   * Search for grant opportunities using filters
   */
  async searchOpportunities(
    params: GrantsGovSearchParams
  ): Promise<{ totalCount: number; hits: GrantsGovSearchHit[] }> {
    // If we have an API key, try Simpler.Grants.gov first
    if (this.apiKey) {
      try {
        return await this.searchSimpler(params);
      } catch (e) {
        this.log(
          "Simpler API failed, falling back to legacy:",
          (e as Error).message
        );
      }
    }
    // Fallback to legacy API
    return await this.searchLegacy(params);
  }

  /**
   * Fetch detailed information for a specific opportunity ID
   */
  async getOpportunityDetails(
    opportunityId: string
  ): Promise<GrantsGovOpportunity | null> {
    const url = `${GRANTS_GOV_LEGACY_URL}/opportunities/${opportunityId}`;

    try {
      // Try POST first (Grants.gov often uses POST even for retrieval)
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey && { "X-Api-Key": this.apiKey }),
        },
        body: JSON.stringify({}),
      });

      // If POST fails, try GET
      if (response.status === 404 || response.status === 405) {
        const getResponse = await fetch(url, {
          method: "GET",
          headers: {
            ...(this.apiKey && { "X-Api-Key": this.apiKey }),
          },
        });

        if (!getResponse.ok) {
          return null;
        }
        return getResponse.json();
      }

      if (!response.ok) {
        return null;
      }
      return response.json();
    } catch (e) {
      this.error(`Failed to fetch details for ${opportunityId}`, e);
      return null;
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private async searchSimpler(
    params: GrantsGovSearchParams
  ): Promise<{ totalCount: number; hits: GrantsGovSearchHit[] }> {
    const url = "https://api.simpler.grants.gov/v1/opportunities/search";

    const requestBody: Record<string, unknown> = {
      pagination: {
        page_size: params.rows || 100,
        page_offset:
          Math.floor((params.startRecordNum || 0) / (params.rows || 100)) + 1,
        order_by: "post_date",
        sort_direction: "descending",
      },
      filters: {
        opportunity_status: { one_of: ["posted"] },
      },
    };

    if (params.keyword) {
      requestBody.query = params.keyword;
    }

    if (params.agency) {
      (requestBody.filters as Record<string, unknown>).agency = {
        one_of: [params.agency],
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey || "",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Simpler API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    // Map the response to our hit format
    const hits = (data.data || []).map((opp: Record<string, unknown>) => ({
      id: String(opp.opportunity_id || opp.id),
      number: (opp.opportunity_number as string) || "",
      title: (opp.opportunity_title as string) || (opp.title as string) || "",
      agency: (opp.agency_code as string) || (opp.agency as string) || "",
      openDate: (opp.post_date as string) || "",
      closeDate: (opp.close_date as string) || "",
      cfdaList: opp.assistance_listing_number
        ? [opp.assistance_listing_number as string]
        : [],
    }));

    return {
      totalCount: data.pagination?.total_records || hits.length,
      hits,
    };
  }

  private async searchLegacy(
    params: GrantsGovSearchParams
  ): Promise<{ totalCount: number; hits: GrantsGovSearchHit[] }> {
    const url = `${GRANTS_GOV_LEGACY_URL}/opportunities/search`;

    const searchCriteria: Record<string, unknown> = {};

    if (params.keyword) searchCriteria.keyword = params.keyword;
    if (params.opportunityId) searchCriteria.opportunityId = params.opportunityId;
    if (params.fundingInstrumentType)
      searchCriteria.fundingInstrumentType = params.fundingInstrumentType;
    if (params.agency) searchCriteria.agency = params.agency;
    if (params.oppStatus) searchCriteria.oppStatus = params.oppStatus;
    if (params.postedDateRange)
      searchCriteria.postedDateRange = params.postedDateRange;
    if (params.eligibility) searchCriteria.eligibility = params.eligibility;

    const requestBody = {
      searchCriteria,
      pagination: {
        rows: params.rows || 100,
        startRecordNum: params.startRecordNum || 0,
        sortBy: params.sortBy || "openDate",
        sortOrder: "desc",
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey && { Authorization: `APIKEY=${this.apiKey}` }),
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Legacy API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    return {
      totalCount: data.rowCount || 0,
      hits: (data.oppHits || []) as GrantsGovSearchHit[],
    };
  }

  private createFallbackOpportunity(hit: GrantsGovSearchHit): GrantsGovOpportunity {
    return {
      opportunityId: hit.id,
      opportunityTitle: hit.title,
      opportunityNumber: hit.number,
      owningAgencyCode: hit.agency,
      openDate: hit.openDate,
      closeDate: hit.closeDate,
      oppStatus: "posted",
      cfdaList:
        hit.cfdaList?.map((c) => ({ cfdaNumber: c, programTitle: "" })) || [],
      synopsis: { synopsisDesc: "" },
      eligibleApplicants: [],
      fundingInstrumentType: "GRANT",
      categoryOfFunding: "O",
    };
  }
}

// ============================================
// Self-Registration
// ============================================

registerClient(new GrantsGovClient());

// Export for direct access if needed
export const grantsGovClient = new GrantsGovClient();
