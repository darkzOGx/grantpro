import {
    Grant,
    SchoolDistrict,
    GrantCategory,
} from "@prisma/client";

interface ScoringResult {
    score: number;
    breakdown: {
        demographics: number;
        geography: number;
        history: number;
        alignment: number;
    };
    recommendations: string[];
}

/**
 * Calculate suitability score (0-100) for a grant-district match
 */
export function calculateSuitabilityScore(
    district: SchoolDistrict,
    grant: Grant
): ScoringResult {
    const breakdown = {
        demographics: 0,
        geography: 0,
        history: 0,
        alignment: 0,
    };
    const recommendations: string[] = [];

    // Parse grant requirements
    const requirements = (grant.requirements as Record<string, unknown>) || {};

    // 1. Demographics Match (40 points max)
    // Free lunch percentage check
    const minFreeLunchPct = (requirements.minFreeLunchPct as number) || 0;
    if (district.freeLunchPct >= minFreeLunchPct) {
        breakdown.demographics += 20;
    } else {
        recommendations.push(
            `Grant requires ${minFreeLunchPct}% free lunch eligibility (you have ${district.freeLunchPct}%)`
        );
    }

    // Student count check
    const minStudentCount = (requirements.minStudentCount as number) || 0;
    if (district.studentCount >= minStudentCount) {
        breakdown.demographics += 20;
    } else if (minStudentCount > 0) {
        recommendations.push(
            `Grant requires minimum ${minStudentCount} students (you have ${district.studentCount})`
        );
    } else {
        breakdown.demographics += 20; // No requirement, full points
    }

    // 2. Geographic Match (20 points)
    const stateOnly = requirements.stateOnly as string | undefined;
    if (stateOnly) {
        if (district.state.toLowerCase() === stateOnly.toLowerCase()) {
            breakdown.geography = 20;
        } else {
            breakdown.geography = 0;
            recommendations.push(`Grant is only available in ${stateOnly}`);
        }
    } else {
        breakdown.geography = 20; // Federal/national grant
    }

    // 3. Previous Success History (20 points)
    const previousGrants = (district.previousGrants as Array<{
        name: string;
        status: string;
    }>) || [];
    const completedGrants = previousGrants.filter(
        (g) => g.status === "completed" || g.status === "active"
    );

    if (completedGrants.length >= 2) {
        breakdown.history = 20;
    } else if (completedGrants.length === 1) {
        breakdown.history = 15;
    } else {
        breakdown.history = 5;
        recommendations.push("Building grant history will improve future scores");
    }

    // 4. Mission/Category Alignment (20 points)
    const categoryScores: Record<GrantCategory, string[]> = {
        FEDERAL: ["education", "improvement", "title"],
        STATE: ["state", "local", "community"],
        NUTRITION: ["nutrition", "lunch", "food", "health"],
        ARTS: ["art", "creative", "music", "theater", "culture"],
        STEM: ["stem", "science", "technology", "engineering", "math", "computer"],
        INFRASTRUCTURE: ["building", "facility", "energy", "infrastructure"],
        PRIVATE_FOUNDATION: ["innovation", "foundation", "initiative"],
        CORPORATE: ["corporate", "business", "sponsor"],
        OTHER: [],
    };

    const missionLower = (district.missionStatement || "").toLowerCase();
    const relevantKeywords = categoryScores[grant.category] || [];
    const matchCount = relevantKeywords.filter((kw) =>
        missionLower.includes(kw)
    ).length;

    if (matchCount >= 2) {
        breakdown.alignment = 20;
    } else if (matchCount === 1) {
        breakdown.alignment = 15;
    } else {
        breakdown.alignment = 10;
        recommendations.push(
            `Consider updating mission statement to emphasize ${grant.category.toLowerCase()} initiatives`
        );
    }

    const score = Math.min(
        100,
        breakdown.demographics + breakdown.geography + breakdown.history + breakdown.alignment
    );

    return { score, breakdown, recommendations };
}

/**
 * Quick score calculation for listing views
 */
export function quickScore(district: SchoolDistrict, grant: Grant): number {
    return calculateSuitabilityScore(district, grant).score;
}
