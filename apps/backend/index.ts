// Load environment variables first
import dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env") });

console.log("Hello via Bun!");
import express from "express";
import { ConvexHttpClient } from "convex/browser";
import { geminiCallRoute } from "./routes/emotion";
import { masterPromptRoute } from "./routes/masterPrompt";
import { avatarChatRoute } from "./routes/avatarChat";
import { trainerRoute } from "./routes/trainers";
import { trainerMemoryRoute } from "./routes/trainerMemory";
import { authRoute } from "./routes/auth";
// removed MongoDB connection; auth will use Convex

// Initialize Convex globally
if (!globalThis.convex && process.env.CONVEX_URL) {
  globalThis.convex = new ConvexHttpClient(process.env.CONVEX_URL);
}

const app = express();
import cors from "cors";
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Register routes
geminiCallRoute(app);
masterPromptRoute(app);
avatarChatRoute(app);
trainerRoute(app);
trainerMemoryRoute(app);
authRoute(app);

app.get("/", (req, res) => {
  console.log("localhost is running");
  res.send("Hello from Stark backend!");
});

async function start() {
  const port = process.env.PORT ? Number(process.env.PORT) : 8000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

start();
