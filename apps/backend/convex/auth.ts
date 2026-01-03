import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: {
    email: v.string(),
    userName: v.optional(v.string()),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (existing) {
      throw new Error("User already exists");
    }
    const now = Date.now();
    const id = await ctx.db.insert("users", {
      email: args.email,
      userName: args.userName ?? "",
      passwordHash: args.passwordHash,
      createdAt: now,
    });
    return { id, email: args.email, userName: args.userName };
  },
});

export const findUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (!row) return null;
    return { id: row._id ?? null, ...row };
  },
});
