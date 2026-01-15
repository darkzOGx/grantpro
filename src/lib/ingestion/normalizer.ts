/**
 * Universal Grant Normalizer
 * 
 * Maps grants from various sources to our internal schema.
 */

import { GrantCategory, GrantSourceType } from "@prisma/client";
import {
    NormalizedGrant,
    GrantsGovOpportunity,
    CaliforniaGrantCSV,
    inferCategoryFromCFDA,
    inferCategoryFromKeywords,
} from "./types";

/**
 * Normalize a Grants.gov opportunity to our internal schema
 */
export function normalizeGrantsGovOpportunity(
    opp: GrantsGovOpportunity
): NormalizedGrant {
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
    const fundingAmountMax = opp.awardCeiling || opp.estimatedTotalProgramFunding || fundingAmountMin;

    // Parse deadline
    let deadline: Date;
    try {
        deadline = opp.closeDate ? new Date(opp.closeDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    } catch {
        deadline = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    return {
        title: opp.opportunityTitle,
        category,
        sourceType: "FEDERAL" as GrantSourceType,
        fundingAmountMin,
        fundingAmountMax,
        deadline,
        externalId: opp.opportunityId,
        sourceUrl: `https://www.grants.gov/search-results-detail/${opp.opportunityId}`,
        cfda,
        agencyCode: opp.agencyCode || opp.owningAgencyCode,
        description: opp.synopsis?.synopsisDesc,
        eligibilityCriteria: [
            ...opp.eligibleApplicants,
            opp.additionalEligibilityInfo,
        ]
            .filter(Boolean)
            .join("\n"),
        applicationUrl: `https://www.grants.gov/search-results-detail/${opp.opportunityId}`,
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
 * Normalize a California grant CSV row to our internal schema
 */
export function normalizeCaliforniaGrant(
    csvGrant: CaliforniaGrantCSV
): NormalizedGrant {
    // Parse funding amount
    const { min, max } = parseFundingRange(csvGrant.EstAvailFunds);

    // Infer category
    const text = `${csvGrant.GrantTitle} ${csvGrant.Description || ""} ${csvGrant.Categories || ""}`;
    const category = inferCategoryFromCaliforniaCategories(csvGrant.Categories, text);

    // Parse deadline
    let deadline: Date;
    try {
        deadline = csvGrant.ApplicationDeadline
            ? new Date(csvGrant.ApplicationDeadline)
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    } catch {
        deadline = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    return {
        title: csvGrant.GrantTitle,
        category,
        sourceType: "STATE" as GrantSourceType,
        fundingAmountMin: min,
        fundingAmountMax: max,
        deadline,
        externalId: csvGrant.GrantID,
        sourceUrl: csvGrant.GrantURL,
        cfda: undefined,
        agencyCode: csvGrant.AgencyDept,
        description: csvGrant.Description,
        eligibilityCriteria: csvGrant.EligibleApplicants,
        applicationUrl: csvGrant.GrantURL,
        requirements: {
            geographicEligibility: csvGrant.GeographicEligibility,
            matchingFundsRequired: csvGrant.MatchingFundsRequired === "Yes",
            categories: csvGrant.Categories?.split(",").map((c) => c.trim()),
        },
        isActive: true,
    };
}

/**
 * Parse funding range string into min/max values
 */
function parseFundingRange(amountStr?: string): { min: number; max: number } {
    if (!amountStr) {
        return { min: 0, max: 0 };
    }

    // Remove $ and commas
    const cleaned = amountStr.replace(/[$,]/g, "").trim();

    // Check for range
    const rangeMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
    if (rangeMatch) {
        return {
            min: parseFloat(rangeMatch[1]),
            max: parseFloat(rangeMatch[2]),
        };
    }

    // Single value
    const singleMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
    if (singleMatch) {
        const value = parseFloat(singleMatch[1]);
        return { min: value, max: value };
    }

    return { min: 0, max: 0 };
}

/**
 * Infer category from California-specific category strings
 */
function inferCategoryFromCaliforniaCategories(
    categories?: string,
    text?: string
): GrantCategory {
    const lower = (categories || "").toLowerCase();

    if (lower.includes("food") || lower.includes("nutrition") || lower.includes("agriculture")) {
        return "NUTRITION";
    }
    if (lower.includes("art") || lower.includes("culture") || lower.includes("humanities")) {
        return "ARTS";
    }
    if (lower.includes("science") || lower.includes("technology") || lower.includes("stem")) {
        return "STEM";
    }
    if (lower.includes("infrastructure") || lower.includes("energy") || lower.includes("environment")) {
        return "INFRASTRUCTURE";
    }

    // Fall back to keyword inference
    if (text) {
        return inferCategoryFromKeywords(text);
    }

    return "STATE";
}

/**
 * Generate a checksum for detecting grant changes
 */
export function generateGrantChecksum(grant: NormalizedGrant): string {
    const key = JSON.stringify({
        title: grant.title,
        fundingMin: grant.fundingAmountMin,
        fundingMax: grant.fundingAmountMax,
        deadline: grant.deadline.toISOString(),
        description: grant.description?.substring(0, 500),
    });

    // Simple hash
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    return hash.toString(16);
}
