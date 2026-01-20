"use server";

import { prisma } from "@/lib/prisma";

export async function getCurrentDistrict() {
    // Return the first district, or null if none exist
    const district = await prisma.schoolDistrict.findFirst({
        orderBy: { createdAt: "asc" },
    });

    if (!district) {
        return {
            id: "mock-district-1",
            name: "Lincoln Unified School District",
            state: "CA",
            county: "San Joaquin",
            studentCount: 8900,
            freeLunchPct: 68.5,
            demographics: {
                asian: 12,
                hispanic: 45,
                black: 15,
                white: 28
            },
            previousGrants: [],
            missionStatement: "To provide exceptional education...",
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    return district;
}
