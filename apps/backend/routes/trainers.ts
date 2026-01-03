import { Request, Response } from "express";
import { requireAuth } from "../lib/middleware";

declare global {
  var convex: any;
}

export const trainerRoute = (app: any) => {
  // Create trainer with system prompt
  app.post("/api/trainers/create", async (req: Request, res: Response) => {
    try {
      const { userId, name, systemPrompt, specialization } = req.body;

      if (!userId || !name || !systemPrompt) {
        return res.status(400).json({ 
          error: "userId, name, and systemPrompt are required" 
        });
      }

      const result = await globalThis.convex.mutation("trainers:createTrainer", {
        userId,
        name,
        systemPrompt,
        specialization,
      });

      if (result.error) {
        return res.status(400).json(result);
      }

      res.json({ 
        success: true, 
        message: "Trainer created successfully",
        trainerId: result.trainerId 
      });
    } catch (error: any) {
      console.error("Create trainer error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create an invitation for a trainer to be invited to an avatar (protected)
  app.post(
    "/api/trainers/:avatarId/invite",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { avatarId } = req.params;
        const { invitedUserId } = req.body;
        if (!invitedUserId) {
          return res.status(400).json({ error: "invitedUserId is required" });
        }

        // Call Convex mutation to create invitation
        const result = await globalThis.convex.mutation("trainers:inviteTrainer", {
          avatarId,
          invitedUserId,
        });

        if (result?.error) {
          return res.status(400).json(result);
        }

        return res.status(201).json({ success: true, invitationId: result });
      } catch (error: any) {
        console.error("Invite trainer error:", error);
        return res.status(500).json({ error: error.message || "Invitation failed" });
      }
    }
  );

  // Get trainer by user ID
  app.get("/api/trainers/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const trainer = await globalThis.convex.query("trainers:getTrainer", {
        userId,
      });

      if (!trainer) {
        return res.status(404).json({ error: "Trainer not found for this user" });
      }

      res.json(trainer);
    } catch (error: any) {
      console.error("Get trainer error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update trainer system prompt
  app.put("/api/trainers/:trainerId/system-prompt", async (req: Request, res: Response) => {
    try {
      const { trainerId } = req.params;
      const { systemPrompt } = req.body;

      if (!systemPrompt) {
        return res.status(400).json({ error: "systemPrompt is required" });
      }

      const result = await globalThis.convex.mutation("trainers:updateTrainerSystemPrompt", {
        trainerId,
        systemPrompt,
      });

      if (result.error) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      console.error("Update trainer error:", error);
      res.status(500).json({ error: error.message });
    }
  });
};
