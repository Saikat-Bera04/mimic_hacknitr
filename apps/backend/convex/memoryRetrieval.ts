import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get relevant memories for an avatar using cosine similarity
 * Returns top-K memories based on similarity score
 */
export const getRelevantMemories = query({
  args: {
    avatarId: v.id("avatars"),
    questionEmbedding: v.array(v.number()),
    topK: v.optional(v.number()),
    confidenceThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const topK = args.topK || 5;
    const threshold = args.confidenceThreshold || 0.3;

    // Fetch all memories for this avatar
    const memories = await ctx.db
      .query("memories")
      .withIndex("by_avatar", (q) => q.eq("avatarId", args.avatarId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (memories.length === 0) {
      return { relevantMemories: [], totalMemories: 0, relevantCount: 0 };
    }

    // Calculate cosine similarity for each memory
    const memoriesWithScore = memories.map((memory) => ({
      ...memory,
      similarity: cosineSimilarity(args.questionEmbedding, memory.embedding),
    }));

    // Filter by confidence threshold
    const filtered = memoriesWithScore.filter((m) => m.similarity >= threshold);

    // Sort by similarity (descending) and get top-K
    const relevant = filtered.sort((a, b) => b.similarity - a.similarity).slice(0, topK);

    return {
      relevantMemories: relevant,
      totalMemories: memories.length,
      relevantCount: relevant.length,
    };
  },
});

/**
 * Helper function: Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Get relevant trainer memories using cosine similarity
 * Used for trainer context in avatar conversations
 */
export const getRelevantTrainerMemories = query({
  args: {
    trainerId: v.id("trainers"),
    questionEmbedding: v.array(v.number()),
    topK: v.optional(v.number()),
    confidenceThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const topK = args.topK || 5;
    const threshold = args.confidenceThreshold || 0.3;

    // Fetch trainer memory
    const trainerMemory = await ctx.db
      .query("trainerMemories")
      .filter((q) => q.eq(q.field("trainerId"), args.trainerId))
      .first();

    if (!trainerMemory || !trainerMemory.contexts || trainerMemory.contexts.length === 0) {
      return {
        relevantMemories: [],
        contextTexts: [],
        totalMemories: 0,
        relevantCount: 0,
      };
    }

    // Calculate similarity for each context embedding
    const contextsWithScore = trainerMemory.contexts.map((context, index) => ({
      ...context,
      index,
      similarity: cosineSimilarity(args.questionEmbedding, context.embedding),
    }));

    // Filter by threshold and get top-K
    const relevant = contextsWithScore
      .filter((c) => c.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    // Get corresponding text for relevant embeddings
    const relevantTexts = relevant.map((ctx) => {
      const text = trainerMemory.contextTexts?.find((t) => t.contextIndex === ctx.index);
      return {
        embedding: ctx.embedding,
        text: text?.text || "",
        similarity: ctx.similarity,
        createdAt: ctx.createdAt,
      };
    });

    return {
      relevantMemories: relevant,
      contextTexts: relevantTexts,
      totalMemories: trainerMemory.contexts.length,
      relevantCount: relevant.length,
    };
  },
});
