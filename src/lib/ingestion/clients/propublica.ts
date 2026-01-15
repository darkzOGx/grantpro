/**
 * ProPublica Nonprofit Explorer API Client
 * 
 * Accesses IRS 990 data for private foundations to build funder profiles.
 * API Reference: https://projects.propublica.org/nonprofits/api
 */

import {
    ProPublicaOrganization,
    ProPublicaFiling,
} from "../types";

const PROPUBLICA_BASE_URL = "https://projects.propublica.org/nonprofits/api/v2";

export class ProPublicaClient {
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

        const url = `${PROPUBLICA_BASE_URL}/search.json?${params}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `ProPublica search failed: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();
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
        const url = `${PROPUBLICA_BASE_URL}/organizations/${cleanEin}.json`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `ProPublica org fetch failed: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();

        return {
            organization: data.organization as ProPublicaOrganization,
            filings: (data.filings_with_data || []) as ProPublicaFiling[],
        };
    }

    /**
     * Search for private foundations (990-PF filers)
     */
    async searchFoundations(query: string): Promise<ProPublicaOrganization[]> {
        // ProPublica doesn't have a direct filter for 990-PF
        // We'll search and then filter client-side if needed
        const orgs = await this.searchOrganizations(query);

        // Filter for likely foundations (can refine based on NTEE codes)
        return orgs.filter((org) => {
            // T codes are typically philanthropic organizations
            return org.ntee_code?.startsWith("T") ||
                org.name.toLowerCase().includes("foundation") ||
                org.name.toLowerCase().includes("fund");
        });
    }

    /**
     * Search for foundations that fund education
     */
    async searchEducationFoundations(): Promise<ProPublicaOrganization[]> {
        const searchTerms = [
            "education foundation",
            "school foundation",
            "scholarship fund",
            "youth foundation",
            "learning foundation",
        ];

        const allFoundations: ProPublicaOrganization[] = [];
        const seenEins = new Set<string>();

        for (const term of searchTerms) {
            try {
                const results = await this.searchFoundations(term);
                for (const org of results) {
                    if (!seenEins.has(org.ein)) {
                        seenEins.add(org.ein);
                        allFoundations.push(org);
                    }
                }
                // Rate limiting
                await this.delay(500);
            } catch (error) {
                console.error(`Error searching for "${term}":`, error);
            }
        }

        return allFoundations;
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

        const totalAssets = organization.asset_amount ||
            (pf990s[0]?.totassetsend) || 0;

        // Estimate average giving from total expenses (rough proxy)
        const recentFilings = pf990s.slice(0, 3);
        const avgAnnualGiving = recentFilings.length > 0
            ? recentFilings.reduce((sum, f) => sum + (f.totfuncexpns || 0), 0) / recentFilings.length
            : 0;

        return {
            organization,
            filings: pf990s,
            totalAssets,
            avgAnnualGiving,
        };
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export const proPublicaClient = new ProPublicaClient();
