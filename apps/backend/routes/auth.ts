import { Express, Request, Response } from "express";
import { createUser, findUserByEmail, verifyPassword } from "../models/user";
import { signJwt } from "../lib/jwt";

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
      const user = await createUser(email.toLowerCase(), password, name);
      const token = signJwt({ sub: user.id, email: user.email });
      return res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
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
      const user = await findUserByEmail(email.toLowerCase());
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });
      const token = signJwt({ sub: user._id?.toString(), email: user.email });
      return res.status(200).json({ token, user: { id: user._id?.toString(), email: user.email, name: user.name } });
    } catch (error) {
      console.error("Signin error:", error);
      return res.status(500).json({ error: "Signin failed" });
    }
  });
};
