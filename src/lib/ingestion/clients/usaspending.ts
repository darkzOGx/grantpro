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

import { USAspendingAward, USAspendingSearchParams } from "../types";

const USASPENDING_BASE_URL = "https://api.usaspending.gov/api/v2";

// Education-related CFDA prefixes
const EDUCATION_CFDA_PREFIXES = [
    "84", // Department of Education
    "10", // USDA (school meals)
    "45", // NEA/NEH Arts
    "47", // NSF
    "93", // HHS (Head Start)
];

export class USAspendingClient {
    /**
     * Search for awards by CFDA number
     */
    async searchByCFDA(
        cfdaNumber: string,
        params: USAspendingSearchParams = {}
    ): Promise<{ results: USAspendingAward[]; page_metadata: { total: number } }> {
        const url = `${USASPENDING_BASE_URL}/search/spending_by_award/`;

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

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`USAspending API error: ${response.status} - ${errorText}`);
        }

        return response.json();
    }

    /**
     * Search for education-related awards
     */
    async searchEducationAwards(
        params: USAspendingSearchParams = {}
    ): Promise<USAspendingAward[]> {
        const url = `${USASPENDING_BASE_URL}/search/spending_by_award/`;

        // Build filters for education grants
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

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`USAspending API error: ${response.status}`);
        }

        const data = await response.json();
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
        const url = `${USASPENDING_BASE_URL}/recipient/${recipientId}/`;

        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            return response.json();
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
        const url = `${USASPENDING_BASE_URL}/references/cfda/totals/`;

        try {
            const response = await fetch(`${url}?cfda=${cfdaNumber}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data.results?.[0] || null;
        } catch {
            return null;
        }
    }

    /**
     * Fetch awards for K-12 education programs
     * Targets specific CFDA numbers relevant to school districts
     */
    async fetchK12Awards(): Promise<USAspendingAward[]> {
        console.log("Fetching K-12 education awards from USAspending.gov...");

        // Key education CFDA numbers
        const educationCFDAs = [
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

        const allAwards: USAspendingAward[] = [];

        for (const cfda of educationCFDAs) {
            try {
                console.log(`  Fetching awards for CFDA ${cfda}...`);
                const result = await this.searchByCFDA(cfda, {
                    limit: 50,
                    startDate: "2023-01-01",
                });
                console.log(`    Found ${result.results.length} awards`);
                allAwards.push(...result.results);
                await this.delay(300); // Rate limiting
            } catch (error) {
                console.error(`  Error fetching CFDA ${cfda}:`, (error as Error).message);
            }
        }

        // Dedupe by Award ID
        const unique = Array.from(
            new Map(allAwards.map((a) => [a["Award ID"], a])).values()
        );

        console.log(`Total unique K-12 awards: ${unique.length}`);
        return unique;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export const usaSpendingClient = new USAspendingClient();
