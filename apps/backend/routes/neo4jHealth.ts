import { Express, Request, Response } from "express";
import { getNeo4jDatabase, isNeo4jEnabled, pingNeo4j } from "../lib/neo4j";

export const neo4jHealthRoute = (app: Express) => {
  app.get("/health/neo4j", async (_req: Request, res: Response) => {
    const enabled = isNeo4jEnabled();
    let connected = false;
    if (enabled) {
      try {
        connected = await pingNeo4j();
      } catch {
        connected = false;
      }
    }

    return res.status(200).json({
      enabled,
      connected,
      database: getNeo4jDatabase(),
    });
  });
};
