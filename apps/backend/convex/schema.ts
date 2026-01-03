// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /* =========================
     USERS (Avatar Owners)
     ========================= */
  users: defineTable({
    userName: v.string(),
    email: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  /* =========================
     AVATAR CONFIG (1:1 AI Avatar per User)
     ========================= */
  avatars: defineTable({
    ownerId: v.id("users"),                    // Avatar owner
    avatarName: v.string(),                    // Avatar's name
    masterPrompt: v.string(),                  // Core personality/behavior
    trainerId: v.optional(v.id("users")),     // Optional trainer (1 person max)
    trainerApprovedAt: v.optional(v.number()), // When trainer was approved
    isActive: v.boolean(),                     // Avatar is active
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_trainer", ["trainerId"]),

  /* =========================
     MEMORIES (Explicit long-term learning)
     ========================= */
  memories: defineTable({
    avatarId: v.id("avatars"),                 // Which avatar owns this memory
    text: v.string(),                          // Memory content (text or transcribed voice)
    embedding: v.array(v.number()),            // Vector embedding for similarity search
    category: v.optional(v.string()),          // e.g., "personality", "preference", "fact"
    trustWeight: v.union(
      v.literal("owner"),                      // 1.0 - highest trust
      v.literal("trainer"),                    // 0.7 - trainer input
      v.literal("derived")                     // 0.5 - system-generated
    ),
    source: v.union(
      v.literal("user_saved"),                 // Explicitly saved by owner
      v.literal("trainer_added"),              // Added by trainer
      v.literal("voice_input"),                // From voice transcription
      v.literal("conversation_extract")       // Auto-extracted from chat
    ),
    isActive: v.boolean(),                     // Can be archived
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_avatar", ["avatarId"])
    .index("by_trust", ["trustWeight"])
    .index("by_created", ["createdAt"]),

  /* =========================
     CONVERSATIONS (Short-term context only)
     ========================= */
  conversations: defineTable({
    avatarId: v.id("avatars"),                 // Which avatar
    userId: v.id("users"),                     // User chatting (owner or someone else)
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        timestamp: v.number(),
      })
    ),
    sessionId: v.string(),                     // Group related messages
    isActive: v.boolean(),                     // Can end/archive conversations
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_avatar", ["avatarId"])
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),

  /* =========================
     AVATAR RESPONSES (History & Analytics)
     ========================= */
  responses: defineTable({
    avatarId: v.id("avatars"),
    conversationId: v.id("conversations"),
    userMessage: v.string(),
    assistantResponse: v.string(),
    memoryIdsUsed: v.array(v.id("memories")), // Which memories were injected
    relevanceScores: v.optional(
      v.array(
        v.object({
          memoryId: v.id("memories"),
          score: v.number(),                   // 0-1: similarity + trust + recency
        })
      )
    ),
    emotion: v.optional(v.string()),           // Optional emotion classification
    createdAt: v.number(),
  })
    .index("by_avatar", ["avatarId"])
    .index("by_conversation", ["conversationId"]),

  /* =========================
     TRAINER INVITATIONS (Privacy & Control)
     ========================= */
  trainerInvitations: defineTable({
    avatarId: v.id("avatars"),
    invitedUserId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("revoked")
    ),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_avatar", ["avatarId"])
    .index("by_invited_user", ["invitedUserId"]),

  /* =========================
     TRAINERS (Trainer Profile)
     ========================= */
  trainers: defineTable({
    userId: v.id("users"),
    name: v.string(),
    specialization: v.optional(v.string()),
    systemPrompt: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"]),

  /* =========================
     TRAINER MEMORIES (Trainer Context)
     ========================= */
  trainerMemories: defineTable({
    trainerId: v.id("trainers"),
    systemPrompt: v.string(),
    contexts: v.array(
      v.object({
        text: v.string(),
        embedding: v.array(v.number()),
        createdAt: v.number(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_trainerId", ["trainerId"]),
});