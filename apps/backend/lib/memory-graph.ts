/**
 * Memory graph service for Neo4j.
 *
 * Mirrors Convex memory writes into a relationship graph for GraphRAG-style
 * retrieval, explainability, and contradiction detection.
 *
 * All functions are defensive: if Neo4j is disabled/unavailable, they return
 * empty or no-op results and never throw.
 */
import { isNeo4jEnabled, runReadTx, runWriteTx } from "./neo4j";

/* =============================================================================
 * Types
 * ========================================================================== */

export type TrustWeight = "owner" | "trainer" | "derived";
export type MemorySource =
  | "user_saved"
  | "trainer_added"
  | "voice_input"
  | "conversation_extract";

export interface UserNodeInput {
  id: string;
  clerkId?: string | null;
  email?: string | null;
  userName?: string | null;
}

export interface AvatarNodeInput {
  id: string;
  name: string;
  ownerId?: string | null;
}

export interface TrainerNodeInput {
  id: string;
  userId?: string | null;
  name?: string | null;
}

export interface MemoryNodeInput {
  id: string;
  avatarId: string;
  text: string;
  category?: string | null;
  trustWeight?: TrustWeight | null;
  source?: MemorySource | null;
  isActive?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface EntityInput {
  name: string;
  type?: string;
}

export interface TraitInput {
  name: string;
  category?: string;
}

export interface ExpandOptions {
  maxDepth?: number;
  limit?: number;
  includeContradictions?: boolean;
}

export interface GraphContext {
  enabled: boolean;
  memoryIds: string[];
  relatedMemories: Array<{
    id: string;
    text: string;
    score?: number;
    reason?: string;
  }>;
  entities: Array<{ name: string; type?: string }>;
  traits: Array<{ name: string; category?: string }>;
  contradictions: Array<{
    memoryIdA: string;
    memoryIdB: string;
    reason?: string;
  }>;
}

function emptyGraphContext(memoryIds: string[] = []): GraphContext {
  return {
    enabled: false,
    memoryIds,
    relatedMemories: [],
    entities: [],
    traits: [],
    contradictions: [],
  };
}

/* =============================================================================
 * Upserts
 * ========================================================================== */

export async function upsertUserNode(user: UserNodeInput): Promise<void> {
  if (!isNeo4jEnabled() || !user?.id) return;
  await runWriteTx(async (tx) => {
    await tx.run(
      `
      MERGE (u:User {id: $id})
      SET u.clerkId = coalesce($clerkId, u.clerkId),
          u.email = coalesce($email, u.email),
          u.userName = coalesce($userName, u.userName)
      `,
      {
        id: user.id,
        clerkId: user.clerkId ?? null,
        email: user.email ?? null,
        userName: user.userName ?? null,
      }
    );
  });
}

export async function upsertAvatarNode(avatar: AvatarNodeInput): Promise<void> {
  if (!isNeo4jEnabled() || !avatar?.id) return;
  await runWriteTx(async (tx) => {
    await tx.run(
      `
      MERGE (a:Avatar {id: $id})
      SET a.name = coalesce($name, a.name),
          a.ownerId = coalesce($ownerId, a.ownerId)
      WITH a
      OPTIONAL MATCH (u:User {id: $ownerId})
      FOREACH (_ IN CASE WHEN u IS NULL THEN [] ELSE [1] END |
        MERGE (u)-[:OWNS]->(a)
      )
      `,
      {
        id: avatar.id,
        name: avatar.name ?? null,
        ownerId: avatar.ownerId ?? null,
      }
    );
  });
}

export async function upsertTrainerNode(trainer: TrainerNodeInput): Promise<void> {
  if (!isNeo4jEnabled() || !trainer?.id) return;
  await runWriteTx(async (tx) => {
    await tx.run(
      `
      MERGE (t:Trainer {id: $id})
      SET t.userId = coalesce($userId, t.userId),
          t.name = coalesce($name, t.name)
      `,
      {
        id: trainer.id,
        userId: trainer.userId ?? null,
        name: trainer.name ?? null,
      }
    );
  });
}

export async function upsertMemoryNode(memory: MemoryNodeInput): Promise<void> {
  if (!isNeo4jEnabled() || !memory?.id) return;
  await runWriteTx(async (tx) => {
    await tx.run(
      `
      MERGE (m:Memory {id: $id})
      SET m.avatarId = $avatarId,
          m.text = $text,
          m.category = $category,
          m.trustWeight = $trustWeight,
          m.source = $source,
          m.isActive = $isActive,
          m.createdAt = $createdAt,
          m.updatedAt = $updatedAt
      `,
      {
        id: memory.id,
        avatarId: memory.avatarId,
        text: memory.text ?? "",
        category: memory.category ?? null,
        trustWeight: memory.trustWeight ?? null,
        source: memory.source ?? null,
        isActive: memory.isActive ?? true,
        createdAt: memory.createdAt ?? Date.now(),
        updatedAt: memory.updatedAt ?? Date.now(),
      }
    );
  });
}

/* =============================================================================
 * Links
 * ========================================================================== */

export async function linkAvatarMemory(
  avatarId: string,
  memoryId: string
): Promise<void> {
  if (!isNeo4jEnabled() || !avatarId || !memoryId) return;
  await runWriteTx(async (tx) => {
    await tx.run(
      `
      MERGE (a:Avatar {id: $avatarId})
      MERGE (m:Memory {id: $memoryId})
      MERGE (a)-[:HAS_MEMORY]->(m)
      `,
      { avatarId, memoryId }
    );
  });
}

export async function linkTrainerMemory(
  trainerId: string,
  memoryId: string,
  avatarId?: string
): Promise<void> {
  if (!isNeo4jEnabled() || !trainerId || !memoryId) return;
  await runWriteTx(async (tx) => {
    await tx.run(
      `
      MERGE (t:Trainer {id: $trainerId})
      MERGE (m:Memory {id: $memoryId})
      MERGE (t)-[:ADDED]->(m)
      `,
      { trainerId, memoryId }
    );

    if (avatarId) {
      await tx.run(
        `
        MERGE (t:Trainer {id: $trainerId})
        MERGE (a:Avatar {id: $avatarId})
        MERGE (t)-[:TRAINED]->(a)
        `,
        { trainerId, avatarId }
      );
    }
  });
}

export async function linkMemoryEntities(
  memoryId: string,
  entities: EntityInput[]
): Promise<void> {
  if (!isNeo4jEnabled() || !memoryId || !entities?.length) return;
  const cleaned = entities
    .map((e) => ({
      name: (e.name || "").trim(),
      type: (e.type || "misc").trim(),
    }))
    .filter((e) => e.name.length > 0);
  if (cleaned.length === 0) return;

  await runWriteTx(async (tx) => {
    await tx.run(
      `
      MATCH (m:Memory {id: $memoryId})
      UNWIND $entities AS ent
      MERGE (e:Entity {name: ent.name, type: ent.type})
      MERGE (m)-[:MENTIONS]->(e)
      `,
      { memoryId, entities: cleaned }
    );
  });
}

export async function linkMemoryTraits(
  memoryId: string,
  traits: TraitInput[]
): Promise<void> {
  if (!isNeo4jEnabled() || !memoryId || !traits?.length) return;
  const cleaned = traits
    .map((t) => ({
      name: (t.name || "").trim(),
      category: (t.category || "general").trim(),
    }))
    .filter((t) => t.name.length > 0);
  if (cleaned.length === 0) return;

  await runWriteTx(async (tx) => {
    await tx.run(
      `
      MATCH (m:Memory {id: $memoryId})
      UNWIND $traits AS tr
      MERGE (t:Trait {name: tr.name, category: tr.category})
      MERGE (m)-[:EXPRESSES]->(t)
      `,
      { memoryId, traits: cleaned }
    );
  });
}

export async function linkRelatedMemories(
  memoryId: string,
  relatedMemoryIds: string[],
  score: number = 0.5,
  reason: string = "semantic_similarity"
): Promise<void> {
  if (!isNeo4jEnabled() || !memoryId || !relatedMemoryIds?.length) return;
  const targets = relatedMemoryIds.filter((id) => id && id !== memoryId);
  if (targets.length === 0) return;

  await runWriteTx(async (tx) => {
    await tx.run(
      `
      MATCH (m:Memory {id: $memoryId})
      UNWIND $targets AS tid
      MERGE (r:Memory {id: tid})
      MERGE (m)-[rel:RELATED_TO]->(r)
      SET rel.score = $score,
          rel.reason = $reason
      `,
      { memoryId, targets, score, reason }
    );
  });
}

export async function markMemoryContradiction(
  memoryIdA: string,
  memoryIdB: string,
  reason?: string
): Promise<void> {
  if (!isNeo4jEnabled() || !memoryIdA || !memoryIdB || memoryIdA === memoryIdB) {
    return;
  }
  await runWriteTx(async (tx) => {
    await tx.run(
      `
      MERGE (a:Memory {id: $memoryIdA})
      MERGE (b:Memory {id: $memoryIdB})
      MERGE (a)-[rel:CONTRADICTS]->(b)
      SET rel.reason = $reason,
          rel.createdAt = $createdAt
      `,
      {
        memoryIdA,
        memoryIdB,
        reason: reason ?? null,
        createdAt: Date.now(),
      }
    );
  });
}

/* =============================================================================
 * Graph context expansion (GraphRAG)
 * ========================================================================== */

function getDefaultMaxDepth(): number {
  const raw = Number(process.env.NEO4J_GRAPH_MAX_DEPTH);
  if (Number.isFinite(raw) && raw > 0) return Math.min(Math.floor(raw), 4);
  return 2;
}

function getDefaultLimit(): number {
  const raw = Number(process.env.NEO4J_GRAPH_CONTEXT_LIMIT);
  if (Number.isFinite(raw) && raw > 0) return Math.min(Math.floor(raw), 50);
  return 12;
}

/**
 * Expand memory context in the graph starting from given memory ids.
 * Returns a compact, LLM-friendly structure.
 */
export async function expandMemoryContext(
  memoryIds: string[],
  options: ExpandOptions = {}
): Promise<GraphContext> {
  const cleanIds = (memoryIds || []).filter(
    (id): id is string => typeof id === "string" && id.length > 0
  );
  if (!isNeo4jEnabled() || cleanIds.length === 0) {
    return emptyGraphContext(cleanIds);
  }

  const maxDepth = Math.max(1, Math.min(options.maxDepth ?? getDefaultMaxDepth(), 4));
  const limit = Math.max(1, Math.min(options.limit ?? getDefaultLimit(), 50));
  const includeContradictions = options.includeContradictions ?? true;

  const result = await runReadTx(async (tx) => {
    // Related memories (via RELATED_TO within maxDepth)
    const relatedRes = await tx.run(
      `
      MATCH (start:Memory) WHERE start.id IN $ids
      MATCH (start)-[rel:RELATED_TO*1..${maxDepth}]->(m:Memory)
      WHERE NOT m.id IN $ids AND coalesce(m.isActive, true) = true
      WITH m, reduce(s=0.0, r IN rel | s + coalesce(r.score, 0.5)) / size(rel) AS avgScore,
           [r IN rel | coalesce(r.reason, 'related')][0] AS topReason
      RETURN m.id AS id, m.text AS text, avgScore AS score, topReason AS reason
      ORDER BY avgScore DESC
      LIMIT $limit
      `,
      { ids: cleanIds, limit }
    );

    // Entities mentioned by starting memories
    const entityRes = await tx.run(
      `
      MATCH (m:Memory)-[:MENTIONS]->(e:Entity)
      WHERE m.id IN $ids
      RETURN DISTINCT e.name AS name, e.type AS type
      LIMIT $limit
      `,
      { ids: cleanIds, limit }
    );

    // Traits expressed by starting memories
    const traitRes = await tx.run(
      `
      MATCH (m:Memory)-[:EXPRESSES]->(t:Trait)
      WHERE m.id IN $ids
      RETURN DISTINCT t.name AS name, t.category AS category
      LIMIT $limit
      `,
      { ids: cleanIds, limit }
    );

    let contradictions: Array<{
      memoryIdA: string;
      memoryIdB: string;
      reason?: string;
    }> = [];
    if (includeContradictions) {
      const contraRes = await tx.run(
        `
        MATCH (a:Memory)-[rel:CONTRADICTS]-(b:Memory)
        WHERE a.id IN $ids
        RETURN DISTINCT a.id AS aId, b.id AS bId, rel.reason AS reason
        LIMIT $limit
        `,
        { ids: cleanIds, limit }
      );
      contradictions = contraRes.records.map((r) => ({
        memoryIdA: r.get("aId"),
        memoryIdB: r.get("bId"),
        reason: r.get("reason") ?? undefined,
      }));
    }

    return {
      relatedMemories: relatedRes.records.map((r) => ({
        id: r.get("id") as string,
        text: (r.get("text") as string) ?? "",
        score:
          typeof r.get("score") === "number" ? (r.get("score") as number) : undefined,
        reason: (r.get("reason") as string) ?? undefined,
      })),
      entities: entityRes.records.map((r) => ({
        name: r.get("name") as string,
        type: (r.get("type") as string) ?? undefined,
      })),
      traits: traitRes.records.map((r) => ({
        name: r.get("name") as string,
        category: (r.get("category") as string) ?? undefined,
      })),
      contradictions,
    };
  });

  if (!result) return emptyGraphContext(cleanIds);

  return {
    enabled: true,
    memoryIds: cleanIds,
    relatedMemories: result.relatedMemories,
    entities: result.entities,
    traits: result.traits,
    contradictions: result.contradictions,
  };
}

/**
 * Render a GraphContext into a compact prompt block.
 * Returns "" when there is nothing meaningful to include.
 */
export function renderGraphContextForPrompt(ctx: GraphContext | undefined | null): string {
  if (!ctx || !ctx.enabled) return "";
  const lines: string[] = [];

  if (ctx.traits.length > 0) {
    const traitText = ctx.traits
      .slice(0, 8)
      .map((t) => (t.category ? `${t.name} (${t.category})` : t.name))
      .join(", ");
    lines.push(`- Related traits: ${traitText}`);
  }
  if (ctx.entities.length > 0) {
    const entText = ctx.entities
      .slice(0, 8)
      .map((e) => (e.type ? `${e.name} [${e.type}]` : e.name))
      .join(", ");
    lines.push(`- Mentioned entities: ${entText}`);
  }
  if (ctx.relatedMemories.length > 0) {
    lines.push(`- Related memories:`);
    ctx.relatedMemories.slice(0, 6).forEach((m) => {
      const text = m.text.length > 160 ? `${m.text.slice(0, 157)}...` : m.text;
      lines.push(`  • ${text}`);
    });
  }
  if (ctx.contradictions.length > 0) {
    lines.push(`- Possible contradictions:`);
    ctx.contradictions.slice(0, 4).forEach((c) => {
      lines.push(
        `  • memory ${c.memoryIdA} conflicts with memory ${c.memoryIdB}${
          c.reason ? ` — ${c.reason}` : ""
        }`
      );
    });
  }

  if (lines.length === 0) return "";
  return `\n\n## Relevant memory graph:\n${lines.join("\n")}\n`;
}

/* =============================================================================
 * Lightweight heuristic extraction (no LLM required)
 * ========================================================================== */

const TRAIT_KEYWORDS: Array<{
  name: string;
  category: string;
  patterns: RegExp[];
}> = [
  { name: "introverted", category: "personality", patterns: [/\bintrovert(ed)?\b/i, /\bquiet\b/i, /\bprefers?\s+solitude\b/i] },
  { name: "extroverted", category: "personality", patterns: [/\bextrovert(ed)?\b/i, /\boutgoing\b/i, /\bsocial\b/i] },
  { name: "empathetic", category: "personality", patterns: [/\bempath(etic|ic)?\b/i, /\bcompassionate\b/i] },
  { name: "analytical", category: "personality", patterns: [/\banalytical\b/i, /\blogical\b/i, /\brational\b/i] },
  { name: "creative", category: "personality", patterns: [/\bcreative\b/i, /\bartistic\b/i, /\bimaginative\b/i] },
  { name: "humorous", category: "personality", patterns: [/\bhumor(ous)?\b/i, /\bfunny\b/i, /\bwitty\b/i] },
  { name: "direct", category: "communication", patterns: [/\bdirect\b/i, /\bblunt\b/i, /\bto\s+the\s+point\b/i] },
  { name: "friendly", category: "communication", patterns: [/\bfriendly\b/i, /\bwarm\b/i, /\bkind\b/i] },
  { name: "formal", category: "communication", patterns: [/\bformal\b/i, /\bprofessional\b/i] },
  { name: "casual", category: "communication", patterns: [/\bcasual\b/i, /\binformal\b/i, /\brelaxed\b/i] },
  { name: "curious", category: "trait", patterns: [/\bcurious\b/i, /\binquisitive\b/i] },
  { name: "patient", category: "trait", patterns: [/\bpatient\b/i] },
  { name: "optimistic", category: "trait", patterns: [/\boptimistic\b/i, /\bpositive\b/i] },
];

const STOPWORDS = new Set([
  "the","a","an","and","or","but","if","then","so","is","are","was","were",
  "be","been","being","to","of","in","on","at","by","for","with","from",
  "as","that","this","these","those","it","its","he","she","they","them",
  "his","her","their","my","our","your","you","we","us","i","me","mine",
  "ours","yours","theirs","hers","him","who","whom","whose","which","what",
  "when","where","why","how","not","no","yes","do","does","did","have","has",
  "had","will","would","should","could","can","may","might","must","shall",
]);

/**
 * Very lightweight heuristic for pulling candidate entities (capitalized
 * multi-word proper nouns) and traits (keyword match) from a memory's text.
 *
 * This is intentionally cheap and LLM-free. Callers may later swap in a
 * smarter extractor if needed.
 */
export function extractEntitiesAndTraits(text: string): {
  entities: EntityInput[];
  traits: TraitInput[];
} {
  if (!text || typeof text !== "string") return { entities: [], traits: [] };

  // --- Traits ---
  const traits: TraitInput[] = [];
  const seenTraits = new Set<string>();
  for (const kw of TRAIT_KEYWORDS) {
    if (kw.patterns.some((re) => re.test(text))) {
      const key = `${kw.name}|${kw.category}`;
      if (!seenTraits.has(key)) {
        seenTraits.add(key);
        traits.push({ name: kw.name, category: kw.category });
      }
    }
  }

  // --- Entities (capitalized proper-noun runs) ---
  // Match runs of 1-4 capitalized words (letters/digits), not at sentence start only.
  const entities: EntityInput[] = [];
  const seenEntities = new Set<string>();
  const properNounRe = /\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,3})\b/g;
  let match: RegExpExecArray | null;
  while ((match = properNounRe.exec(text)) !== null) {
    const phrase = match[1].trim();
    // Skip if it's just a stopword or a single common sentence-starter word.
    const lower = phrase.toLowerCase();
    if (STOPWORDS.has(lower)) continue;
    // Skip single pronouns like "I" which don't match anyway, but guard length.
    if (phrase.length < 2) continue;
    if (seenEntities.has(lower)) continue;
    seenEntities.add(lower);
    entities.push({ name: phrase, type: "proper_noun" });
    if (entities.length >= 15) break;
  }

  return { entities, traits };
}

