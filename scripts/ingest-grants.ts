
import { ingestGrantsGov } from "../src/lib/ingestion/actions";
import { prisma } from "@/lib/prisma";

async function main() {
    try {
        console.log("🎬 Starting Grants Ingestion CLI...");
        await ingestGrantsGov();
        console.log("✅ Ingestion CLI completed successfully.");
    } catch (error) {
        console.error("❌ Ingestion CLI failed:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
