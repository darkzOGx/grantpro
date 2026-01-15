"use server";

import { prisma } from "@/lib/prisma";
import { GrantCategory, GrantWithScore } from "@/types";
import { Prisma } from "@prisma/client";

export async function getGrants({
    search,
    categories,
}: {
    search?: string;
    categories?: GrantCategory[];
} = {}) {
    const where: Prisma.GrantWhereInput = {
        isActive: true,
        // Only show grants that are still accepting applications (future deadline)
        deadline: { gte: new Date() },
    };

    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }

    if (categories && categories.length > 0) {
        where.category = { in: categories };
    }

    const grants = await prisma.grant.findMany({
        where,
        orderBy: { createdAt: "desc" },
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
