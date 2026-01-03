import { Express, Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
      const { prompt } = req.body as { prompt?: string };
      const { emotion } = req.params as { emotion: Emotion };
  
      // Initialize GoogleGenerativeAI lazily to ensure env vars are loaded
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }
      const googleGenAI = new GoogleGenerativeAI(apiKey);
      const model = googleGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt || "Hey, how are you?" }],
          },
        ],
        systemInstruction: `You will only respond to the user in the tone of ${emotion} emotion.`,
      });

      let text = "";
      if (result?.response && typeof result.response.text === "function") {
        text = result.response.text();
      } else if (result?.response && typeof result.response.text === "string") {
        text = result.response.text;
      } else {
        text = JSON.stringify(result);
      }
  
      // ---- Convex call with logging ----
      const convexRes = await fetch(
        `${process.env.CONVEX_URL}/api/mutation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: "emotions:storeEmotionResponse",
            args: {
              avatarId: "TODO_AVATAR_ID",
              conversationId: "TODO_CONVERSATION_ID",
              userMessage: prompt || "Hey, how are you?",
              assistantResponse: text,
              emotion,
            },
          }),
        }
      );
  
      if (!convexRes.ok) {
        const body = await convexRes.text();
        console.error("Convex error:", convexRes.status, body);
      } else {
        console.log("Convex OK:", await convexRes.text());
      }
      // -----------------------------------
  
      res
        .status(200)
        .set({
          "Access-Control-Allow-Origin": "*",
        })
        .json({ text });
    } catch (error) {
      console.error("Error in /gemini route:", error);
      res
        .status(500)
        .set({
          "Access-Control-Allow-Origin": "*",
        })
        .json({ error: "Failed to generate content" });
    }
  });
};
