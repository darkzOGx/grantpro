import { prisma } from "@/lib/prisma";
import { grantsGovClient } from "./clients/grants-gov";
import { normalizeGrantsGovOpportunity, generateGrantChecksum } from "./normalizer";
import { IngestionSource, IngestionRun, IngestionRunStatus, GrantSourceType, GrantCategory } from "@prisma/client";

/**
 * Orchestrates the ingestion of grants from Grants.gov
 * Focuses on Education-related grants for now.
 */
export async function ingestGrantsGov() {
    const SOURCE_NAME = "grants_gov";
    console.log(`🚀 Starting Grants.gov ingestion...`);

    // 1. Ensure Ingestion Source exists
    const source = await prisma.ingestionSource.upsert({
        where: { name: SOURCE_NAME },
        create: {
            name: SOURCE_NAME,
            displayName: "Grants.gov",
            sourceType: "FEDERAL_API",
            baseUrl: "https://www.grants.gov",
            syncFrequency: "0 6 * * *", // Daily at 6am
        },
        update: {},
    });

    // 2. Create Ingestion Run record
    const run = await prisma.ingestionRun.create({
        data: {
            sourceId: source.id,
            sourceName: source.displayName,
            status: "RUNNING",
        },
    });

    try {
        // 3. Fetch Opportunities
        console.log("📡 Fetching grants from Grants.gov...");
        // Fetch Education, USDA Nutrition, and NEA Arts grants
        const opportunities = await grantsGovClient.fetchEducationGrants();
        console.log(`✅ Fetched ${opportunities.length} opportunities.`);

        await prisma.ingestionRun.update({
            where: { id: run.id },
            data: { totalFetched: opportunities.length },
        });

        // 4. Process each opportunity
        let newCount = 0;
        let updatedCount = 0;
        let errorCount = 0;
        const errors: any[] = [];

        for (const opp of opportunities) {
            try {
                // Normalize
                const normalized = normalizeGrantsGovOpportunity(opp);
                const checksum = generateGrantChecksum(normalized);
                const externalId = normalized.externalId;

                if (!externalId) {
                    throw new Error("Missing OpportunityID");
                }

                // Check for existing RawGrant
                const existingRaw = await prisma.rawGrant.findUnique({
                    where: {
                        sourceId_externalId: {
                            sourceId: source.id,
                            externalId: externalId,
                        },
                    },
                });

                // Skip if unchanged
                if (existingRaw && existingRaw.checksum === checksum) {
                    continue;
                }

                // Upsert RawGrant
                const rawGrant = await prisma.rawGrant.upsert({
                    where: {
                        sourceId_externalId: {
                            sourceId: source.id,
                            externalId: externalId,
                        },
                    },
                    create: {
                        sourceId: source.id,
                        externalId: externalId,
                        rawData: opp as any, // Cast to any for JSON compatibility
                        checksum: checksum,
                        status: "NORMALIZED",
                        normalizedAt: new Date(),
                    },
                    update: {
                        rawData: opp as any,
                        checksum: checksum,
                        status: "NORMALIZED",
                        normalizedAt: new Date(),
                        updatedAt: new Date(),
                    },
                });

                // Upsert Normalized Grant
                // We use `externalId` to try to find existing grant to update, or create new.
                // Note: The schema has `externalId` on Grant model.

                // First try to find by externalId to update
                let grant = await prisma.grant.findFirst({
                    where: {
                        externalId: externalId,
                        ingestionSourceId: source.id
                    }
                });

                if (grant) {
                    // Update existing
                    await prisma.grant.update({
                        where: { id: grant.id },
                        data: {
                            title: normalized.title,
                            category: normalized.category,
                            fundingAmountMin: normalized.fundingAmountMin,
                            fundingAmountMax: normalized.fundingAmountMax,
                            deadline: normalized.deadline,
                            description: normalized.description,
                            eligibilityCriteria: normalized.eligibilityCriteria,
                            isActive: normalized.isActive,
                            // Update URLs as well
                            sourceUrl: normalized.sourceUrl,
                            applicationUrl: normalized.applicationUrl,
                            lastSyncedAt: new Date(),
                        }
                    });
                    updatedCount++;
                } else {
                    // Create new
                    grant = await prisma.grant.create({
                        data: {
                            title: normalized.title,
                            category: normalized.category,
                            sourceType: normalized.sourceType,
                            fundingAmountMin: normalized.fundingAmountMin,
                            fundingAmountMax: normalized.fundingAmountMax,
                            deadline: normalized.deadline,
                            description: normalized.description,
                            eligibilityCriteria: normalized.eligibilityCriteria,
                            requirements: normalized.requirements as any,
                            applicationUrl: normalized.applicationUrl,
                            externalId: normalized.externalId,
                            sourceUrl: normalized.sourceUrl,
                            cfda: normalized.cfda,
                            agencyCode: normalized.agencyCode,
                            ingestionSourceId: source.id,
                            lastSyncedAt: new Date(),
                            isActive: normalized.isActive,
                        }
                    });
                    newCount++;
                }

                // Link RawGrant to Grant
                await prisma.rawGrant.update({
                    where: { id: rawGrant.id },
                    data: { grantId: grant.id }
                });

            } catch (err: any) {
                console.error(`❌ Error processing opportunity ${opp.opportunityId}:`, err.message);
                errorCount++;
                errors.push({
                    id: opp.opportunityId,
                    error: err.message,
                });
            }
        }

        // 5. Finalize Run
        await prisma.ingestionRun.update({
            where: { id: run.id },
            data: {
                status: errorCount > 0 ? (newCount + updatedCount > 0 ? "PARTIAL" : "FAILED") : "SUCCESS",
                completedAt: new Date(),
                totalNew: newCount,
                totalUpdated: updatedCount,
                totalErrors: errorCount,
                errorLog: errors.length > 0 ? errors : undefined,
            },
        });

        // Update Source stats
        await prisma.ingestionSource.update({
            where: { id: source.id },
            data: {
                lastSyncAt: new Date(),
                lastSyncStatus: errorCount > 0 ? (newCount + updatedCount > 0 ? "partial" : "error") : "success",
                lastSyncCount: newCount + updatedCount,
            },
        });

        console.log(`🏁 Ingestion complete! New: ${newCount}, Updated: ${updatedCount}, Errors: ${errorCount}`);

    } catch (criticalError: any) {
        console.error("💥 Critical ingestion failure:", criticalError);
        await prisma.ingestionRun.update({
            where: { id: run.id },
            data: {
                status: "FAILED",
                completedAt: new Date(),
                errorLog: { critical: criticalError.message },
            },
        });
        throw criticalError;
    }
}
