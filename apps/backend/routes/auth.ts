import { Express, Request, Response } from "express";
import { ConvexHttpClient } from "convex/browser";
import { clerkClient, getAuth } from "@clerk/express";
import { api } from "../convex/_generated/api";

function getConvexClient() {
  if (!(globalThis as any).convex) {
    const url = process.env.CONVEX_URL;
    if (!url) throw new Error("CONVEX_URL is not configured on the server");
    (globalThis as any).convex = new ConvexHttpClient(url);
  }
  return (globalThis as any).convex as ConvexHttpClient;
}

export const authRoute = (app: Express) => {
  /**
   * POST /api/auth/clerk/sync
   * Syncs Clerk user to Convex database
   * Called after successful Clerk signup/signin from frontend
   * 
   * Headers:
   *   Authorization: Bearer <clerk_session_token>
   * 
   * Response: { user: { id, clerkId, email, userName, profilePhoto, isNew } }
   */
  app.post("/api/auth/clerk/sync", async (req: Request, res: Response) => {
    try {
      // Get authenticated user from Clerk middleware
      const auth = getAuth(req);
      
      if (!auth.userId) {
        return res.status(401).json({ error: "Unauthorized - No valid Clerk session" });
      }

      // Fetch full user details from Clerk
      const clerkUser = await clerkClient.users.getUser(auth.userId);
      
      const convexClient = getConvexClient();

      // Sync user to Convex
      const result = await convexClient.mutation(api.auth.createOrUpdateFromClerk, {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        userName: clerkUser.username || clerkUser.firstName || "",
        profilePhoto: clerkUser.imageUrl,
      });

      return res.status(200).json({ 
        message: result.isNew ? "User created successfully" : "User synced successfully",
        user: result 
      });
    } catch (error) {
      console.error("Clerk sync error:", error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to sync user" 
      });
    }
  });

  /**
   * GET /api/auth/clerk/me
   * Get current user's Convex profile
   * 
   * Headers:
   *   Authorization: Bearer <clerk_session_token>
   * 
   * Response: { user: { id, clerkId, email, userName, profilePhoto } }
   */
  app.get("/api/auth/clerk/me", async (req: Request, res: Response) => {
    try {
      const auth = getAuth(req);
      
      if (!auth.userId) {
        return res.status(401).json({ error: "Unauthorized - No valid Clerk session" });
      }

      const convexClient = getConvexClient();

      const user = await convexClient.query(api.auth.findByClerkId, {
        clerkId: auth.userId,
      });

      if (!user) {
        return res.status(404).json({ error: "User not found in Convex. Please call /api/auth/clerk/sync first." });
      }

      return res.status(200).json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get user" 
      });
    }
  });

  /**
   * POST /api/auth/signup (Legacy endpoint - now uses Clerk)
   * For testing: Creates user in Clerk and syncs to Convex
   * 
   * Body: { username, email, password }
   * Response: { message, clerkUserId, convexUser }
   */
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "email and password are required" });
      }

      if (!username) {
        return res.status(400).json({ error: "username is required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "password must be at least 8 characters" });
      }

      const clerkUser = await clerkClient.users.createUser({
        username: username.trim(),
        emailAddress: [email.toLowerCase().trim()],
        password: password,
      });

      const convexClient = getConvexClient();
      const convexUser = await convexClient.mutation(api.auth.createOrUpdateFromClerk, {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        userName: clerkUser.username || "",
        profilePhoto: clerkUser.imageUrl,
      });

      return res.status(201).json({
        message: "User created successfully",
        clerkUserId: clerkUser.id,
        convexUser,
      });
    } catch (error: any) {
      console.error("Signup error raw:", JSON.stringify(error, null, 2));

      // Clerk-style errors
      if (error?.errors && Array.isArray(error.errors)) {
        const messages = error.errors.map((e: any) => e.message || e.longMessage).join(", ");
        return res.status(400).json({ error: messages });
      }

      // Generic Error instance
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }

      // Fallback
      return res.status(400).json({ error: "Signup failed" });
    }
  });
};
