/**
 * Neo4j smoke test: verifies connectivity with a trivial RETURN 1 query.
 *
 * Usage:
 *   npm run neo4j:smoke
 */
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });

import {
  closeNeo4jDriver,
  getNeo4jDatabase,
  isNeo4jEnabled,
  pingNeo4j,
} from "../lib/neo4j";

async function main() {
  if (!isNeo4jEnabled()) {
    console.error(
      "[neo4j:smoke] Neo4j is disabled or missing credentials. " +
        "Set NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD and (optionally) NEO4J_DATABASE."
    );
    process.exit(1);
  }

  console.log(`[neo4j:smoke] Pinging database "${getNeo4jDatabase()}"...`);
  const ok = await pingNeo4j();
  await closeNeo4jDriver();

  if (!ok) {
    console.error("[neo4j:smoke] Connection failed.");
    process.exit(1);
  }

  console.log("[neo4j:smoke] OK — RETURN 1 succeeded.");
  process.exit(0);
}

main().catch(async (err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[neo4j:smoke] Error: ${msg}`);
  await closeNeo4jDriver();
  process.exit(1);
});
