/**
 * Grants API Routes
 * 
 * GET /api/grants - List all grants with filtering
 * GET /api/grants/[id] - Get grant by ID
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { GrantCategory } from "@prisma/client";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        // Parse query parameters
        const category = searchParams.get("category") as GrantCategory | null;
        const search = searchParams.get("search");
        const activeOnly = searchParams.get("active") !== "false";
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        // Build where clause
        const where: Record<string, unknown> = {};

        if (activeOnly) {
            where.isActive = true;
        }

        if (category) {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }

        // Fetch grants
        const [grants, total] = await Promise.all([
            prisma.grant.findMany({
                where,
                orderBy: { deadline: "asc" },
                take: limit,
                skip: offset,
                include: {
                    ingestionSource: {
                        select: {
                            name: true,
                            displayName: true,
                        },
                    },
                },
            }),
            prisma.grant.count({ where }),
        ]);

        return NextResponse.json({
            grants,
            total,
            limit,
            offset,
        });
    } catch (error) {
        console.error("Grants fetch error:", error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
}
