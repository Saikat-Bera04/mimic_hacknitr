// convex/trainerAccess.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Validate a trainer access token and return avatar information if valid
 * Returns null if token is invalid or doesn't exist
 */
export const validateToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Look up the token
    const tokenRecord = await ctx.db
      .query("trainerAccess")
      .withIndex("by_token", (q) => q.eq("accessToken", args.token))
      .first();
    
    if (!tokenRecord) {
      return null; // Invalid token
    }
    
    // Get the avatar details
    const avatar = await ctx.db
      .query("avatarMasterPrompts")
      .withIndex("by_avatarId", (q) => q.eq("avatarId", tokenRecord.avatarId))
      .first();
    
    if (!avatar) {
      return null; // Avatar not found
    }
    
    // Return read-only avatar summary
    return {
      avatarId: avatar.avatarId,
      avatarName: avatar.avatarName,
      avatarImageUrl: avatar.avatarImageUrl,
      masterPrompt: avatar.masterPrompt,
      createdAt: avatar.createdAt,
    };
  },
});

/**
 * Get training memories contributed by the trainer for this avatar
 * Only returns memories for the avatar associated with the token
 */
export const getTrainerMemories = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // First validate the token
    const tokenRecord = await ctx.db
      .query("trainerAccess")
      .withIndex("by_token", (q) => q.eq("accessToken", args.token))
      .first();
    
    if (!tokenRecord) {
      return null; // Invalid token
    }
    
    // Get all training memories for this avatar
    const memories = await ctx.db
      .query("avatarTrainingMemories")
      .withIndex("by_avatarId", (q) => q.eq("avatarId", tokenRecord.avatarId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Return only the text content and creation date (no embeddings or sensitive data)
    return memories.map((memory) => ({
      text: memory.text,
      createdAt: memory.createdAt,
      source: memory.source,
    }));
  },
});

/**
 * Get memory count for the avatar (for display purposes)
 */
export const getMemoryCount = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("trainerAccess")
      .withIndex("by_token", (q) => q.eq("accessToken", args.token))
      .first();
    
    if (!tokenRecord) {
      return 0;
    }
    
    const memories = await ctx.db
      .query("avatarTrainingMemories")
      .withIndex("by_avatarId", (q) => q.eq("avatarId", tokenRecord.avatarId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return memories.length;
  },
});

export const storeTrainerAccess = mutation({
  args: {
    avatarId: v.string(),
    accessToken: v.string(), // pass token in from backend
  },
  handler: async (ctx, args) => {
    // Upsert by avatarId
    const existing = await ctx.db
      .query("trainerAccess")
      .withIndex("by_avatarId", (q) => q.eq("avatarId", args.avatarId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        createdAt: Date.now(),
      });
      return args.accessToken;
    }

    const _id = await ctx.db.insert("trainerAccess", {
      avatarId: args.avatarId,
      accessToken: args.accessToken,
      createdAt: Date.now(),
    });
    return args.accessToken;
  },
});
