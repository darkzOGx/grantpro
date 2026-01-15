import {
    GrantCategory,
    GrantSourceType,
    ApplicationStatus,
    DeliverableStatus,
} from "@prisma/client";

export type { GrantCategory, GrantSourceType, ApplicationStatus, DeliverableStatus };

export interface GrantWithScore {
    id: string;
    title: string;
    category: GrantCategory;
    sourceType: GrantSourceType;
    fundingAmountMin: number;
    fundingAmountMax: number;
    deadline: Date;
    description: string | null;
    isActive: boolean;
    matchScore?: number;
    applicationStatus?: ApplicationStatus;
    autoApplyEnabled?: boolean;
    sourceUrl?: string | null;
    applicationUrl?: string | null;
}

export interface ApplicationWithDetails {
    id: string;
    grantId: string;
    districtId: string;
    status: ApplicationStatus;
    matchScore: number | null;
    autoApplyEnabled: boolean;
    submittedAt: Date | null;
    grant: {
        title: string;
        category: GrantCategory;
        fundingAmountMin: number;
        fundingAmountMax: number;
        deadline: Date;
    };
}

export interface DeliverableWithApplication {
    id: string;
    applicationId: string;
    title: string;
    description: string | null;
    status: DeliverableStatus;
    dueDate: Date | null;
    evidenceLink: string | null;
    application: {
        grant: {
            title: string;
        };
    };
}

export const CATEGORY_LABELS: Record<GrantCategory, string> = {
    FEDERAL: "Federal",
    STATE: "State",
    NUTRITION: "Nutrition",
    ARTS: "Arts",
    STEM: "STEM",
    INFRASTRUCTURE: "Infrastructure",
    PRIVATE_FOUNDATION: "Private Foundation",
    CORPORATE: "Corporate",
    OTHER: "Other",
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
    PENDING_DATA: "Pending Data",
    DRAFTING: "Drafting",
    READY_FOR_REVIEW: "Ready for Review",
    SUBMITTED: "Submitted",
    WON: "Won",
    LOST: "Lost",
};

export const DELIVERABLE_STATUS_LABELS: Record<DeliverableStatus, string> = {
    IMPLEMENTATION: "Implementation",
    REPORTING: "Reporting",
    AUDIT: "Audit",
    COMPLETED: "Completed",
};
