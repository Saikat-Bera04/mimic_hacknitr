// Load environment variables first
import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env") });

const REQUIRED_ENV = ["CONVEX_URL", "GEMINI_API_KEY", "JWT_SECRET"] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

import cors from "cors";
import express from "express";
import { ConvexHttpClient } from "convex/browser";
import { geminiCallRoute } from "./routes/emotion";
import { masterPromptRoute } from "./routes/masterPrompt";
import { avatarChatRoute } from "./routes/avatarChat";
import { trainerRoute } from "./routes/trainers";
import { trainerMemoryRoute } from "./routes/trainerMemory";
import { userRoute } from "./routes/user";
import { qaRoute } from "./routes/qa";
import { avatarFlowRoute } from "./routes/avatarFlow";
import { authRoute } from "./routes/auth";
import { neo4jHealthRoute } from "./routes/neo4jHealth";
import { clerkMiddleware } from "@clerk/express";
import { closeNeo4jDriver, getNeo4jDriver, isNeo4jEnabled } from "./lib/neo4j";
// removed MongoDB connection; auth will use Convex

// Initialize Convex globally
if (!globalThis.convex && process.env.CONVEX_URL) {
  globalThis.convex = new ConvexHttpClient(process.env.CONVEX_URL);
}

const app = express();

// must be before authRoute(...)
app.use(express.json());

// Configure CORS for production and development
const allowedOrigins = [
  "https://mimic01.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_ORIGIN,
].filter((origin): origin is string => Boolean(origin));

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(clerkMiddleware());

// Register routes
geminiCallRoute(app);
masterPromptRoute(app);
avatarChatRoute(app);
trainerRoute(app);
trainerMemoryRoute(app);
userRoute(app);
qaRoute(app);
avatarFlowRoute(app);
authRoute(app);
// neo4jHealthRoute(app);

// // Warm up Neo4j driver (lazy init) if enabled; safe no-op otherwise
// if (isNeo4jEnabled()) {
//   getNeo4jDriver();
// }

app.get("/", (req, res) => {
  console.log("localhost is running");
  res.send("Hello from Stark backend!");
});

async function start() {
  const port = process.env.PORT ? Number(process.env.PORT) : 8000;
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log("HTTP server closed.");
    });
    try {
      await closeNeo4jDriver();
    } catch {
      /* already logged */
    }
  };
  process.on("SIGINT", () => { void shutdown("SIGINT"); });
  process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
}

start();
