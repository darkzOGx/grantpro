import { ingestionOrchestrator } from "../src/lib/ingestion";

async function main() {
  console.log("Available sources:", ingestionOrchestrator.getAvailableSources());
  console.log("\nStarting ingestion for all sources...\n");
  
  try {
    const results = await ingestionOrchestrator.runAllIngestions();
    
    console.log("\n=== INGESTION SUMMARY ===");
    for (const [source, result] of results) {
      console.log(`${source}: ${result.totalNew} new, ${result.totalUpdated} updated, ${result.totalErrors} errors`);
    }
  } catch (error) {
    console.error("Ingestion failed:", error);
  }
}

main();
