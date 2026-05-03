import { Express, Request, Response } from "express";
import { requireAuth } from "../lib/middleware";
import { GoogleGenAI } from "@google/genai";
import { clerkMiddleware } from "@clerk/express";
import {
  SHORT_GEMINI_RESPONSE_CONFIG,
  buildMemoryGroundedAvatarPrompt,
  generateContentWithFallback,
  getGeminiText,
} from "../lib/gemini";
import {
  expandMemoryContext,
  extractEntitiesAndTraits,
  linkAvatarMemory,
  linkMemoryEntities,
  linkMemoryTraits,
  linkTrainerMemory,
  renderGraphContextForPrompt,
  upsertAvatarNode,
  upsertMemoryNode,
  upsertTrainerNode,
} from "../lib/memory-graph";
const _geminiKey = process.env.GEMINI_API_KEY;
if (!_geminiKey) throw new Error("GEMINI_API_KEY environment variable is required");
const geminClient = new GoogleGenAI({ apiKey: _geminiKey });

interface RelevantMemory {
  _id: string;
  text: string;
  score: number;
  trustWeight: "owner" | "trainer" | "derived";
}

export const avatarChatRoute = (app: Express) => {
  // CORS preflight
  app.options("/api/avatar/:avatarId/chat", (req: Request, res: Response) => {
    res
      .status(204)
      .set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      })
      .send();
  });

  /* =========================
     MAIN CHAT ENDPOINT
     ========================= */
  app.post(
    "/api/avatar/:avatarId/chat",
    requireAuth,
    async (req:any, res: Response) => {
      try {
        const { avatarId } = req.params;
        let { userId, message, sessionId, embedding } = req.body;

        // Prefer authenticated user id when available
        const authUser = req.auth;
        if (!userId && authUser?.userId) userId = authUser.userId;

        // Validate inputs
        if (!avatarId || !userId || !message) {
          return res.status(400).json({
            error: "avatarId, userId, and message are required",
          });
        }

        if (!embedding || !Array.isArray(embedding)) {
          return res.status(400).json({
            error: "embedding array is required",
          });
        }

        // ===== STEP 1: Get avatar config & master prompt =====
        const avatarRes = await fetch(
          `${process.env.CONVEX_URL}/api/query`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path: "avatars:getAvatar",
              args: { avatarId },
            }),
          }
        );

        const avatarData :any= await avatarRes.json();
        if (!avatarData.data) {
          return res.status(404).json({ error: "Avatar not found" });
        }

        const avatar = avatarData.data;

        // ===== STEP 2: Retrieve relevant memories =====
        const memoriesRes = await fetch(
          `${process.env.CONVEX_URL}/api/query`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path: "memories:getRelevantMemories",
              args: {
                avatarId,
                queryEmbedding: embedding,
                topK: 3,
              },
            }),
          }
        );

        const memoriesData :any= await memoriesRes.json();
        const relevantMemories: RelevantMemory[] = (memoriesData.data || [])
          .filter((memory: RelevantMemory) => typeof memory.score !== "number" || memory.score >= 0.35)
          .slice(0, 3);

        // ===== STEP 3: Get recent conversation context =====
        let conversationId = sessionId;
        let contextMessages: any[] = [];

        if (sessionId) {
          const convRes = await fetch(
            `${process.env.CONVEX_URL}/api/query`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                path: "conversations:getRecentContext",
                args: { conversationId: sessionId, messageCount: 5 },
              }),
            }
          );

          const convData:any = await convRes.json();
          if (convData.data?.messages) {
            contextMessages = convData.data.messages.map(
              (msg: any) => `${msg.role}: ${msg.content}`
            );
          }
        }

        // ===== STEP 4: Build augmented prompt with memories =====
        let augmentedPrompt = avatar.masterPrompt;

        if (relevantMemories.length > 0) {
          augmentedPrompt += "\n\n## Relevant Information:\n";
          relevantMemories.forEach((memory: RelevantMemory) => {
            const trustLabel =
              memory.trustWeight === "owner"
                ? "⭐ (Owner)"
                : memory.trustWeight === "trainer"
                  ? "🎓 (Trainer)"
                  : "📝";
            augmentedPrompt += `- ${trustLabel} ${memory.text}\n`;
          });
        }

        // ===== STEP 4b: GraphRAG expansion over starting memory ids =====
        let graphContext: Awaited<ReturnType<typeof expandMemoryContext>> | null = null;
        try {
          const startingIds = relevantMemories.map((m) => m._id).filter(Boolean);
          if (startingIds.length > 0) {
            graphContext = await expandMemoryContext(startingIds, {
              includeContradictions: true,
            });
            const graphBlock = renderGraphContextForPrompt(graphContext);
            if (graphBlock) augmentedPrompt += graphBlock;
          }
        } catch (gErr) {
          console.warn("[neo4j] expandMemoryContext failed (non-critical):",
            gErr instanceof Error ? gErr.message : String(gErr));
        }

        if (contextMessages.length > 0) {
          augmentedPrompt += "\n\n## Recent Context:\n";
          contextMessages.forEach((msg: string) => {
            augmentedPrompt += `${msg}\n`;
          });
        }

        const recentMessages = contextMessages.map((msg: string) => {
          const [role, ...contentParts] = msg.split(":");
          return {
            role: role?.trim().toLowerCase() === "user" ? "user" : "assistant",
            content: contentParts.join(":").trim(),
          };
        });

        const prompt = buildMemoryGroundedAvatarPrompt({
          avatarName: avatar.avatarName || "Avatar",
          personality: avatar.masterPrompt,
          memories: relevantMemories,
          recentMessages,
          userMessage: message,
        });

        // ===== STEP 5: Call Gemini with grounded prompt =====
        const { result } = await generateContentWithFallback(geminClient, {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          config: SHORT_GEMINI_RESPONSE_CONFIG,
        });

        const assistantResponse = getGeminiText(result) || JSON.stringify(result);

        // ===== STEP 6: Ensure conversation exists and store response =====
        // If client passed 'new' or no sessionId, create a conversation record.
        if (!conversationId || conversationId === "new") {
          const genSessionId = sessionId && sessionId !== "new" ? sessionId : `session_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
          try {
            const createConvRes = await fetch(`${process.env.CONVEX_URL}/api/mutation`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                path: "conversations:createConversation",
                args: { avatarId, userId, sessionId: genSessionId },
              }),
            });
            const createConvData: any = await createConvRes.json();
            if (createConvRes.ok && createConvData.data) {
              conversationId = createConvData.data;
            } else {
              conversationId = null;
            }
          } catch (e) {
            conversationId = null;
          }
        }

        let responseId = null;
        if (conversationId) {
          // Store user message
          try {
            await fetch(
              `${process.env.CONVEX_URL}/api/mutation`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  path: "conversations:addMessage",
                  args: {
                    conversationId,
                    role: "user",
                    content: message,
                  },
                }),
              }
            );
          } catch (e) {
            console.error("Failed to store user message", e);
          }

          // Store assistant reply
          try {
            await fetch(
              `${process.env.CONVEX_URL}/api/mutation`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  path: "conversations:addMessage",
                  args: {
                    conversationId,
                    role: "assistant",
                    content: assistantResponse,
                  },
                }),
              }
            );
          } catch (e) {
            console.error("Failed to store assistant message", e);
          }

          // Store in responses table
          const storeRes = await fetch(
            `${process.env.CONVEX_URL}/api/mutation`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                path: "conversations:storeResponse",
                args: {
                  avatarId,
                  conversationId,
                  userMessage: message,
                  assistantResponse,
                  memoryIdsUsed: relevantMemories.map((m: RelevantMemory) => m._id),
                  relevanceScores: relevantMemories.map(
                    (m: RelevantMemory) => ({
                      memoryId: m._id,
                      score: m.score,
                    })
                  ),
                },
              }),
            }
          );

          const storeData:any = await storeRes.json();
          responseId = storeData.data;
        }

        // ===== STEP 7: Return response =====
        return res.status(200).json({
          success: true,
          response: assistantResponse,
          metadata: {
            avatarName: avatar.avatarName,
            memoryCount: relevantMemories.length,
            topMemories: relevantMemories
              .slice(0, 3)
              .map((m: RelevantMemory) => ({
                text: m.text,
                trustWeight: m.trustWeight,
                relevanceScore: m.score.toFixed(2),
              })),
            responseId,
            // Graph explainability (optional — empty when Neo4j is disabled)
            graphContextUsed: graphContext && graphContext.enabled
              ? {
                  relatedMemoryCount: graphContext.relatedMemories.length,
                  entities: graphContext.entities.slice(0, 8),
                  traits: graphContext.traits.slice(0, 8),
                }
              : undefined,
            graphMemoryIdsUsed: graphContext && graphContext.enabled
              ? graphContext.relatedMemories.map((m) => m.id)
              : undefined,
            contradictions: graphContext && graphContext.enabled
              ? graphContext.contradictions
              : undefined,
          },
        });
      } catch (error) {
        console.error("Error in avatar chat:", error);
        return res.status((error as any)?.status || 500).json({
          error: (error as any)?.status === 429
            ? "Gemini quota exhausted"
            : error instanceof Error ? error.message : "Internal server error",
          retryAfterSeconds: (error as any)?.retryAfterSeconds,
        });
      }
    }
  );

  /* =========================
     SAVE MEMORY ENDPOINT
     ========================= */
  app.options("/api/avatar/:avatarId/memory", (req: Request, res: Response) => {
    res
      .status(204)
      .set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      })
      .send();
  });

  app.post(
    "/api/avatar/:avatarId/memory",
    async (req: Request, res: Response) => {
      try {
        const { avatarId } = req.params;
        const { userId, text, embedding, category, source } = req.body;

        // Normalize params (Express may return string | string[])
        const aid = Array.isArray(avatarId) ? avatarId[0] : avatarId;
        const uid = userId ? (Array.isArray(userId) ? userId[0] : userId) : null;

        if (!aid || !uid || !text || !embedding) {
          return res.status(400).json({
            error: "avatarId, userId, text, and embedding are required",
          });
        }

        // Determine trust weight based on source
        const trustWeightMap: Record<string, "owner" | "trainer" | "derived"> = {
          user_saved: "owner",
          trainer_added: "trainer",
          voice_input: "owner",
          conversation_extract: "derived",
        };

        const trustWt = trustWeightMap[source] || "derived";

        // Use the new training memories table with string avatarId
        const saveRes = await globalThis.convex.mutation("trainers:saveTrainingMemory", {
          avatarId: aid,
          text,
          embedding,
          category,
          trustWeight: trustWt,
          source: source || "user_saved",
          trainerId: uid,
        });

        if (!saveRes.success) {
          return res.status(500).json({
            error: "Failed to save memory",
          });
        }

        // ===== Mirror memory into Neo4j graph (best-effort, never blocks) =====
        try {
          const memoryId = String(saveRes.memoryId);
          await upsertAvatarNode({ id: aid, name: aid });
          await upsertMemoryNode({
            id: memoryId,
            avatarId: aid,
            text,
            category: category ?? null,
            trustWeight: trustWt,
            source: (source as any) || "user_saved",
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          await linkAvatarMemory(aid, memoryId);
          if (uid) {
            await upsertTrainerNode({ id: String(uid) });
            await linkTrainerMemory(String(uid), memoryId, aid);
          }
          const { entities, traits } = extractEntitiesAndTraits(text);
          if (entities.length) await linkMemoryEntities(memoryId, entities);
          if (traits.length) await linkMemoryTraits(memoryId, traits);
        } catch (gErr) {
          console.warn("[neo4j] mirror memory failed (non-critical):",
            gErr instanceof Error ? gErr.message : String(gErr));
        }

        // Generate access token for trainer (if they don't already have one)
        let accessToken: string | null = null;
        try {
          accessToken = await globalThis.convex.mutation("trainerAccess:generateAccessToken", {
            avatarId: aid,
          });
        } catch (error) {
          console.error("Error generating access token:", error);
        }

        return res.status(200).json({
          success: true,
          message: "Memory saved successfully",
          memoryId: saveRes.memoryId,
          accessToken,
        });
      } catch (error) {
        console.error("Error saving memory:", error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : "Internal server error",
        });
      }
    }
  );
};
