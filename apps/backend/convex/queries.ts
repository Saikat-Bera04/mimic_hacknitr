import { query } from "./_generated/server";
import { v } from "convex/values";

// Get avatar by ID
export const getAvatarById = query({
  args: {
    avatarId: v.id("avatars"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.avatarId);
  },
});

// Get trainer by ID
export const getTrainerById = query({
  args: {
    trainerId: v.id("trainers"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.trainerId);
  },
});
