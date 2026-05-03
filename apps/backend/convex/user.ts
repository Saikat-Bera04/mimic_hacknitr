import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or update user (now uses clerkId as identifier)
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    userName: v.string(),
    profilePhoto: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists by clerkId
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        userName: args.userName,
        email: args.email,
        profilePhoto: args.profilePhoto || existingUser.profilePhoto,
        updatedAt: Date.now(),
      });

      // Return updated user
      const updatedUser = await ctx.db.get(existingUser._id);
      return updatedUser;
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        userName: args.userName,
        profilePhoto: args.profilePhoto,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Return created user
      const newUser = await ctx.db.get(userId);
      return newUser;
    }
  },
});

// Get user by clerkId
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Get user by email
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Get user by ID
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    userName: v.optional(v.string()),
    profilePhoto: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.userName) {
      updateData.userName = args.userName;
    }

    if (args.profilePhoto) {
      updateData.profilePhoto = args.profilePhoto;
    }

    await ctx.db.patch(args.userId, updateData);

    const updatedUser = await ctx.db.get(args.userId);
    return updatedUser;
  },
});

// Delete user
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.delete(args.userId);

    return { success: true, message: "User deleted" };
  },
});
