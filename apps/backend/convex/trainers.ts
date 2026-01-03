import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/* =========================
   INVITE TRAINER
   ========================= */
export const inviteTrainer = mutation({
  args: {
    avatarId: v.id("avatars"),
    invitedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if there's already an active trainer for this avatar
    const avatar = await ctx.db.get(args.avatarId);
    if (avatar?.trainerId && avatar.trainerId !== args.invitedUserId) {
      throw new Error("Avatar already has a trainer assigned");
    }

    // Check if there's an existing pending or accepted invitation
    const existingInvite = await ctx.db
      .query("trainerInvitations")
      .filter((q) => q.eq(q.field("avatarId"), args.avatarId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "accepted")
        )
      )
      .first();

    if (existingInvite) {
      throw new Error("An active invitation already exists for this avatar");
    }

    return await ctx.db.insert("trainerInvitations", {
      avatarId: args.avatarId,
      invitedUserId: args.invitedUserId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

/* =========================
   ACCEPT TRAINER INVITATION
   ========================= */
export const acceptTrainerInvitation = mutation({
  args: {
    invitationId: v.id("trainerInvitations"),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");
    if (invitation.status !== "pending") {
      throw new Error("Invitation is not pending");
    }

    // Update invitation
    await ctx.db.patch(args.invitationId, {
      status: "accepted",
      respondedAt: Date.now(),
    });

    // Update avatar with trainer
    await ctx.db.patch(invitation.avatarId, {
      trainerId: invitation.invitedUserId,
      trainerApprovedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return invitation.invitedUserId;
  },
});

/* =========================
   REJECT TRAINER INVITATION
   ========================= */
export const rejectTrainerInvitation = mutation({
  args: {
    invitationId: v.id("trainerInvitations"),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");

    await ctx.db.patch(args.invitationId, {
      status: "rejected",
      respondedAt: Date.now(),
    });
  },
});

/* =========================
   REMOVE TRAINER FROM AVATAR
   ========================= */
export const removeTrainer = mutation({
  args: {
    avatarId: v.id("avatars"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.avatarId, {
      trainerId: undefined,
      trainerApprovedAt: undefined,
      updatedAt: Date.now(),
    });

    // Also revoke any pending invitations
    const invitations = await ctx.db
      .query("trainerInvitations")
      .filter((q) => q.eq(q.field("avatarId"), args.avatarId))
      .collect();

    for (const inv of invitations) {
      if (inv.status !== "rejected" && inv.status !== "accepted") {
        await ctx.db.patch(inv._id, {
          status: "revoked",
          respondedAt: Date.now(),
        });
      }
    }
  },
});

/* =========================
   GET TRAINER INVITATIONS FOR USER
   ========================= */
export const getTrainerInvitations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trainerInvitations")
      .filter((q) => q.eq(q.field("invitedUserId"), args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});

/* =========================
   GET AVATAR TRAINER INFO
   ========================= */
export const getAvatarTrainer = query({
  args: {
    avatarId: v.id("avatars"),
  },
  handler: async (ctx, args) => {
    const avatar = await ctx.db.get(args.avatarId);
    if (!avatar || !avatar.trainerId) return null;

    const trainer = await ctx.db.get(avatar.trainerId);
    return {
      trainerId: avatar.trainerId,
      trainerName: trainer?.userName,
      approvedAt: avatar.trainerApprovedAt,
    };
  },
});
/* =========================
   CREATE TRAINER PROFILE
   ========================= */
export const createTrainer = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    systemPrompt: v.string(),
    specialization: v.optional(v.string()),
  },
  async handler(ctx, args) {
    // Check if trainer already exists for this user
    const existing = await ctx.db
      .query("trainers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      return { error: "Trainer already exists for this user" };
    }

    const trainerId = await ctx.db.insert("trainers", {
      userId: args.userId,
      name: args.name,
      specialization: args.specialization,
      systemPrompt: args.systemPrompt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Also create initial trainer memory
    await ctx.db.insert("trainerMemories", {
      trainerId,
      systemPrompt: args.systemPrompt,
      contexts: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, trainerId };
  },
});

/* =========================
   GET TRAINER
   ========================= */
export const getTrainer = query({
  args: {
    userId: v.id("users"),
  },
  async handler(ctx, args) {
    const trainer = await ctx.db
      .query("trainers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!trainer) {
      return null;
    }

    return {
      _id: trainer._id,
      name: trainer.name,
      systemPrompt: trainer.systemPrompt,
      specialization: trainer.specialization,
      createdAt: trainer.createdAt,
    };
  },
});

/* =========================
   UPDATE TRAINER SYSTEM PROMPT
   ========================= */
export const updateTrainerSystemPrompt = mutation({
  args: {
    trainerId: v.id("trainers"),
    systemPrompt: v.string(),
  },
  async handler(ctx, args) {
    const trainer = await ctx.db.get(args.trainerId);

    if (!trainer) {
      return { error: "Trainer not found" };
    }

    await ctx.db.patch(args.trainerId, {
      systemPrompt: args.systemPrompt,
      updatedAt: Date.now(),
    });

    // Also update the trainer memory
    const memory = await ctx.db
      .query("trainerMemories")
      .withIndex("by_trainerId", (q) => q.eq("trainerId", args.trainerId))
      .first();

    if (memory) {
      await ctx.db.patch(memory._id, {
        systemPrompt: args.systemPrompt,
        updatedAt: Date.now(),
      });
    }

    return { success: true, message: "Trainer system prompt updated" };
  },
});