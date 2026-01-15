/**
 * Grant Ingestion API Routes
 * 
 * POST /api/ingestion/sync - Trigger sync for a source
 * GET /api/ingestion/status - Get status of all sources
 */

import { NextRequest, NextResponse } from "next/server";
import { ingestionOrchestrator } from "@/lib/ingestion";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { source } = body;

        if (!source) {
            return NextResponse.json(
                { error: "Missing required field: source" },
                { status: 400 }
            );
        }

        // Start ingestion (async - will return immediately)
        const result = await ingestionOrchestrator.runIngestion(source);

        return NextResponse.json({
            status: "completed",
            result,
        });
    } catch (error) {
        console.error("Ingestion error:", error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const [sources, recentRuns] = await Promise.all([
            ingestionOrchestrator.getSourcesStatus(),
            ingestionOrchestrator.getRecentRuns(5),
        ]);

        return NextResponse.json({
            sources,
            recentRuns,
        });
    } catch (error) {
        console.error("Status fetch error:", error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
}
