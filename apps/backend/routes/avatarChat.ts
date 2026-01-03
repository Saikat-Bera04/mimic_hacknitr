import { Express, Request, Response } from "express";
import { requireAuth } from "../lib/middleware";
import { GoogleGenerativeAI } from "@google/generative-ai";

const googleGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
    async (req: Request, res: Response) => {
      try {
        const { avatarId } = req.params;
        let { userId, message, sessionId, embedding } = req.body;

        // Prefer authenticated user id when available
        const authUser = (req as any).user;
        if (!userId && authUser?.sub) userId = authUser.sub;

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
                topK: 5,
              },
            }),
          }
        );

        const memoriesData :any= await memoriesRes.json();
        const relevantMemories: RelevantMemory[] = memoriesData.data || [];

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

        if (contextMessages.length > 0) {
          augmentedPrompt += "\n\n## Recent Context:\n";
          contextMessages.forEach((msg: string) => {
            augmentedPrompt += `${msg}\n`;
          });
        }

        // ===== STEP 5: Call Gemini with augmented prompt =====
        const model = googleGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result: any = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: message }],
            },
          ],
          systemInstruction: augmentedPrompt,
        });

        // Be defensive: the generative API can return different shapes.
        let assistantResponse = "";
        try {
          if (result?.response && typeof result.response.text === "function") {
            assistantResponse = result.response.text();
          } else if (result?.response && typeof result.response.text === "string") {
            assistantResponse = result.response.text;
          } else if (Array.isArray(result?.output) && result.output[0]?.content) {
            assistantResponse = result.output[0].content;
          } else if (typeof result === "string") {
            assistantResponse = result;
          } else if (result?.text) {
            assistantResponse = result.text;
          } else {
            assistantResponse = JSON.stringify(result);
          }
        } catch (e) {
          assistantResponse = "";
        }

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
          },
        });
      } catch (error) {
        console.error("Error in avatar chat:", error);
        return res.status(500).json({
          error: error instanceof Error ? error.message : "Internal server error",
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

        if (!avatarId || !text || !embedding) {
          return res.status(400).json({
            error: "avatarId, text, and embedding are required",
          });
        }

        // Determine trust weight based on source
        const trustWeightMap: Record<string, "owner" | "trainer" | "derived"> = {
          user_saved: "owner",
          trainer_added: "trainer",
          voice_input: "owner",
          conversation_extract: "derived",
        };

        const trustWeight = trustWeightMap[source] || "derived";

        const saveRes = await fetch(
          `${process.env.CONVEX_URL}/api/mutation`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path: "memories:saveMemory",
              args: {
                avatarId,
                text,
                embedding,
                category,
                trustWeight,
                source: source || "user_saved",
              },
            }),
          }
        );

        const data:any = await saveRes.json();

        if (!saveRes.ok) {
          return res.status(saveRes.status).json({
            error: data.error || "Failed to save memory",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Memory saved successfully",
          memoryId: data.data,
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
