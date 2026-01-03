import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/* =========================
   CREATE NEW CONVERSATION
   ========================= */
export const createConversation = mutation({
  args: {
    avatarId: v.id("avatars"),
    userId: v.id("users"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("conversations", {
      avatarId: args.avatarId,
      userId: args.userId,
      messages: [],
      sessionId: args.sessionId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/* =========================
   ADD MESSAGE TO CONVERSATION
   ========================= */
export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const updatedMessages = [
      ...conversation.messages,
      {
        role: args.role,
        content: args.content,
        timestamp: Date.now(),
      },
    ];

    await ctx.db.patch(args.conversationId, {
      messages: updatedMessages,
      updatedAt: Date.now(),
    });
  },
});

/* =========================
   STORE RESPONSE WITH MEMORY TRACKING
   ========================= */
export const storeResponse = mutation({
  args: {
    avatarId: v.id("avatars"),
    conversationId: v.id("conversations"),
    userMessage: v.string(),
    assistantResponse: v.string(),
    memoryIdsUsed: v.array(v.id("memories")),
    relevanceScores: v.optional(
      v.array(
        v.object({
          memoryId: v.id("memories"),
          score: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("responses", {
      avatarId: args.avatarId,
      conversationId: args.conversationId,
      userMessage: args.userMessage,
      assistantResponse: args.assistantResponse,
      memoryIdsUsed: args.memoryIdsUsed,
      relevanceScores: args.relevanceScores,
      createdAt: Date.now(),
    });
  },
});

/* =========================
   GET CONVERSATION HISTORY
   ========================= */
export const getConversation = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

/* =========================
   GET RECENT MESSAGES (for context window)
   ========================= */
export const getRecentContext = query({
  args: {
    conversationId: v.id("conversations"),
    messageCount: v.optional(v.number()), // Default: 10
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    const count = args.messageCount || 10;
    const recentMessages = conversation.messages.slice(-count);

    return {
      ...conversation,
      messages: recentMessages,
    };
  },
});

/* =========================
   END CONVERSATION (Soft delete)
   ========================= */
export const endConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

/* =========================
   GET AVATAR RESPONSE HISTORY
   ========================= */
export const getAvatarResponses = query({
  args: {
    avatarId: v.id("avatars"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("responses")
      .filter((q) => q.eq(q.field("avatarId"), args.avatarId))
      .order("desc")
      .take(limit);
  },
});
