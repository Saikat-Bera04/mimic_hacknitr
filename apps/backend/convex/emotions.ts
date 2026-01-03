import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const storeEmotionResponse = mutation({
  args: {
    avatarId: v.id("avatars"),
    conversationId: v.id("conversations"),
    userMessage: v.string(),
    assistantResponse: v.string(),
    memoryIdsUsed: v.optional(v.array(v.id("memories"))),
    emotion: v.optional(v.string()),
    prompt: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { avatarId, conversationId, userMessage, assistantResponse, memoryIdsUsed, emotion, prompt }
  ) => {
    const createdAt = Date.now();
    await ctx.db.insert("responses", {
      avatarId,
      conversationId,
      userMessage,
      assistantResponse,
      memoryIdsUsed: memoryIdsUsed || [],
      relevanceScores: undefined,
      emotion,
      createdAt,
    });
  },
});
