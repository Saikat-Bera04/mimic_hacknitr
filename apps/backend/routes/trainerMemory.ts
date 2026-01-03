import { Request, Response } from "express";

declare global {
  var convex: any;
}

export const trainerMemoryRoute = (app: any) => {
  // Initialize trainer memory with master prompt
  app.post("/api/trainer/:trainerId/memory/init", async (req: Request, res: Response) => {
    try {
      const { trainerId } = req.params;
      const { systemPrompt } = req.body;

      if (!systemPrompt) {
        return res.status(400).json({ error: "systemPrompt is required" });
      }

      const result = await globalThis.convex.mutation("trainerMemory:initializeMemory", {
        trainerId,
        systemPrompt,
      });

      res.json({ success: true, message: "Master prompt created", ...result });
    } catch (error: any) {
      console.error("Init memory error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add context to trainer memory
  app.post("/api/trainer/:trainerId/memory/add-context", async (req: Request, res: Response) => {
    try {
      const { trainerId } = req.params;
      const { contextText } = req.body;

      if (!contextText) {
        return res.status(400).json({ error: "contextText is required" });
      }

      // First, generate embedding using action
      const embedding = await globalThis.convex.action("trainerMemory:generateEmbedding", {
        text: contextText,
      });

      // Then, add context with embedding to the database using mutation
      const result = await globalThis.convex.mutation("trainerMemory:addContext", {
        trainerId,
        contextText,
        embedding,
      });

      if (result.error) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error("Add context error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get trainer memory
  app.get("/api/trainer/:trainerId/memory", async (req: Request, res: Response) => {
    try {
      const { trainerId } = req.params;

      const memory = await globalThis.convex.query("trainerMemory:getMemory", {
        trainerId,
      });

      if (!memory) {
        return res.status(404).json({ error: "Trainer memory not found" });
      }

      res.json(memory);
    } catch (error: any) {
      console.error("Get memory error:", error);
      res.status(500).json({ error: error.message });
    }
  });
};