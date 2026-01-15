/**
 * Grants.gov API Client
 * 
 * RESTful API V2.0 for searching and retrieving federal grant opportunities.
 * Reference: https://www.grants.gov/system-to-system/grantor-system-to-system/restful-apis
 */

import {
    GrantsGovSearchParams,
    GrantsGovSearchResponse,
    GrantsGovOpportunity,
} from "../types";

const GRANTS_GOV_BASE_URL = "https://apply07.grants.gov/grantsws/rest";

export class GrantsGovClient {
    private apiKey?: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.GRANTS_GOV_API_KEY;
    }

    /**
     * Search for grant opportunities using filters
     * Uses delta sync by default (postedDateRange)
     */
    async searchOpportunities(
        params: GrantsGovSearchParams
    ): Promise<GrantsGovSearchResponse> {
        const url = `${GRANTS_GOV_BASE_URL}/opportunities/search`;

        // Build search criteria
        const searchCriteria: Record<string, unknown> = {};

        if (params.keyword) {
            searchCriteria.keyword = params.keyword;
        }
        if (params.opportunityId) {
            searchCriteria.opportunityId = params.opportunityId;
        }
        if (params.fundingInstrumentType) {
            searchCriteria.fundingInstrumentType = params.fundingInstrumentType;
        }
        if (params.agency) {
            searchCriteria.agency = params.agency;
        }
        if (params.oppStatus) {
            searchCriteria.oppStatus = params.oppStatus;
        }
        if (params.postedDateRange) {
            searchCriteria.postedDateRange = params.postedDateRange;
        }
        if (params.eligibility) {
            searchCriteria.eligibility = params.eligibility;
        }

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
                ...(this.apiKey && { "X-Api-Key": this.apiKey }),
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(
                `Grants.gov API error: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();

        return {
            totalCount: data.totalCount || 0,
            opportunities: (data.opportunities || []) as GrantsGovOpportunity[],
        };
    }

    /**
     * Fetch opportunities posted within a date range (delta sync)
     */
    async fetchDelta(
        startDate: Date,
        endDate: Date = new Date()
    ): Promise<GrantsGovOpportunity[]> {
        const allOpportunities: GrantsGovOpportunity[] = [];
        let startRecordNum = 0;
        const batchSize = 100;
        let hasMore = true;

        const postedDateRange = {
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
        };

        while (hasMore) {
            const result = await this.searchOpportunities({
                postedDateRange,
                oppStatus: "posted",
                rows: batchSize,
                startRecordNum,
            });

            allOpportunities.push(...result.opportunities);
            startRecordNum += batchSize;
            hasMore = startRecordNum < result.totalCount;

            // Rate limiting - be nice to the API
            await this.delay(200);
        }

        return allOpportunities;
    }

    /**
     * Fetch all currently open opportunities
     */
    async fetchOpenOpportunities(): Promise<GrantsGovOpportunity[]> {
        const allOpportunities: GrantsGovOpportunity[] = [];
        let startRecordNum = 0;
        const batchSize = 100;
        let hasMore = true;

        while (hasMore) {
            const result = await this.searchOpportunities({
                oppStatus: "posted",
                rows: batchSize,
                startRecordNum,
            });

            allOpportunities.push(...result.opportunities);
            startRecordNum += batchSize;
            hasMore = startRecordNum < result.totalCount;

            // Rate limiting
            await this.delay(200);
        }

        return allOpportunities;
    }

    /**
     * Fetch opportunities by agency code
     */
    async fetchByAgency(agencyCode: string): Promise<GrantsGovOpportunity[]> {
        const result = await this.searchOpportunities({
            agency: agencyCode,
            oppStatus: "posted",
            rows: 500,
        });

        return result.opportunities;
    }

    /**
     * Fetch education-related grant opportunities (K-12 focus)
     */
    async fetchEducationGrants(): Promise<GrantsGovOpportunity[]> {
        // Agency code for Department of Education
        const edGrants = await this.fetchByAgency("ED");

        // Also fetch USDA FNS (Nutrition Programs)
        const fnsGrants = await this.searchOpportunities({
            agency: "USDA-FNS",
            oppStatus: "posted",
            rows: 200,
        });

        // Fetch NEA (Arts)
        const neaGrants = await this.searchOpportunities({
            agency: "NEA",
            oppStatus: "posted",
            rows: 100,
        });

        return [...edGrants, ...fnsGrants.opportunities, ...neaGrants.opportunities];
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export const grantsGovClient = new GrantsGovClient();
