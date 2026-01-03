import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/* =========================
   CREATE NEW AVATAR
   ========================= */
export const createAvatar = mutation({
  args: {
    ownerId: v.id("users"),
    avatarName: v.string(),
    masterPrompt: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("avatars", {
      ownerId: args.ownerId,
      avatarName: args.avatarName,
      masterPrompt: args.masterPrompt,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/* =========================
   UPDATE AVATAR MASTER PROMPT
   ========================= */
export const updateMasterPrompt = mutation({
  args: {
    avatarId: v.id("avatars"),
    masterPrompt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.avatarId, {
      masterPrompt: args.masterPrompt,
      updatedAt: Date.now(),
    });
  },
});

/* =========================
   GET AVATAR BY ID
   ========================= */
export const getAvatar = query({
  args: {
    avatarId: v.id("avatars"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.avatarId);
  },
});

/* =========================
   GET ALL AVATARS FOR OWNER
   ========================= */
export const getUserAvatars = query({
  args: {
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("avatars")
      .filter((q) => q.eq(q.field("ownerId"), args.ownerId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

/* =========================
   DEACTIVATE AVATAR
   ========================= */
export const deactivateAvatar = mutation({
  args: {
    avatarId: v.id("avatars"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.avatarId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});
