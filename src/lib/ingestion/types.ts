/**
 * Types for the Universal Grant Ingestion System
 */

import { GrantCategory, GrantSourceType, IngestionSourceType } from "@prisma/client";

// ============================================
// Federal Source Types (Grants.gov)
// ============================================

export interface GrantsGovSearchParams {
    keyword?: string;
    opportunityId?: string;
    fundingInstrumentType?: string;
    eligibility?: string;
    agency?: string;
    oppStatus?: "forecasted" | "posted" | "closed" | "archived";
    postedDateRange?: {
        startDate: string; // YYYY-MM-DD
        endDate: string;
    };
    sortBy?: "openDate" | "closeDate" | "opportunityTitle";
    rows?: number;
    startRecordNum?: number;
}

// The item returned in search results "oppHits"
export interface GrantsGovSearchHit {
    id: string;
    number: string;
    title: string;
    agency: string;
    openDate: string;
    closeDate: string;
    cfdaList?: string[];
}

// The detailed opportunity object (fetched individually)
export interface GrantsGovOpportunity {
    opportunityId: string; // "id" in search hit, mapped to this
    opportunityTitle: string;
    opportunityNumber: string;
    owningAgencyCode: string;
    owningAgencyName?: string;
    openDate: string;
    closeDate: string;
    closeDateExplanation?: string;
    oppStatus?: string;
    docType?: string;
    fundingInstrumentType?: string;
    categoryOfFunding?: string;
    expectedNumberOfAwards?: number;
    awardCeiling?: number;
    awardFloor?: number;
    estimatedTotalProgramFunding?: number;
    costSharing?: boolean;
    eligibleApplicants?: string[];
    additionalEligibilityInfo?: string;
    agencyCode?: string;
    cfdaList?: Array<{
        cfdaNumber: string;
        programTitle?: string;
    }>;
    synopsis?: {
        synopsisDesc: string;
        applicantEligibilityDesc?: string;
    };
}

export interface GrantsGovSearchResponse {
    oppHits: GrantsGovSearchHit[];
    rowCount: number;
}

// ============================================
// SAM.gov Assistance Listings Types
// ============================================

export interface SamAssistanceListing {
    assistanceListingNumber: string; // CFDA number like "10.553"
    programTitle: string;
    popularName?: string;
    federalAgency: string;
    objectives: string;
    typesOfAssistance: string[];
    useAndUseRestrictions: string;
    applicantEligibility: string;
    beneficiaryEligibility: string;
    preApplicationCoordination: string;
    applicationProcedures: string;
    deadlines: string;
    rangeOfApprovalDisapprovalTime: string;
    website?: string;
    relatedPrograms?: string[];
    obligations?: {
        fiscalYear: number;
        amount: number;
    }[];
}

// ============================================
// California Grants Portal Types
// ============================================

export interface CaliforniaGrantCSV {
    PortalID?: string;
    GrantID: string;
    Status?: string;
    LastUpdated?: string;
    AgencyDept: string;
    Title: string;
    Type?: string;
    Categories?: string;
    Purpose?: string;
    Description?: string;
    ApplicantType?: string;
    ApplicantTypeNotes?: string;
    Geography?: string;
    FundingSource?: string;
    MatchingFunds?: string;
    MatchingFundsNotes?: string;
    EstAvailFunds?: string;
    EstAwards?: string;
    EstAmounts?: string;
    OpenDate: string;
    ApplicationDeadline: string;
    AwardPeriod?: string;
    ExpAwardDate?: string;
    GrantURL: string;
    AgencyURL?: string;
    ContactInfo?: string;
}

// ============================================
// ProPublica Nonprofit Explorer Types (IRS 990)
// ============================================

export interface ProPublicaOrganization {
    ein: string;
    name: string;
    city: string;
    state: string;
    ntee_code?: string;
    classification_codes?: string;
    asset_amount?: number;
    income_amount?: number;
    revenue_amount?: number;
}

export interface ProPublicaFiling {
    tax_prd_yr: number;
    formtype: string; // "990PF" for private foundations
    pdf_url?: string;
    updated?: string;
    totrevenue?: number;
    totfuncexpns?: number;
    totassetsend?: number;
    totliabend?: number;
    pct_compnsatncurrofcr?: number;
}

export interface ProPublicaGrant {
    recipient_name: string;
    recipient_city?: string;
    recipient_state?: string;
    cash_grant_amount: number;
    purpose?: string;
}

// ============================================
// USAspending.gov Types
// ============================================

export interface USAspendingSearchParams {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    timePeriod?: { start_date: string; end_date: string }[];
    sort?: string;
    order?: "asc" | "desc";
}

export interface USAspendingAward {
    "Award ID": string;
    "Recipient Name": string;
    "Award Amount": number;
    "Total Outlays"?: number;
    Description?: string;
    "Start Date"?: string;
    "End Date"?: string;
    "Awarding Agency"?: string;
    "Awarding Sub Agency"?: string;
    "Award Type"?: string;
    "CFDA Number"?: string;
    recipient_id?: string;
}

// ============================================
// NSF Awards API Types
// ============================================

export interface NSFSearchParams {
    keyword?: string;
    fundProgramName?: string;
    dateStart?: string; // MM/DD/YYYY
    dateEnd?: string;
    offset?: number;
    resultsPerPage?: number;
}