/* =============================================================================
 * Constraint initialization (idempotent)
 * ========================================================================== */

export async function initializeNeo4jConstraints(): Promise<{
  ok: boolean;
  skipped: boolean;
  applied: string[];
}> {
  if (!isNeo4jEnabled()) {
    return { ok: false, skipped: true, applied: [] };
  }

  const statements: Array<{ label: string; cypher: string }> = [
    {
      label: "user_id",
      cypher:
        "CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
    },
    {
      label: "avatar_id",
      cypher:
        "CREATE CONSTRAINT avatar_id IF NOT EXISTS FOR (a:Avatar) REQUIRE a.id IS UNIQUE",
    },
    {
      label: "trainer_id",
      cypher:
        "CREATE CONSTRAINT trainer_id IF NOT EXISTS FOR (t:Trainer) REQUIRE t.id IS UNIQUE",
    },
    {
      label: "memory_id",
      cypher:
        "CREATE CONSTRAINT memory_id IF NOT EXISTS FOR (m:Memory) REQUIRE m.id IS UNIQUE",
    },
    {
      label: "entity_name_type",
      cypher:
        "CREATE CONSTRAINT entity_name_type IF NOT EXISTS FOR (e:Entity) REQUIRE (e.name, e.type) IS UNIQUE",
    },
    {
      label: "trait_name_category",
      cypher:
        "CREATE CONSTRAINT trait_name_category IF NOT EXISTS FOR (t:Trait) REQUIRE (t.name, t.category) IS UNIQUE",
    },
  ];

  const applied: string[] = [];
  const res = await runWriteTx(async (tx) => {
    for (const s of statements) {
      await tx.run(s.cypher);
      applied.push(s.label);
    }
    return true;
  });

  return { ok: Boolean(res), skipped: false, applied };
}
