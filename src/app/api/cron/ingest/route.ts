/**
 * Cron Job for Scheduled Grant Ingestion
 * 
 * Runs daily at 6am UTC via Vercel Cron
 * Syncs all active ingestion sources
 */

import { NextRequest, NextResponse } from "next/server";
import { ingestionOrchestrator } from "@/lib/ingestion";

// Vercel cron jobs require this config
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max for Pro plans

export async function GET(request: NextRequest) {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization");

    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CRON] Starting scheduled grant ingestion...");

    const results = [];
    const sources = ["grants_gov", "ca_grants"];

    for (const source of sources) {
        try {
            console.log(`[CRON] Syncing ${source}...`);
            const result = await ingestionOrchestrator.runIngestion(source);
            results.push({
                source,
                status: "success",
                ...result,
            });
            console.log(`[CRON] ${source}: ${result.totalNew} new, ${result.totalUpdated} updated`);
        } catch (error) {
            console.error(`[CRON] ${source} failed:`, error);
            results.push({
                source,
                status: "error",
                error: (error as Error).message,
            });
        }
    }

    const summary = {
        timestamp: new Date().toISOString(),
        totalSources: sources.length,
        successful: results.filter((r) => r.status === "success").length,
        failed: results.filter((r) => r.status === "error").length,
        results,
    };

    console.log("[CRON] Ingestion complete:", JSON.stringify(summary));

    return NextResponse.json(summary);
}
