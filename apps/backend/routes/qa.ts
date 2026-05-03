import { Express, Request, Response } from "express";
import { ConvexHttpClient } from "convex/browser";
import { GoogleGenAI } from "@google/genai";
import {
  GEMINI_EMBEDDING_MODEL,
  SHORT_GEMINI_RESPONSE_CONFIG,
  buildMemoryGroundedAvatarPrompt,
  generateContentWithFallback,
  getGeminiText,
} from "../lib/gemini";
import {
  expandMemoryContext,
  renderGraphContextForPrompt,
} from "../lib/memory-graph";

declare global {
  var convex: any;
}

export const qaRoute = (app: Express) => {
 
  app.post("/api/avatar/:avatarId/ask", async (req: Request, res: Response) => {
    try {
      const { avatarId } = req.params;
      const {
        question,
        topK = 3,
        confidenceThreshold = 0.45,
      } = req.body;

      if (!question) {
        return res.status(400).json({ error: "question is required" });
      }

      // Step 1: Generate embedding for the question
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }

      const ai = new GoogleGenAI({ apiKey });
      const embeddingResponse = await ai.models.embedContent({
        model: GEMINI_EMBEDDING_MODEL,
        contents: question,
      });

      if (!embeddingResponse?.embeddings?.[0]?.values) {
        throw new Error("Failed to generate embedding for question");
      }

      const questionEmbedding = embeddingResponse.embeddings[0].values;

      // Step 2 & 3: Fetch relevant memories using cosine similarity
      const relevantMemoriesResult = await globalThis.convex.query(
        "memoryRetrieval:getRelevantMemories",
        {
          avatarId,
          questionEmbedding,
          topK,
          confidenceThreshold,
        }
      );

      // Step 4: Build constrained memory list. This is the only source of factual truth.
      const groundedMemories = (relevantMemoriesResult.relevantMemories || []).map((memory: any) => ({
        text: memory.text,
        score: memory.similarity,
        trustWeight: memory.trustWeight || memory.source,
      }));

      // === GraphRAG expansion (best-effort; no-op if Neo4j disabled) ===
      let graphContext: Awaited<ReturnType<typeof expandMemoryContext>> | null = null;
      try {
        const startingIds = (relevantMemoriesResult.relevantMemories || [])
          .map((m: any) => m?._id)
          .filter((id: any): id is string => typeof id === "string" && id.length > 0);
        if (startingIds.length > 0) {
          graphContext = await expandMemoryContext(startingIds, { includeContradictions: true });
          const graphBlock = renderGraphContextForPrompt(graphContext);
          if (graphBlock) {
            groundedMemories.push({
              text: graphBlock,
              score: 0,
              trustWeight: "derived",
            });
          }
        }
      } catch (gErr) {
        console.warn("[neo4j] expandMemoryContext (qa) failed (non-critical):",
          gErr instanceof Error ? gErr.message : String(gErr));
      }

      // Fetch avatar details for master prompt
      const avatar = await globalThis.convex.query("queries:getAvatarById", {
        avatarId,
      });

      if (!avatar) {
        return res.status(404).json({ error: "Avatar not found" });
      }

      const prompt = buildMemoryGroundedAvatarPrompt({
        avatarName: avatar.avatarName || "Avatar",
        personality: avatar.masterPrompt,
        memories: groundedMemories,
        userMessage: question,
      });

      // Step 5: Generate answer using constrained prompt
      const { result: answerResponse } = await generateContentWithFallback(ai, {
        contents: {
          role: "user",
          parts: [{ text: prompt }],
        },
        config: SHORT_GEMINI_RESPONSE_CONFIG,
      });

      const answer = getGeminiText(answerResponse) || "I couldn't generate an answer.";

      // Return answer with memory context
      return res.status(200).json({
        success: true,
        answer,
        question,
        relevantMemories: relevantMemoriesResult.relevantMemories.map(
          (m: any) => ({
            text: m.text,
            similarity: m.similarity,
            category: m.category,
          })
        ),
        stats: {
          totalMemories: relevantMemoriesResult.totalMemories,
          relevantCount: relevantMemoriesResult.relevantCount,
          confidenceThreshold,
        },
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
      });
    } catch (error: any) {
      console.error("Q&A error:", error);
      res.status(error?.status || 500).json({
        error: error?.status === 429 ? "Gemini quota exhausted" : error.message,
        retryAfterSeconds: error?.retryAfterSeconds,
      });
    }
  });
};
