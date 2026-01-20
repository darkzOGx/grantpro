"use server";

import { prisma } from "@/lib/prisma";
import { GrantCategory, GrantWithScore } from "@/types";
import { Prisma } from "@prisma/client";

export type SortOption = "deadline" | "value_desc" | "value_asc";

export async function getGrants({
    search,
    categories,
    sortBy = "deadline",
}: {
    search?: string;
    categories?: GrantCategory[];
    sortBy?: SortOption;
} = {}) {
    const where: Prisma.GrantWhereInput = {
        isActive: true,
        // Only show grants that are still accepting applications (future deadline)
        deadline: { gte: new Date() },
        // Strict Filter: Only show grants relevant to School Districts
        OR: [
            { title: { contains: "School", mode: "insensitive" } },
            { title: { contains: "Education", mode: "insensitive" } },
            { title: { contains: "K-12", mode: "insensitive" } },
            { title: { contains: "District", mode: "insensitive" } },
            { title: { contains: "Student", mode: "insensitive" } },
            { title: { contains: "Teacher", mode: "insensitive" } },
            { title: { contains: "Classroom", mode: "insensitive" } },
            { title: { contains: "STEM", mode: "insensitive" } },
            { title: { contains: "Arts", mode: "insensitive" } },
            { title: { contains: "Nutrition", mode: "insensitive" } },
            { title: { contains: "Lunch", mode: "insensitive" } },
            { title: { contains: "Breakfast", mode: "insensitive" } },
            { description: { contains: "School", mode: "insensitive" } },
            { description: { contains: "Education", mode: "insensitive" } },
            { description: { contains: "K-12", mode: "insensitive" } },
        ]
    };

    if (search) {
        // Merge search with the school relevance filter
        where.AND = [
            {
                OR: [
                    { title: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                ]
            }
        ];
    }

    if (categories && categories.length > 0) {
        where.category = { in: categories };
    }

    // Determine sort order
    let orderBy: Prisma.GrantOrderByWithRelationInput;
    switch (sortBy) {
        case "value_desc":
            orderBy = { fundingAmountMax: "desc" };
            break;
        case "value_asc":
            orderBy = { fundingAmountMax: "asc" };
            break;
        case "deadline":
        default:
            orderBy = { deadline: "asc" };
            break;
    }

    const grants = await prisma.grant.findMany({
        where,
        orderBy,
        include: {
            applications: {
                select: {
                    status: true,
                    autoApplyEnabled: true,
                },
            },
        },
    });

    // Map to GrantWithScore type (simulating match score for now as 0-100 random or placeholder)
    // In a real scenario, this would come from a separate scoring engine or pre-calculated field
    return grants.map((grant) => {
        const app = grant.applications[0];
        return {
            ...grant,
            matchScore: Math.floor(Math.random() * 30) + 70, // Mock score 70-100 for demo
            applicationStatus: app?.status,
            autoApplyEnabled: app?.autoApplyEnabled,
            fundingAmountMin: Number(grant.fundingAmountMin),
            fundingAmountMax: Number(grant.fundingAmountMax),
        } as GrantWithScore;
    });
}

