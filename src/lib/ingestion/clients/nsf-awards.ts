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

import { NSFAward, NSFSearchParams } from "../types";

const NSF_BASE_URL = "https://api.nsf.gov/services/v1";

export class NSFAwardsClient {
    /**
     * Search for NSF awards
     */
    async searchAwards(params: NSFSearchParams): Promise<{
        awards: NSFAward[];
        total: number;
    }> {
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

        const url = `${NSF_BASE_URL}/awards.json?${urlParams}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`NSF API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // NSF wraps response in "response" object
        const awards = data.response?.award || [];
        const total = parseInt(data.response?.totalRecords || "0", 10);

        return { awards, total };
    }

    /**
     * Get single award by ID
     */
    async getAward(awardId: string): Promise<NSFAward | null> {
        const url = `${NSF_BASE_URL}/awards/${awardId}.json?printFields=id,title,abstractText,awardeeName,awardeeCity,awardeeStateCode,startDate,expDate,estimatedTotalAmt,fundsObligatedAmt,piFirstName,piLastName,piEmail,fundProgramName,primaryProgram,projectOutComesReport`;

        try {
            const response = await fetch(url);
            if (!response.ok) return null;

            const data = await response.json();
            const awards = data.response?.award || [];
            return awards[0] || null;
        } catch {
            return null;
        }
    }

    /**
     * Search for education-focused awards
     * These often have K-12 outreach as "Broader Impacts"
     */
    async searchEducationAwards(): Promise<NSFAward[]> {
        console.log("Fetching education-focused NSF awards...");

        const educationKeywords = [
            "K-12 education",
            "STEM education",
            "K-12 outreach",
            "science education",
            "teacher professional development",
            "educational technology",
            "broadening participation",
        ];

        const allAwards: NSFAward[] = [];
        const seenIds = new Set<string>();

        for (const keyword of educationKeywords) {
            try {
                console.log(`  Searching: "${keyword}"...`);

                // Get recent awards (last 2 years)
                const twoYearsAgo = new Date();
                twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
                const dateStart = `${String(twoYearsAgo.getMonth() + 1).padStart(2, "0")}/01/${twoYearsAgo.getFullYear()}`;

                const { awards, total } = await this.searchAwards({
                    keyword,
                    dateStart,
                    resultsPerPage: 25,
                });

                console.log(`    Found ${awards.length} of ${total} total`);

                for (const award of awards) {
                    if (!seenIds.has(award.id)) {
                        seenIds.add(award.id);
                        allAwards.push(award);
                    }
                }

                await this.delay(500); // Rate limiting
            } catch (error) {
                console.error(`  Error searching "${keyword}":`, (error as Error).message);
            }
        }

        console.log(`Total unique NSF education awards: ${allAwards.length}`);
        return allAwards;
    }

    /**
     * Search for active DRK-12 program awards
     * DRK-12 (Discovery Research PreK-12) is NSF's main K-12 program
     */
    async searchDRK12Awards(): Promise<NSFAward[]> {
        console.log("Fetching DRK-12 program awards...");

        try {
            const { awards } = await this.searchAwards({
                fundProgramName: "DRK-12",
                resultsPerPage: 25,
            });
            return awards;
        } catch (error) {
            console.error("Error fetching DRK-12 awards:", error);
            return [];
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export const nsfAwardsClient = new NSFAwardsClient();
