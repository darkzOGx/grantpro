"use server";

import { prisma } from "@/lib/prisma";

export async function getCurrentDistrict() {
    // Return the first district, or null if none exist
    const district = await prisma.schoolDistrict.findFirst({
        orderBy: { createdAt: "asc" },
    });
    return district;
}
