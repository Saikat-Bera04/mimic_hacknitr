import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or update user from Clerk (called after Clerk signup/signin)
export const createOrUpdateFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    userName: v.optional(v.string()),
    profilePhoto: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists by clerkId
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        email: args.email ?? existing.email,
        userName: args.userName ?? existing.userName,
        profilePhoto: args.profilePhoto ?? existing.profilePhoto,
        updatedAt: now,
      });
      return { 
        id: existing._id, 
        clerkId: args.clerkId,
        email: args.email ?? existing.email, 
        userName: args.userName ?? existing.userName,
        profilePhoto: args.profilePhoto ?? existing.profilePhoto,
        isNew: false 
      };
    }

    // Create new user
    const id = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      userName: args.userName ?? "",
      profilePhoto: args.profilePhoto,
      createdAt: now,
    });

    return { 
      id, 
      clerkId: args.clerkId,
      email: args.email, 
      userName: args.userName,
      profilePhoto: args.profilePhoto,
      isNew: true 
    };
  },
});

// Find user by Clerk ID
export const findByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user) return null;
    return { 
      id: user._id, 
      clerkId: user.clerkId,
      email: user.email, 
      userName: user.userName,
      profilePhoto: user.profilePhoto,
      createdAt: user.createdAt,
    };
  },
});

// Find user by email (kept for compatibility)
export const findUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!row) return null;
    return { id: row._id, ...row };
  },
});
