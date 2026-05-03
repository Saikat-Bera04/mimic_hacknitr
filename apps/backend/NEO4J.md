# Neo4j Memory Graph

Neo4j is used as an optional relationship-graph layer alongside the existing Convex/MongoDB memory
store. It enables GraphRAG-style context expansion, explainability, and contradiction
detection for avatar memories.

## What is stored

**Nodes**

| Label   | Key properties                                       |
|---------|---------------------------------------------------|
| `User`    | `id`, `clerkId`, `email`, `userName`              |
| `Avatar`  | `id`, `name`, `ownerId`                           |
| `Trainer` | `id`, `userId`, `name`                           |
| `Memory`   | `id`, `avatarId`, `text`, `category`, `trustWeight`, `source`, `isActive`, `createdAt`, `updatedAt` |
| `Entity`   | `name`, `type` (e.g. `person`, `place`)           |
| `Trait`    | `name`, `category` (e.g. `personality`, `communication`) |

**Relationships**

```
(User)-[:OWNS]->(Avatar)
(Avatar)-[:HAS_MEMORY]->(Memory)
(Trainer)-[:TRAINED]->(Avatar)
(Trainer)-[:ADDED]->(Memory)
(Memory)-[:MENTIONS]->(Entity)
(Memory)-[:EXPRESSES]->(Trait)
(Memory)-[:RELATED_TO {score, reason}]->(Memory)
(Memory)-[:CONTRADICTS {reason, createdAt}]->(Memory)
```

## Required environment variables

```env
NEO4J_URI=
NEO4J_USERNAME=
NEO4J_PASSWORD=
NEO4J_DATABASE=neo4j    # optional; defaults to "neo4j"
```

## Creating a free Neo4j Aura instance

1. Go to [neo4j.com/product/aura-database](https://neo4j.com/product/aura-database/)
2. Click **Start Free** and create an AuraDB instance (_free tier available_)
3. In the Aura console, copy the connection URI (`bolt://...`)
4. Use the Aura username (`neo4j`) and password you set on creation
5. Add the values to `.env`

## Running the constraint initialization

After setting the Neo4j env vars, run:

```sh
cd apps/backend
npm run neo4j:init
```

This applies unique constraints on all node primary keys. Safe to re-run — uses
`IF NOT EXISTS`.

To verify connectivity:

```sh
npm run neo4j:smoke
```

## When Neo4j env vars are missing

The app starts and runs normally. Neo4j is **gracefully disabled**:

- No connections are attempted
- `GET /health/neo4j` returns `enabled: false`
- Memory saves continue to Convex unchanged
- GraphRAG expansion returns empty results (no error thrown)
- A single warning is logged at startup: `[neo4j] Missing NEO4J_URI / NEO4J_USERNAME / NEO4J_PASSWORD — graph layer disabled.`

To explicitly disable even when credentials are present, set:

```env
NEO4J_GRAPH_ENABLED=false
```

## How it integrates

### On memory save (Express, `/api/avatar/:avatarId/memory`)

After Convex writes the memory:

1. `upsertAvatarNode` + `upsertMemoryNode` — write the Memory and Avatar nodes
2. `linkAvatarMemory` — connect Avatar → Memory via `HAS_MEMORY`
3. If `trainerId` is present: `upsertTrainerNode` + `linkTrainerMemory`
4. `extractEntitiesAndTraits` — lightweight heuristic (no LLM) pulls named entities and trait keywords from the memory text
5. `linkMemoryEntities` + `linkMemoryTraits` — connect the Memory to Entity and Trait nodes

### On chat (GraphRAG)

When `/api/avatar/:avatarId/chat` or `/api/avatar-flow/chat/:avatarId` retrieves memories:

1. Vector retrieval returns top-K memories as before
2. `expandMemoryContext(memoryIds)` queries Neo4j for:
   - Related memories (via `RELATED_TO` up to `NEO4J_GRAPH_MAX_DEPTH`)
   - Entities mentioned by the starting memories
   - Traits expressed by the starting memories
   - Any `CONTRADICTS` relationships
3. `renderGraphContextForPrompt` formats a compact block injected into the LLM prompt under `## Relevant memory graph:`
4. Graph metadata is included in the API response (`graphContextUsed`, `graphMemoryIdsUsed`, `contradictions`)

### On response storage

The Convex `responses` table stores `memoryIdsUsed` and `relevanceScores` as before.
Graph explanation fields are added to the API response only (not the Convex schema) so
existing Convex queries remain unchanged.

## Tuning

```env
NEO4J_GRAPH_MAX_DEPTH=2      # graph traversal depth (1–4)
NEO4J_GRAPH_CONTEXT_LIMIT=12   # max nodes returned per expansion
```

## Health check

```sh
curl http://localhost:8000/health/neo4j
# { "enabled": true, "connected": true, "database": "neo4j" }
```

No credentials are exposed in the response.