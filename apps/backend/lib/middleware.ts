import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "./jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  const token = auth.split(" ")[1];
  const payload = verifyJwt<any>(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });
  (req as any).user = payload;
  next();
}
