import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearMockData() {
    console.log("🗑️  Purging ALL mock/seeded data...");

    // Delete in order of foreign key dependencies
    console.log("  - Deleting Deliverables...");
    await prisma.deliverable.deleteMany({});

    console.log("  - Deleting Applications...");
    await prisma.application.deleteMany({});

    console.log("  - Deleting School Districts...");
    await prisma.schoolDistrict.deleteMany({});

    // Keep ingested grants but clear raw grants for fresh start if needed
    // Actually, let's keep the grants we ingested from Grants.gov
    // Only clear the seeded ones that don't have an ingestionSourceId
    console.log("  - Deleting seeded grants (without ingestion source)...");
    await prisma.grant.deleteMany({
        where: {
            ingestionSourceId: null
        }
    });

    console.log("✅ All mock/seeded data purged!");
    console.log("ℹ️  Only real ingested grants remain.");
}

clearMockData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
