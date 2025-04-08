import { QueueService } from "@odin/core/services";
import { initMikroORM } from "@odin/core/db";

/**
 * This file is meant to be run as a standalone process via cron
 * It handles queue processing in a reliable way
 */

async function run() {
  // Initialize the ORM
  console.log("Initializing MikroORM...");
  const orm = await initMikroORM();

  try {
    console.log("Setting up queue service...");
    const queueService = new QueueService(orm.em);

    // Process a single batch of jobs
    console.log("Processing jobs...");

    // We're not using startWorker() here since this is a cron job
    // that should process one batch and exit
    await queueService.processNextBatch();

    console.log("Job processing completed");
  } catch (error) {
    console.error("Error during job processing:", error);
  } finally {
    // Clean up and close the connection
    await orm.close(true);
    console.log("ORM connection closed");
  }
}

// Run the worker
run().catch((error) => {
  console.error("Unhandled error in cron worker:", error);
  process.exit(1);
});