export interface NSFAward {
    id: string;
    title: string;
    abstractText?: string;
    awardeeName: string;
    awardeeCity?: string;
    awardeeStateCode?: string;
    startDate?: string;
    expDate?: string;
    estimatedTotalAmt?: string;
    fundsObligatedAmt?: string;
    piFirstName?: string;
    piLastName?: string;
    piEmail?: string;
    coPDPI?: string;
    fundProgramName?: string;
    primaryProgram?: string;
    projectOutComesReport?: string;
}

// ============================================
// Normalized Grant Types (Internal)
// ============================================

export interface NormalizedGrant {
    // Required fields
    title: string;
    category: GrantCategory;
    sourceType: GrantSourceType;
    fundingAmountMin: number;
    fundingAmountMax: number;
    deadline: Date;

    // Source tracking
    externalId: string;
    sourceUrl?: string;
    cfda?: string;
    agencyCode?: string;

    // Content
    description?: string;
    eligibilityCriteria?: string;
    applicationUrl?: string;
    requirements?: Record<string, unknown>;

    // Metadata
    isActive: boolean;
}

export interface IngestionResult {
    sourceId: string;
    sourceName: string;
    totalFetched: number;
    totalNew: number;
    totalUpdated: number;
    totalErrors: number;
    errors: Array<{
        externalId: string;
        message: string;
    }>;
}

// ============================================
// Category Mapping Utilities
// ============================================

export const CFDA_CATEGORY_MAP: Record<string, GrantCategory> = {
    "10": "NUTRITION",      // USDA
    "11": "OTHER",          // Commerce
    "12": "OTHER",          // Defense
    "14": "INFRASTRUCTURE", // HUD
    "15": "OTHER",          // Interior
    "16": "OTHER",          // Justice
    "17": "OTHER",          // Labor
    "20": "INFRASTRUCTURE", // Transportation
    "45": "ARTS",           // NEA, NEH
    "47": "STEM",           // NSF
    "66": "INFRASTRUCTURE", // EPA
    "84": "FEDERAL",        // Education
    "93": "OTHER",          // HHS
};

export function inferCategoryFromCFDA(cfda: string): GrantCategory {
    const prefix = cfda.split(".")[0];
    return CFDA_CATEGORY_MAP[prefix] || "FEDERAL";
}

export function inferCategoryFromKeywords(text: string): GrantCategory {
    const lower = text.toLowerCase();

    if (/\b(lunch|nutrition|food|meal|snap|breakfast)\b/.test(lower)) {
        return "NUTRITION";
    }
    if (/\b(art|music|theater|dance|cultural|creative)\b/.test(lower)) {
        return "ARTS";
    }
    if (/\b(stem|science|technology|engineering|math|research)\b/.test(lower)) {
        return "STEM";
    }
    if (/\b(infrastructure|building|facility|construction|energy)\b/.test(lower)) {
        return "INFRASTRUCTURE";
    }
    if (/\b(state|california|texas|florida)\b/.test(lower)) {
        return "STATE";
    }

    return "FEDERAL";
}

// ============================================
// Candid Grants API Types
// ============================================

export interface CandidSearchParams {
    query?: string;
    /** PCS subject codes for filtering (e.g., "ED" for education) */
    subject?: string[];
    /** Population codes for filtering */
    population?: string[];
    /** Years in YYYY format */
    year?: string[];
    /** Minimum grant amount */
    min_amt?: number;
    /** Maximum grant amount */
    max_amt?: number;
    /** Funder IDs to filter by */
    funder_id?: string[];
    /** Recipient IDs to filter by */
    recip_id?: string[];
    /** Page number for pagination */
    page?: number;
    /** Sort field */
    sort_by?: "funder_name" | "amount" | "count";
    /** Sort direction */
    sort_order?: "asc" | "desc";
}

export interface CandidFunder {
    /** Unique funder identifier */
    funder_key: string;
    /** Funder organization name */
    funder_name: string;
    /** City location */
    funder_city?: string;
    /** State code */
    funder_state?: string;
    /** Employer Identification Number */
    ein?: string;
    /** Total grant amount awarded */
    amount: number;
    /** Number of grants awarded */
    count: number;
    /** URL to Candid profile */
    profile_url?: string;
    /** GuideStar seal level (Bronze, Silver, Gold, Platinum) */
    seal_level?: string;
    /** Last data update date */
    last_updated?: string;
}

export interface CandidRecipient {
    /** Unique recipient identifier */
    recip_key: string;
    /** Recipient organization name */
    recip_name: string;
    /** City location */
    recip_city?: string;
    /** State code */
    recip_state?: string;
    /** Employer Identification Number */
    ein?: string;
    /** Total amount received */
    amount: number;
    /** Number of grants received */
    count: number;
    /** URL to Candid profile */
    profile_url?: string;
}

export interface CandidTransaction {
    /** Unique transaction identifier */
    trans_key: string;
    /** Funder identifier */
    funder_key: string;
    /** Funder name */
    funder_name: string;
    /** Recipient identifier */
    recip_key: string;
    /** Recipient name */
    recip_name: string;
    /** Grant amount */
    amount: number;
    /** Grant year */
    year: number;
    /** Grant purpose description */
    description?: string;
    /** Subject classification codes */
    subject_codes?: string[];
    /** Population codes */
    population_codes?: string[];
    /** Support type codes */
    support_codes?: string[];
}

export interface CandidSummary {
    /** Total grant amount */
    total_amount: number;
    /** Number of unique funders */
    funder_count: number;
    /** Number of unique recipients */
    recip_count: number;
    /** Total number of grants */
    grant_count: number;
}
