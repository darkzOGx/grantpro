/**
 * Ingestion Sources API
 * 
 * GET /api/ingestion/sources - List all sources and their status
 * POST /api/ingestion/sources - Trigger ingestion for a specific source
 */

import { NextRequest, NextResponse } from "next/server";
import { ingestionOrchestrator } from "@/lib/ingestion";

/**
 * Get all configured ingestion sources and their status
 */
export async function GET() {
    try {
        const sources = await ingestionOrchestrator.getSourcesStatus();
        const recentRuns = await ingestionOrchestrator.getRecentRuns(20);

        return NextResponse.json({
            sources,
            recentRuns,
            availableSources: [
                "grants_gov",
                "ca_grants",
                "usaspending",
                "nsf_awards",
                "propublica_990",
            ],
        });
    } catch (error) {
        console.error("Error fetching ingestion sources:", error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
}

/**
 * Trigger ingestion for a specific source
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { source } = body;

        if (!source) {
            return NextResponse.json(
                { error: "Missing 'source' in request body" },
                { status: 400 }
            );
        }

        console.log(`Starting ingestion for source: ${source}`);
        const result = await ingestionOrchestrator.runIngestion(source);

        return NextResponse.json({
            success: true,
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
