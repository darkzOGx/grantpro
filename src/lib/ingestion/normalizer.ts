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

    // Generate appropriate URL based on ID format
    // UUIDs (from Simpler API) use simpler.grants.gov
    // Numeric IDs (from legacy API) use grants.gov
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(opp.opportunityId);
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
 * Normalize a USAspending.gov award to our internal schema
 * Used for historical funding data and benchmarking
 */
export function normalizeUSAspendingAward(
    award: USAspendingAward
): NormalizedGrant {
    // Infer category from CFDA number
    let category: GrantCategory = "FEDERAL";
    if (award["CFDA Number"]) {
        category = inferCategoryFromCFDA(award["CFDA Number"]);
    }

    // Parse dates
    let deadline: Date;
    try {
        deadline = award["End Date"]
            ? new Date(award["End Date"])
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    } catch {
        deadline = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    const fundingAmount = award["Award Amount"] || 0;

    return {
        title: `${award["Recipient Name"]} - ${award["CFDA Number"] || "Federal Award"}`,
        category,
        sourceType: "FEDERAL" as GrantSourceType,
        fundingAmountMin: fundingAmount,
        fundingAmountMax: fundingAmount,
        deadline,
        externalId: award["Award ID"],
        sourceUrl: `https://www.usaspending.gov/award/${award["Award ID"]}`,
        cfda: award["CFDA Number"],
        agencyCode: award["Awarding Agency"],
        description: award.Description,
        eligibilityCriteria: undefined,
        applicationUrl: undefined,
        requirements: {
            awardType: award["Award Type"],
            subAgency: award["Awarding Sub Agency"],
            totalOutlays: award["Total Outlays"],
        },
        isActive: false, // Historical awards
    };
}

/**
 * Normalize an NSF Award to our internal schema
 */
export function normalizeNSFAward(award: NSFAward): NormalizedGrant {
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

    const piName = [award.piFirstName, award.piLastName].filter(Boolean).join(" ");

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
 * Normalize a ProPublica foundation to a funder profile
 * Foundations aren't grants themselves, but we track them as potential funders
 */
export function normalizeProPublicaFoundation(
    org: ProPublicaOrganization,
    avgGiving?: number
): NormalizedGrant {
    // Estimate funding: use giving data if available, 
    // otherwise estimate 5% of assets (typical foundation payout rate)
    // or fall back to revenue
    const estimatedGiving = avgGiving ||
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

// Import new types
import {
    USAspendingAward,
    NSFAward,
    ProPublicaOrganization,
} from "./types";

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
