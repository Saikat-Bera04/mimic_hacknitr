import { Express, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { generateContentWithFallback, getGeminiText } from "../lib/gemini";
import { Emotion } from "./types";

export const geminiCallRoute = (app: Express) => {
  // Handle CORS preflight for this route
  app.options("/gemini/:emotion", (req: Request, res: Response) => {
    res
      .status(204)
      .set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      })
      .send();
  });
  
  // Main handler – accepts POST (you can add GET if needed)
  app.post("/gemini/:emotion", async (req: Request, res: Response) => {
    try {
      const { prompt, avatarId, conversationId } = req.body as { prompt?: string; avatarId?: string; conversationId?: string };
      const { emotion } = req.params as { emotion: Emotion };
  
      // Initialize genAI client lazily to ensure env vars are loaded
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }
      const client = new GoogleGenAI({ apiKey });
      const { result } = await generateContentWithFallback(client, {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt || "Hey, how are you?" }],
          },
        ],
        systemInstruction: `You will only respond to the user in the tone of ${emotion} emotion.`,
      });

      const text = getGeminiText(result) || JSON.stringify(result);
  
      // Only persist to Convex when caller provides real IDs
      if (avatarId && conversationId && process.env.CONVEX_URL) {
        const convexRes = await fetch(`${process.env.CONVEX_URL}/api/mutation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "emotions:storeEmotionResponse",
            args: {
              avatarId,
              conversationId,
              userMessage: prompt || "Hey, how are you?",
              assistantResponse: text,
              emotion,
            },
          }),
        });
        if (!convexRes.ok) {
          console.error("Convex error:", convexRes.status, await convexRes.text());
        }
      }
  
      res
        .status(200)
        .set({
          "Access-Control-Allow-Origin": "*",
        })
        .json({ text });
    } catch (error: any) {
      console.error("Error in /gemini route:", error);
      res
        .status(error?.status || 500)
        .set({
          "Access-Control-Allow-Origin": "*",
        })
        .json({
          error: error?.status === 429 ? "Gemini quota exhausted" : "Failed to generate content",
          retryAfterSeconds: error?.retryAfterSeconds,
        });
    }
  });
};
