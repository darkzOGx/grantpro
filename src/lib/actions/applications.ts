"use server";

import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@/types";

export async function getApplications() {
    const applications = await prisma.application.findMany({
        include: {
            grant: true,
            deliverables: true,
        },
        orderBy: { updatedAt: "desc" },
    });

    return applications.map((app) => ({
        id: app.id,
        status: app.status as ApplicationStatus,
        matchScore: app.matchScore || 0,
        autoApplyEnabled: app.autoApplyEnabled,
        submittedAt: app.submittedAt?.toISOString() || null,
        grant: {
            id: app.grant.id,
            title: app.grant.title,
            category: app.grant.category,
            fundingAmountMin: Number(app.grant.fundingAmountMin),
            fundingAmountMax: Number(app.grant.fundingAmountMax),
            deadline: app.grant.deadline.toISOString(),
        },
    }));
}
