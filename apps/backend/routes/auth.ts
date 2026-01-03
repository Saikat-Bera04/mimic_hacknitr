import { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { signJwt } from "../lib/jwt";

const convexClient = (globalThis as any).convex;

export const authRoute = (app: Express) => {
  app.options("/api/auth/signup", (req: Request, res: Response) => {
    res
      .status(204)
      .set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      })
      .send();
  });

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "email and password are required" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const created = await convexClient.mutation("auth.createUser", {
        email: email.toLowerCase(),
        userName: name,
        passwordHash,
      });
      const id = created?.id ?? created;
      const token = signJwt({ sub: id, email: email.toLowerCase() });
      return res.status(201).json({ token, user: { id, email: email.toLowerCase(), name } });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(400).json({ error: error instanceof Error ? error.message : "Signup failed" });
    }
  });

  app.options("/api/auth/signin", (req: Request, res: Response) => {
    res
      .status(204)
      .set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      })
      .send();
  });

  app.post("/api/auth/signin", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "email and password are required" });
      }
      const user = await convexClient.query("auth.findUserByEmail", { email: email.toLowerCase() });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      const ok = await bcrypt.compare(password, user.passwordHash || "");
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });
      const id = user.id ?? user._id ?? null;
      const token = signJwt({ sub: id, email: user.email });
      return res.status(200).json({ token, user: { id, email: user.email, name: user.userName || user.name } });
    } catch (error) {
      console.error("Signin error:", error);
      return res.status(500).json({ error: "Signin failed" });
    }
  });
};
