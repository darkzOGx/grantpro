/**
 * Grants.gov API Client
 * 
 * RESTful API for searching and retrieving federal grant opportunities.
 * Trying modern API format: https://api.grants.gov/v1/opportunities
 */

import {
    GrantsGovSearchParams,
    GrantsGovSearchResponse,
    GrantsGovOpportunity,
} from "../types";

// Try both legacy and modern endpoints
const GRANTS_GOV_LEGACY_URL = "https://apply07.grants.gov/grantsws/rest";
const GRANTS_GOV_MODERN_URL = "https://api.grants.gov/v1";

export class GrantsGovClient {
    private apiKey?: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.GRANTS_GOV_API_KEY;
    }

    /**
     * Search for grant opportunities using filters
     */
    async searchOpportunities(
        params: GrantsGovSearchParams
    ): Promise<{ totalCount: number, hits: import("../types").GrantsGovSearchHit[] }> {
        // If we have an API key, try Simpler.Grants.gov first
        if (this.apiKey) {
            try {
                return await this.searchSimpler(params);
            } catch (e) {
                console.log("Simpler API failed, falling back to legacy:", (e as Error).message);
            }
        }
        // Fallback to legacy API
        return await this.searchLegacy(params);
    }

    private async searchSimpler(
        params: GrantsGovSearchParams
    ): Promise<{ totalCount: number, hits: import("../types").GrantsGovSearchHit[] }> {
        // Use Simpler.Grants.gov API (requires API key from simpler.grants.gov/developer)
        const url = "https://api.simpler.grants.gov/v1/opportunities/search";

        // Build request body matching Simpler API format
        const requestBody: Record<string, unknown> = {
            pagination: {
                page_size: params.rows || 100,
                page_offset: Math.floor((params.startRecordNum || 0) / (params.rows || 100)) + 1, // 1-based
                order_by: "post_date",
                sort_direction: "descending",
            },
            filters: {
                // Only fetch posted opportunities
                opportunity_status: { one_of: ["posted"] },
            },
        };

        // Add keyword if provided
        if (params.keyword) {
            requestBody.query = params.keyword;
        }

        // Add agency filter if provided
        if (params.agency) {
            (requestBody.filters as Record<string, unknown>).agency = { one_of: [params.agency] };
        }

        console.log(`Calling Simpler.Grants.gov API...`);

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
            console.log(`Simpler API response: ${response.status} - ${errorText}`);
            throw new Error(`Simpler API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Simpler API returned ${data.data?.length || 0} opportunities`);

        // Map the response to our hit format
        const hits = (data.data || []).map((opp: any) => ({
            id: String(opp.opportunity_id || opp.id),
            number: opp.opportunity_number || "",
            title: opp.opportunity_title || opp.title || "",
            agency: opp.agency_code || opp.agency || "",
            openDate: opp.post_date || "",
            closeDate: opp.close_date || "",
            cfdaList: opp.assistance_listing_number ? [opp.assistance_listing_number] : [],
        }));

        return {
            totalCount: data.pagination?.total_records || hits.length,
            hits,
        };
    }

    private async searchLegacy(
        params: GrantsGovSearchParams
    ): Promise<{ totalCount: number, hits: import("../types").GrantsGovSearchHit[] }> {
        const url = `${GRANTS_GOV_LEGACY_URL}/opportunities/search`;

        // Build search criteria
        const searchCriteria: Record<string, unknown> = {};

        if (params.keyword) searchCriteria.keyword = params.keyword;
        if (params.opportunityId) searchCriteria.opportunityId = params.opportunityId;
        if (params.fundingInstrumentType) searchCriteria.fundingInstrumentType = params.fundingInstrumentType;
        if (params.agency) searchCriteria.agency = params.agency;
        if (params.oppStatus) searchCriteria.oppStatus = params.oppStatus;
        if (params.postedDateRange) searchCriteria.postedDateRange = params.postedDateRange;
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
                // Try Authorization header format per Grants.gov docs
                ...(this.apiKey && { "Authorization": `APIKEY=${this.apiKey}` }),
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Legacy API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        return {
            totalCount: data.rowCount || 0,
            hits: (data.oppHits || []) as import("../types").GrantsGovSearchHit[],
        };
    }


    /**
     * Fetch detailed information for a specific opportunity ID
     */
    async getOpportunityDetails(opportunityId: string): Promise<GrantsGovOpportunity | null> {
        // Try synopsis endpoint first as it usually has the most relevant details
        // Note: The structure of this response also needs verification, but assuming standard format for now
        const url = `${GRANTS_GOV_LEGACY_URL}/opportunities/${opportunityId}`;

        try {
            const response = await fetch(url, {
                method: "POST", // Grants.gov often uses POST even for retrieval
                headers: {
                    "Content-Type": "application/json",
                    ...(this.apiKey && { "X-Api-Key": this.apiKey }),
                },
                body: JSON.stringify({}) // Empty body sometimes needed
            });

            // If POST fails, try GET
            if (response.status === 404 || response.status === 405) {
                console.log(`Debug: ${url} returned ${response.status}, trying GET...`);
                const getResponse = await fetch(url, {
                    method: "GET",
                    headers: {
                        ...(this.apiKey && { "X-Api-Key": this.apiKey }),
                    },
                });

                if (!getResponse.ok) {
                    console.error(`Debug: GET ${url} failed: ${getResponse.status} ${getResponse.statusText}`);
                    return null;
                }
                const data = await getResponse.json();
                console.log(`Debug: Successfully fetched details for ${opportunityId}`);
                return data;
            }

            if (!response.ok) {
                console.error(`Debug: POST ${url} failed: ${response.status} ${response.statusText}`);
                const text = await response.text();
                console.error("Debug: Error Body:", text);
                return null;
            }
            const data = await response.json();
            return data;

        } catch (e) {
            console.error(`Failed to fetch details for ${opportunityId}`, e);
            return null;
        }
    }

    /**
     * Fetch education-related grant opportunities (K-12 focus)
     * Searches for grants relevant to school districts across multiple categories:
     * Federal, State, Nutrition, Arts, STEM, Infrastructure
     */
    async fetchEducationGrants(): Promise<GrantsGovOpportunity[]> {
        console.log("Fetching school district relevant grants from Grants.gov...");

        // Education-related keywords for school districts
        const educationKeywords = [
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

        const allHits: import("../types").GrantsGovSearchHit[] = [];
        const batchSize = 100;

        // Search with multiple keywords to get diverse results
        for (const keyword of educationKeywords) {
            console.log(`  Searching: "${keyword}"...`);

            const result = await this.searchOpportunities({
                keyword,
                oppStatus: "posted",
                rows: batchSize,
                startRecordNum: 0
            });

            console.log(`    Found ${result.hits.length} grants for "${keyword}"`);
            allHits.push(...result.hits);

            // Rate limit between searches
            await this.delay(200);
        }

        // Deduplicate by ID
        const uniqueHits = Array.from(new Map(allHits.map(hit => [hit.id, hit])).values());

        console.log(`Found ${uniqueHits.length} unique education-related grants. Processing...`);

        // 2. Fetch details for each (in parallel batches to be nice)
        const detailedGrants: GrantsGovOpportunity[] = [];
        const BATCH_SIZE = 5;

        for (let i = 0; i < uniqueHits.length; i += BATCH_SIZE) {
            const batch = uniqueHits.slice(i, i + BATCH_SIZE);
            const promises = batch.map(async (hit) => {
                let details = await this.getOpportunityDetails(hit.id);

                if (details) {
                    return {
                        ...details,
                        opportunityId: details.opportunityId || hit.id,
                        opportunityTitle: details.opportunityTitle || hit.title,
                    };
                } else {
                    console.warn(`Warning: Could not fetch details for ${hit.id}, using basic info.`);
                    // Fallback to basic info from search hit
                    return {
                        opportunityId: hit.id,
                        opportunityTitle: hit.title,
                        opportunityNumber: hit.number,
                        owningAgencyCode: hit.agency,
                        openDate: hit.openDate,
                        closeDate: hit.closeDate,
                        oppStatus: "posted",
                        cfdaList: hit.cfdaList?.map(c => ({ cfdaNumber: c, programTitle: "" })) || [],
                        // Missing details
                        synopsis: { synopsisDesc: "" },
                        eligibleApplicants: [],
                        fundingInstrumentType: "GRANT", // Assumption
                        categoryOfFunding: "O", // Other
                        eligibilityCriteria: "",
                        description: "",
                    } as GrantsGovOpportunity;
                }
            });

            const results = await Promise.all(promises);
            detailedGrants.push(...(results.filter(Boolean) as GrantsGovOpportunity[]));

            // Tiny delay
            await this.delay(100);
        }

        return detailedGrants;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export const grantsGovClient = new GrantsGovClient();
