import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


export const saveMemory = mutation({
  args: {
    avatarId: v.id("avatars"),
    text: v.string(),
    embedding: v.array(v.number()), 
    category: v.optional(v.string()),
    trustWeight: v.union(
      v.literal("owner"),
      v.literal("trainer"),
      v.literal("derived")
    ),
    source: v.union(
      v.literal("user_saved"),
      v.literal("trainer_added"),
      v.literal("voice_input"),
      v.literal("conversation_extract")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("memories", {
      avatarId: args.avatarId,
      text: args.text,
      embedding: args.embedding,
      category: args.category,
      trustWeight: args.trustWeight,
      source: args.source,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/* =========================
   RETRIEVE RELEVANT MEMORIES
   Uses vector similarity + trust weight + recency
   ========================= */
export const getRelevantMemories = query({
  args: {
    avatarId: v.id("avatars"),
    queryEmbedding: v.array(v.number()),
    topK: v.optional(v.number()), // Default: 5
  },
  handler: async (ctx, args) => {
    const topK = args.topK || 5;

    // Get all active memories for this avatar
    const memories = await ctx.db
      .query("memories")
      .filter((q) => q.eq(q.field("avatarId"), args.avatarId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (memories.length === 0) {
      return [];
    }

    
    const cosineSimilarity = (a: number[], b: number[]) => {
      if (!a || !b) return 0;
      const len = Math.min(a.length, b.length);
      if (len === 0) return 0;
      let dot = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < len; i++) {
        const ai = a[i] ?? 0;
        const bi = b[i] ?? 0;
        dot += ai * bi;
        normA += ai * ai;
        normB += bi * bi;
      }
      const denom = Math.sqrt(normA) * Math.sqrt(normB);
      return denom ? dot / denom : 0;
    };

    // Trust weight multipliers
    const trustWeights = { owner: 1.0, trainer: 0.7, derived: 0.5 };

    // Recency boost (memories from last 30 days get bonus)
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    // Score memories
    const scoredMemories = memories
      .map((memory) => {
        // Similarity score (0-1)
        const similarityScore = cosineSimilarity(
          args.queryEmbedding,
          memory.embedding
        );

        // Trust weight multiplier
        const trustMultiplier = trustWeights[memory.trustWeight] || 0.5;

        // Recency boost
        const ageMs = now - memory.createdAt;
        const recencyBoost =
          ageMs < thirtyDaysMs ? 1.0 + (thirtyDaysMs - ageMs) / thirtyDaysMs * 0.5 : 1.0;

        // Final score: similarity * trust * recency
        const finalScore = similarityScore * trustMultiplier * recencyBoost;

        return {
          ...memory,
          score: finalScore,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scoredMemories;
  },
});

/* =========================
   UPDATE MEMORY
   ========================= */
export const updateMemory = mutation({
  args: {
    memoryId: v.id("memories"),
    text: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.memoryId, {
      ...(args.text && { text: args.text }),
      ...(args.category && { category: args.category }),
      updatedAt: Date.now(),
    });
  },
});

/* =========================
   ARCHIVE MEMORY (Soft delete)
   ========================= */
export const archiveMemory = mutation({
  args: {
    memoryId: v.id("memories"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.memoryId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

/* =========================
   GET ALL MEMORIES FOR AVATAR
   ========================= */
export const getAvatarMemories = query({
  args: {
    avatarId: v.id("avatars"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memories")
      .filter((q) => q.eq(q.field("avatarId"), args.avatarId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});
