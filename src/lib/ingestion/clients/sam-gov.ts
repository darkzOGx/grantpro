/**
 * SAM.gov Assistance Listings API Client
 *
 * Accesses Federal Assistance Listings (formerly CFDA programs).
 * API Reference: https://open.gsa.gov/api/sam-entity-extracts/
 *
 * Use cases:
 * - Federal program metadata
 * - CFDA program details
 * - Eligibility and application requirements
 */

import { GrantCategory, GrantSourceType } from "@prisma/client";
import { BaseClient, ClientConfig, FetchResult } from "./BaseClient";
import { registerClient } from "../registry";
import { SamAssistanceListing, NormalizedGrant, inferCategoryFromCFDA } from "../types";

// ============================================
// Configuration
// ============================================

const CONFIG: ClientConfig = {
  name: "sam_gov",
  displayName: "SAM.gov Assistance Listings",
  sourceType: "FEDERAL_API",
  baseUrl: "https://api.sam.gov/prod/fal/v1",
  rateLimit: { requestsPerSecond: 1 }, // SAM.gov has strict limits
};

// Education-related CFDA prefixes
const EDUCATION_CFDA_PREFIXES = [
  "84", // Department of Education
  "10", // USDA (school meals)
  "45", // NEA/NEH Arts
  "47", // NSF
  "93", // HHS (Head Start, etc.)
];

// ============================================
// Client Implementation
// ============================================

export class SamGovClient extends BaseClient {
  private apiKey: string;

  constructor() {
    super(CONFIG);
    const key = process.env.SAM_GOV_API_KEY;
    if (!key) {
      this.warn("SAM_GOV_API_KEY not set - SAM.gov client will not function");
    }
    this.apiKey = key || "";
  }

  // ============================================
  // BaseClient Abstract Method Implementations
  // ============================================

  /**
   * Fetch education-related assistance listings
   */
  async fetchGrants(): Promise<FetchResult<SamAssistanceListing>> {
    if (!this.apiKey) {
      this.warn("Skipping SAM.gov - no API key configured");
      return { data: [], totalCount: 0, hasMore: false };
    }

    this.log("Fetching Assistance Listings from SAM.gov...");

    const allListings: SamAssistanceListing[] = [];
    const seenNumbers = new Set<string>();

    for (const prefix of EDUCATION_CFDA_PREFIXES) {
      try {
        this.log(`  Fetching listings for CFDA prefix ${prefix}...`);
        const results = await this.searchListingsByPrefix(prefix);

        for (const listing of results) {
          if (!seenNumbers.has(listing.assistanceListingNumber)) {
            seenNumbers.add(listing.assistanceListingNumber);
            allListings.push(listing);
          }
        }

        this.log(`    Found ${results.length} listings`);
        await this.delay(1000); // SAM.gov has strict rate limits
      } catch (error) {
        this.error(
          `  Error fetching CFDA ${prefix}.*:`,
          (error as Error).message
        );
      }
    }

    this.log(`Total unique SAM.gov listings: ${allListings.length}`);

    return {
      data: allListings,
      totalCount: allListings.length,
      hasMore: false,
    };
  }

  /**
   * Normalize a SAM.gov assistance listing to internal schema
   */
  normalizeGrant(listing: SamAssistanceListing): NormalizedGrant {
    // Infer category from CFDA number
    const category = inferCategoryFromCFDA(listing.assistanceListingNumber);

    // Parse most recent obligation for funding estimate
    const latestObligation = listing.obligations?.[0];
    const fundingAmount = latestObligation?.amount || 0;

    // Federal programs are ongoing - set far future deadline
    const deadline = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    return {
      title: listing.programTitle,
      category,
      sourceType: "FEDERAL" as GrantSourceType,
      fundingAmountMin: 0,
      fundingAmountMax: fundingAmount,
      deadline,
      externalId: listing.assistanceListingNumber,
      sourceUrl: `https://sam.gov/fal/${listing.assistanceListingNumber.replace(".", "")}`,
      cfda: listing.assistanceListingNumber,
      agencyCode: listing.federalAgency,
      description: listing.objectives,
      eligibilityCriteria: listing.applicantEligibility,
      applicationUrl: listing.website,
      requirements: {
        typesOfAssistance: listing.typesOfAssistance,
        beneficiaryEligibility: listing.beneficiaryEligibility,
        applicationProcedures: listing.applicationProcedures,
        useAndUseRestrictions: listing.useAndUseRestrictions,
        preApplicationCoordination: listing.preApplicationCoordination,
        relatedPrograms: listing.relatedPrograms,
        deadlines: listing.deadlines,
        rangeOfApprovalDisapprovalTime: listing.rangeOfApprovalDisapprovalTime,
      },
      isActive: true,
    };
  }

  /**
   * Get external ID from raw listing data
   */
  getExternalId(listing: SamAssistanceListing): string {
    return listing.assistanceListingNumber;
  }

  // ============================================
  // Public API Methods
  // ============================================

  /**
   * Search for assistance listings by CFDA prefix
   */
  async searchListingsByPrefix(
    cfdaPrefix: string
  ): Promise<SamAssistanceListing[]> {
    const url = new URL(`${this.config.baseUrl}/search`);
    url.searchParams.set("cfda", `${cfdaPrefix}.*`);
    url.searchParams.set("api_key", this.apiKey);

    try {
      const data = await this.fetchJson<{
        opportunitiesData?: SamAssistanceListing[];
        _embedded?: { results?: SamAssistanceListing[] };
      }>(url.toString());

      return (
        data.opportunitiesData ||
        data._embedded?.results ||
        []
      );
    } catch (error) {
      // SAM.gov API can be finicky - return empty array on error
      this.warn(`SAM.gov search failed for ${cfdaPrefix}:`, (error as Error).message);
      return [];
    }
  }

  /**
   * Get a specific assistance listing by CFDA number
   */
  async getListing(cfdaNumber: string): Promise<SamAssistanceListing | null> {
    const url = new URL(`${this.config.baseUrl}/fal/${cfdaNumber.replace(".", "")}`);
    url.searchParams.set("api_key", this.apiKey);

    try {
      return await this.fetchJson<SamAssistanceListing>(url.toString());
    } catch {
      return null;
    }
  }

  /**
   * Search listings by keyword
   */
  async searchByKeyword(keyword: string): Promise<SamAssistanceListing[]> {
    const url = new URL(`${this.config.baseUrl}/search`);
    url.searchParams.set("q", keyword);
    url.searchParams.set("api_key", this.apiKey);

    try {
      const data = await this.fetchJson<{
        opportunitiesData?: SamAssistanceListing[];
        _embedded?: { results?: SamAssistanceListing[] };
      }>(url.toString());

      return (
        data.opportunitiesData ||
        data._embedded?.results ||
        []
      );
    } catch (error) {
      this.warn(`SAM.gov keyword search failed:`, (error as Error).message);
      return [];
    }
  }
}

// ============================================
// Self-Registration
// ============================================

// NOTE: SAM.gov does not have a public Assistance Listings search API.
// The data is only available via bulk download or web scraping.
// Disabled until a proper API becomes available.
// registerClient(new SamGovClient());

// Export for direct access if needed
export const samGovClient = new SamGovClient();
