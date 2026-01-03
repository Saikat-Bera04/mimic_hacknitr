import { Express, Request, Response } from "express";

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
};
