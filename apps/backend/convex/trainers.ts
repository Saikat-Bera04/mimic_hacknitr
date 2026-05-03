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
      contextTexts: [],
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

/* =========================
   STORE AVATAR MASTER PROMPT (for avatar flow with string IDs)
   ========================= */
export const storeAvatarMasterPrompt = mutation({
  args: {
    avatarId: v.string(),           // Custom string ID from avatar flow
    avatarName: v.string(),
    avatarImageUrl: v.optional(v.string()),  // Selected avatar image URL
    ownerId: v.string(),
    ownerName: v.optional(v.string()),
    ownerEmail: v.optional(v.string()),
    masterPrompt: v.string(),
    trainerName: v.optional(v.string()),
    ownerResponses: v.optional(v.array(v.object({
      question: v.string(),
      answer: v.string(),
    }))),
    trainerResponses: v.optional(v.array(v.object({
      question: v.string(),
      answer: v.string(),
      note: v.optional(v.string()),
    }))),
  },
  async handler(ctx, args) {
    // Check if master prompt already exists for this avatar
    const existing = await ctx.db
      .query("avatarMasterPrompts")
      .withIndex("by_avatarId", (q) => q.eq("avatarId", args.avatarId))
      .first();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        masterPrompt: args.masterPrompt,
        trainerName: args.trainerName,
        trainerResponses: args.trainerResponses,
        updatedAt: Date.now(),
      });
      return { success: true, promptId: existing._id, updated: true };
    }

    // Create new record
    const promptId = await ctx.db.insert("avatarMasterPrompts", {
      avatarId: args.avatarId,
      avatarName: args.avatarName,
      avatarImageUrl: args.avatarImageUrl,
      ownerId: args.ownerId,
      ownerName: args.ownerName,
      ownerEmail: args.ownerEmail,
      masterPrompt: args.masterPrompt,
      trainerName: args.trainerName,
      ownerResponses: args.ownerResponses,
      trainerResponses: args.trainerResponses,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, promptId, updated: false };
  },
});

/* =========================
   GET AVATAR MASTER PROMPT
   ========================= */
export const getAvatarMasterPrompt = query({
  args: {
    avatarId: v.string(),
  },
  async handler(ctx, args) {
    const prompt = await ctx.db
      .query("avatarMasterPrompts")
      .withIndex("by_avatarId", (q) => q.eq("avatarId", args.avatarId))
      .first();

    return prompt;
  },
});

/* =========================
   GET ALL MASTER PROMPTS FOR OWNER
   ========================= */
export const getOwnerMasterPrompts = query({
  args: {
    ownerId: v.string(),
  },
  async handler(ctx, args) {
    const prompts = await ctx.db
      .query("avatarMasterPrompts")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", args.ownerId))
      .collect();

    return prompts;
  },
});

/* =========================
   SAVE TRAINING MEMORY (Text/Voice input)
   Uses string avatarId for avatar flow compatibility
   ========================= */
export const saveTrainingMemory = mutation({
  args: {
    avatarId: v.string(),
    text: v.string(),
    embedding: v.array(v.number()),
    category: v.optional(v.string()),
    trustWeight: v.union(
      v.literal("owner"),
      v.literal("trainer"),
      v.literal("derived")
    ),
    source: v.union(
      v.literal("user_saved"),
      v.literal("trainer_added"),
      v.literal("voice_input"),
      v.literal("conversation_extract")
    ),
    trainerId: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const memoryId = await ctx.db.insert("avatarTrainingMemories", {
      avatarId: args.avatarId,
      text: args.text,
      embedding: args.embedding,
      category: args.category,
      trustWeight: args.trustWeight,
      source: args.source,
      trainerId: args.trainerId,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, memoryId };
  },
});

/* =========================
   GET RELEVANT TRAINING MEMORIES (RAG)
   Uses vector similarity + trust weight + recency
   ========================= */
export const getRelevantTrainingMemories = query({
  args: {
    avatarId: v.string(),
    queryEmbedding: v.array(v.number()),
    topK: v.optional(v.number()),
  },
  async handler(ctx, args) {
    const topK = args.topK || 5;

    // Get all active memories for this avatar
    const memories = await ctx.db
      .query("avatarTrainingMemories")
      .withIndex("by_avatarId", (q) => q.eq("avatarId", args.avatarId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (memories.length === 0) {
      return [];
    }

    // Cosine similarity function
    const cosineSimilarity = (a: number[], b: number[]) => {
      if (!a || !b) return 0;
      const len = Math.min(a.length, b.length);
      if (len === 0) return 0;
      let dot = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < len; i++) {
        const ai = a[i] ?? 0;
        const bi = b[i] ?? 0;
        dot += ai * bi;
        normA += ai * ai;
        normB += bi * bi;
      }
      const denom = Math.sqrt(normA) * Math.sqrt(normB);
      return denom ? dot / denom : 0;
    };

    // Trust weight multipliers
    const trustWeights: Record<string, number> = { owner: 1.0, trainer: 0.7, derived: 0.5 };

    // Recency boost (memories from last 30 days get bonus)
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    // Score memories
    const scoredMemories = memories
      .map((memory) => {
        const similarityScore = cosineSimilarity(args.queryEmbedding, memory.embedding);
        const trustMultiplier = trustWeights[memory.trustWeight] || 0.5;
        const ageMs = now - memory.createdAt;
        const recencyBoost = ageMs < thirtyDaysMs ? 1.0 + (thirtyDaysMs - ageMs) / thirtyDaysMs * 0.5 : 1.0;
        const finalScore = similarityScore * trustMultiplier * recencyBoost;

        return { ...memory, score: finalScore };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scoredMemories;
  },
});

/* =========================
   GET ALL TRAINING MEMORIES FOR AVATAR
   ========================= */
export const getAvatarTrainingMemories = query({
  args: {
    avatarId: v.string(),
  },
  async handler(ctx, args) {
    return await ctx.db
      .query("avatarTrainingMemories")
      .withIndex("by_avatarId", (q) => q.eq("avatarId", args.avatarId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();
  },
});

/* =========================
   GET TRAINING MEMORY COUNT FOR AVATAR
   ========================= */
export const getTrainingMemoryCount = query({
  args: {
    avatarId: v.string(),
  },
  async handler(ctx, args) {
    const memories = await ctx.db
      .query("avatarTrainingMemories")
      .withIndex("by_avatarId", (q) => q.eq("avatarId", args.avatarId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return memories.length;
  },
});