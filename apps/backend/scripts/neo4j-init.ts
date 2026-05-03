/**
 * Initialize Neo4j constraints for the memory graph.
 *
 * Usage:
 *   npm run neo4j:init
 *
 * Requires NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD (and optional NEO4J_DATABASE)
 * to be set in the environment (e.g., via apps/backend/.env).
 */
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });

import { closeNeo4jDriver, getNeo4jDatabase, isNeo4jEnabled } from "../lib/neo4j";
import { initializeNeo4jConstraints } from "../lib/memory-graph";

async function main() {
  if (!isNeo4jEnabled()) {
    console.error(
      "[neo4j:init] Neo4j is disabled or missing credentials. " +
        "Set NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD and (optionally) NEO4J_DATABASE."
    );
    process.exit(1);
  }

  console.log(`[neo4j:init] Applying constraints to database "${getNeo4jDatabase()}"...`);
  const result = await initializeNeo4jConstraints();

  if (!result.ok) {
    console.error("[neo4j:init] Failed to apply constraints.");
    await closeNeo4jDriver();
    process.exit(1);
  }

  console.log(
    `[neo4j:init] Applied ${result.applied.length} constraints: ${result.applied.join(", ")}`
  );
  await closeNeo4jDriver();
  process.exit(0);
}

main().catch(async (err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[neo4j:init] Error: ${msg}`);
  await closeNeo4jDriver();
  process.exit(1);
});
