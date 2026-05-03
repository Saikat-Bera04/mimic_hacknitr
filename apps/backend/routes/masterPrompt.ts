import { Express, Request, Response } from "express";

interface AvatarDraft {
  id: string;
  avatarName: string;
  ownerId: string;
  ownerEmail: string;
  ownerName?: string;
  createdAt: number;
  status: 'draft' | 'awaiting_trainer' | 'pending' | 'accepted' | 'completed';
  ownerResponses: Array<{ question: string; answer: string }>;
  draftPrompt: string;
  trainerResponses?: Array<{ question: string; answer: string; note?: string }>;
  finalMasterPrompt?: string;
  completedAt?: number;
  convexTrainerId?: string; // Add this field
}

export const masterPromptRoute = (app: Express) => {
  // CORS preflight for POST
  app.options("/api/master-prompt", (req: Request, res: Response) => {
    res
      .status(204)
      .set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      })
      .send();
  });

 
  app.post("/api/master-prompt", async (req: Request, res: Response) => {
    try {
      const { userId, masterPrompt } = req.body;

      if (!userId || !masterPrompt) {
        return res.status(400).json({
          error: "userId and masterPrompt are required",
        });
      }

      const response = await fetch(
        `${process.env.CONVEX_URL}/api/mutation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: "prompt.input:addMasterPrompt",
            args: {
              userId,
              masterPrompt,
            },
          }),
        }
      );

      const data:any = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.error || "Failed to add master prompt",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Master prompt added/updated successfully",
        id: data.data,
      });
    } catch (error) {
      console.error("Error adding master prompt:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // GET: Retrieve master prompt for a user
  app.get("/api/master-prompt/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({
          error: "userId is required",
        });
      }

      const response = await fetch(
        `${process.env.CONVEX_URL}/api/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: "prompt.input:getMasterPrompt",
            args: {
              userId,
            },
          }),
        }
      );

      const data:any = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.error || "Failed to retrieve master prompt",
        });
      }

      return res.status(200).json({
        success: true,
        data: data.data,
      });
    } catch (error) {
      console.error("Error retrieving master prompt:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // Helper function to save master prompt to Convex trainers table
  async function saveToConvexTrainers(
    trainerName: string,
    masterPrompt: string,
    ownerEmail: string,
    avatarName: string
  ): Promise<{ success: boolean; trainerId?: string; error?: string }> {
    try {
      const backendUrl = `http://localhost:${process.env.PORT || 8000}`;
      
      // Create or update trainer with the system prompt
      const response = await fetch(`${backendUrl}/api/trainer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trainerName || avatarName,
          systemPrompt: masterPrompt,
          description: `Avatar: ${avatarName} | Created by: ${ownerEmail}`,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("Failed to save to trainers table:", data);
        return { success: false, error: data.error || "Failed to save trainer" };
      }

      console.log("Saved master prompt to trainers table:", data);
      return { success: true, trainerId: data.id || data.trainerId };
    } catch (error: any) {
      console.error("Error saving to trainers table:", error);
      return { success: false, error: error.message };
    }
  }
};
