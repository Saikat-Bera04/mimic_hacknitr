/**
 * Neo4j client module.
 *
 * Provides a lazily-initialized singleton driver, a session helper, and
 * graceful degradation when Neo4j environment variables are missing.
 *
 * Required env vars:
 *   NEO4J_URI
 *   NEO4J_USERNAME
 *   NEO4J_PASSWORD
 *   NEO4J_DATABASE (optional, defaults to "neo4j")
 *
 * Optional tuning env vars (consumed elsewhere, documented here for clarity):
 *   NEO4J_GRAPH_ENABLED        - "false" to explicitly disable even if creds are present
 *   NEO4J_GRAPH_MAX_DEPTH      - default graph expansion depth
 *   NEO4J_GRAPH_CONTEXT_LIMIT  - default max nodes returned per expansion
 */
import neo4j, { Driver, Session, ManagedTransaction } from "neo4j-driver";

type SessionMode = "read" | "write";

let driver: Driver | null = null;
let initAttempted = false;
let initFailed = false;

function getEnabledFlag(): boolean {
  const flag = (process.env.NEO4J_GRAPH_ENABLED ?? "").trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "no") return false;
  return true;
}

function hasRequiredEnv(): boolean {
  return Boolean(
    process.env.NEO4J_URI &&
      process.env.NEO4J_USERNAME &&
      process.env.NEO4J_PASSWORD
  );
}

/**
 * Returns whether the Neo4j integration is currently enabled.
 * Enabled iff: NEO4J_GRAPH_ENABLED != "false" AND required creds present AND init did not fail.
 */
export function isNeo4jEnabled(): boolean {
  return getEnabledFlag() && hasRequiredEnv() && !initFailed;
}

/**
 * Returns the Neo4j database name to use (defaults to "neo4j").
 */
export function getNeo4jDatabase(): string {
  return process.env.NEO4J_DATABASE || "neo4j";
}

/**
 * Lazily initializes and returns the singleton Neo4j driver.
 * Returns null if Neo4j is disabled or credentials are missing.
 * Never throws on missing creds; only logs a concise warning once.
 */
export function getNeo4jDriver(): Driver | null {
  if (!getEnabledFlag()) return null;
  if (!hasRequiredEnv()) {
    if (!initAttempted) {
      initAttempted = true;
      console.warn(
        "[neo4j] Missing NEO4J_URI / NEO4J_USERNAME / NEO4J_PASSWORD — graph layer disabled."
      );
    }
    return null;
  }

  if (driver) return driver;
  if (initFailed) return null;

  initAttempted = true;
  try {
    const uri = process.env.NEO4J_URI as string;
    const user = process.env.NEO4J_USERNAME as string;
    const password = process.env.NEO4J_PASSWORD as string;

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      // Reasonable defaults; tune if needed.
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 30_000,
      disableLosslessIntegers: true,
    });

    // Fire-and-forget verification; don't block startup.
    driver
      .verifyConnectivity({ database: getNeo4jDatabase() })
      .then(() => {
        console.log(`[neo4j] Connected to database "${getNeo4jDatabase()}"`);
      })
      .catch((err: Error) => {
        console.warn(
          `[neo4j] Connectivity check failed: ${err.message}. Continuing with Neo4j disabled.`
        );
        initFailed = true;
      });

    return driver;
  } catch (err) {
    initFailed = true;
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[neo4j] Failed to initialize driver: ${msg}`);
    return null;
  }
}

/**
 * Runs `work` against a Neo4j session with automatic cleanup.
 * If Neo4j is disabled/unavailable, returns `fallback` without invoking `work`.
 */
export async function withNeo4jSession<T>(
  work: (session: Session) => Promise<T>,
  options: { mode?: SessionMode; fallback?: T } = {}
): Promise<T | undefined> {
  const d = getNeo4jDriver();
  if (!d) return options.fallback;

  const mode = options.mode ?? "write";
  const session = d.session({
    database: getNeo4jDatabase(),
    defaultAccessMode: mode === "read" ? neo4j.session.READ : neo4j.session.WRITE,
  });

  try {
    return await work(session);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Never leak credentials; only log the error message.
    console.warn(`[neo4j] Session error (${mode}): ${msg}`);
    return options.fallback;
  } finally {
    try {
      await session.close();
    } catch {
      /* swallow */
    }
  }
}

/**
 * Convenience wrapper for running a single write transaction with parameterized Cypher.
 */
export async function runWriteTx<T>(
  work: (tx: ManagedTransaction) => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  return withNeo4jSession(
    async (session) => session.executeWrite(work),
    { mode: "write", fallback }
  );
}

/**
 * Convenience wrapper for running a single read transaction with parameterized Cypher.
 */
export async function runReadTx<T>(
  work: (tx: ManagedTransaction) => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  return withNeo4jSession(
    async (session) => session.executeRead(work),
    { mode: "read", fallback }
  );
}

/**
 * Close the singleton Neo4j driver. Safe to call multiple times.
 */
export async function closeNeo4jDriver(): Promise<void> {
  if (!driver) return;
  try {
    await driver.close();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[neo4j] Error closing driver: ${msg}`);
  } finally {
    driver = null;
  }
}

/**
 * Attempts a trivial RETURN 1 query to test connectivity.
 * Returns true if connection succeeded, false otherwise.
 */
export async function pingNeo4j(): Promise<boolean> {
  const d = getNeo4jDriver();
  if (!d) return false;
  try {
    const result = await withNeo4jSession(
      async (session) => {
        const r = await session.run("RETURN 1 AS ok");
        return r.records[0]?.get("ok") === 1;
      },
      { mode: "read", fallback: false }
    );
    return Boolean(result);
  } catch {
    return false;
  }
}
