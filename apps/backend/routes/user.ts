import { Express, Request, Response } from "express";
import { ConvexHttpClient } from "convex/browser";

function getConvexClient() {
  if (!(globalThis as any).convex) {
    const url = process.env.CONVEX_URL;
    if (!url) throw new Error("CONVEX_URL is not configured on the server");
    (globalThis as any).convex = new ConvexHttpClient(url);
  }
  return (globalThis as any).convex;
}

export const userRoute = (app: Express) => {
  // Create/Update user with details and token
  app.post("/api/user/register", async (req: Request, res: Response) => {
    try {
      const { email, userName, token, profilePhoto } = req.body;

      if (!email || !userName || !token) {
        return res.status(400).json({ error: "email, userName, and token are required" });
      }

      let convexClient;
      try {
        convexClient = getConvexClient();
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server not configured for Convex" });
      }

      // Create or update user with token
      const user = await convexClient.mutation("user:createOrUpdateUser", {
        email: email.toLowerCase(),
        userName,
        token,
        profilePhoto: profilePhoto || null,
      });

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          userName: user.userName,
          profilePhoto: user.profilePhoto,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      console.error("User registration error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get user details by email
  app.get("/api/user/:email", async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      const emailValue = Array.isArray(email) ? email[0] : email;

      if (!emailValue) {
        return res.status(400).json({ error: "email is required" });
      }

      let convexClient;
      try {
        convexClient = getConvexClient();
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server not configured for Convex" });
      }

      const user = await convexClient.query("user:getUserByEmail", {
        email: emailValue.toLowerCase(),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          userName: user.userName,
          profilePhoto: user.profilePhoto,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update user token
  app.patch("/api/user/:userId/token", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: "token is required" });
      }

      let convexClient;
      try {
        convexClient = getConvexClient();
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server not configured for Convex" });
      }

      const updatedUser = await convexClient.mutation("user:updateUserToken", {
        userId,
        token,
      });

      return res.json({
        success: true,
        message: "Token updated successfully",
        user: updatedUser,
      });
    } catch (error: any) {
      console.error("Update token error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update user profile
  app.patch("/api/user/:userId/profile", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { userName, profilePhoto } = req.body;

      if (!userName && !profilePhoto) {
        return res.status(400).json({ error: "At least one field (userName or profilePhoto) is required" });
      }

      let convexClient;
      try {
        convexClient = getConvexClient();
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server not configured for Convex" });
      }

      const updatedUser = await convexClient.mutation("user:updateUserProfile", {
        userId,
        userName,
        profilePhoto,
      });

      return res.json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error: any) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: error.message });
    }
  });
};
