# ✨ Mimic — Privacy‑First AI Avatars

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16%2B-black.svg)](https://nextjs.org/)

**Build AI avatars that genuinely reflect your personality, not generic chatbots.**

[Live Demo](https://mimic01.vercel.app/dashboard) • [GitHub](https://github.com/debopriyadebnath/mimic) • [Video Demo](https://youtube.com/shorts/xD5wGwz724k?si=mCXV4I_gls4C9QjV) • [Documentation](#documentation)

</div>

---

## 🎯 What is Mimic?

Mimic is a **privacy-first AI avatar platform** where users create personal AI identities that evolve only through **explicit, trusted inputs**. Rather than passively learning from every interaction, Mimic uses user-curated memories stored as embeddings and recalled via vector similarity—ensuring accuracy, personality consistency, and minimal hallucination.

### The Problem
Traditional AI chatbots:
- Learn from every interaction passively
- Cannot be trusted to remember correctly
- Generate generic responses without personality
- Leave users with little control over their data

### The Solution
Mimic offers:
- **Explicit control**: Only add what you want remembered
- **Vector-based recall**: Retrieve relevant memories using semantic similarity
- **Trust weighting**: Assign confidence levels to shape responses
- **Full transparency**: Every response cites which memories influenced it
- **Privacy-first architecture**: Conversations are ephemeral; memories are deliberate

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🧠 **Smart Memory** | Add discrete memories (opinions, preferences, facts) that become part of your avatar |
| 📊 **Vector Retrieval** | Embeddings stored in a vector DB, recalled by semantic similarity for accurate context |
| ⚖️ **Trust Weighting** | Assign confidence levels to memories so high-trust inputs influence responses more |
| 🔍 **Explainability** | Every response shows which memories were used—full transparency and auditability |
| 🔄 **Separate Streams** | Conversations remain ephemeral; long-term memory grows only by deliberate action |
| 🛡️ **Reduced Hallucination** | Conditioning on trusted, relevant memories minimizes false assertions |
| 🚀 **Scalable** | Pluggable vector DB and model backends for enterprise deployment |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                         │
├─────────────────────────────────────────────────────────────┤
│ Frontend (Next.js) → API Routes → Convex Backend            │
├─────────────────────────────────────────────────────────────┤
│  Memory Management  │  Vector Store  │  LLM Integration     │
├─────────────────────────────────────────────────────────────┤
│   MongoDB (Metadata) │ Vector DB (Embeddings) │ Google GenAI │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

**Frontend:**
- [Next.js 16](https://nextjs.org/) — React framework with server components
- [TypeScript](https://www.typescriptlang.org/) — Type-safe development
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling
- [Shadcn/ui](https://ui.shadcn.com/) — High-quality component library

**Backend:**
- [Express.js](https://expressjs.com/) — REST API server
- [Convex](https://www.convex.dev/) — Realtime backend platform
- [MongoDB](https://www.mongodb.com/) — Data persistence
- [Google Generative AI](https://ai.google.dev/) — LLM integration

**Infrastructure:**
- [Vercel](https://vercel.com/) — Frontend deployment
- [Render](https://render.com/) — Backend deployment

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- pnpm (preferred) or npm
- Git

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd mimic

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development servers
pnpm dev
```

### Environment Setup

Create `.env.local` in the root:

```env
# Frontend
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# Backend
DATABASE_URL=your_mongodb_url
JWT_SECRET=your_jwt_secret
GOOGLE_API_KEY=your_google_genai_key
ASSEMBLYAI_API_KEY=your_assemblyai_key

# Neo4j (optional — GraphRAG memory layer)
NEO4J_URI=neo4j+s://<your-aura-instance>.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password
NEO4J_DATABASE=neo4j
NEO4J_GRAPH_ENABLED=true
NEO4J_GRAPH_MAX_DEPTH=2
NEO4J_GRAPH_CONTEXT_LIMIT=12
```

---

## 🕸️ Neo4j Graph Layer (optional GraphRAG)

Mimic stores memories primarily in **Convex** (with vector similarity search). On top of that, an **optional Neo4j graph layer** adds relationship-aware retrieval, explainability, and contradiction detection — without replacing any existing storage.

### What it adds

- **Graph nodes:** `User`, `Avatar`, `Trainer`, `Memory`, `Entity`, `Trait`
- **Relationships:** `OWNS`, `HAS_MEMORY`, `TRAINED`, `ADDED`, `MENTIONS`, `EXPRESSES`, `RELATED_TO`, `CONTRADICTS`
- **GraphRAG expansion:** after top-K vector retrieval, chat prompts are enriched with related memories, traits, mentioned entities, and any contradictions.
- **Explainability:** chat responses include `graphContextUsed`, `graphMemoryIdsUsed`, and `contradictions` fields.

### Required env vars

| Variable | Purpose | Default |
|---|---|---|
| `NEO4J_URI` | Bolt/Aura connection string | — |
| `NEO4J_USERNAME` | Neo4j user | — |
| `NEO4J_PASSWORD` | Neo4j password | — |
| `NEO4J_DATABASE` | Database name | `neo4j` |
| `NEO4J_GRAPH_ENABLED` | Set to `false` to force-disable | `true` |
| `NEO4J_GRAPH_MAX_DEPTH` | Max graph traversal depth | `2` |
| `NEO4J_GRAPH_CONTEXT_LIMIT` | Max nodes per expansion | `12` |

### Setup (free Neo4j Aura)

1. Create a free Aura instance at **https://neo4j.com/cloud/aura/** (Aura Free tier).
2. Download the credentials file and copy `NEO4J_URI`, username, and password into your `apps/backend/.env`.
3. Initialize constraints once:
   ```bash
   cd apps/backend
   npm run neo4j:init
   ```
4. Smoke-test connectivity:
   ```bash
   npm run neo4j:smoke
   ```
5. Check the live health endpoint:
   ```bash
   curl http://localhost:8000/health/neo4j
   # => { "enabled": true, "connected": true, "database": "neo4j" }
   ```

### Behavior when Neo4j is not configured

If any of `NEO4J_URI` / `NEO4J_USERNAME` / `NEO4J_PASSWORD` is missing (or `NEO4J_GRAPH_ENABLED=false`):

- The backend **still runs normally** and writes to Convex as before.
- Graph mirroring and `expandMemoryContext` become **no-ops** and return empty results.
- `/health/neo4j` reports `{ "enabled": false, "connected": false }`.
- A single concise warning is logged at startup; no secrets are ever printed.

---

## 📖 How It Works

### 1. **Create an Avatar**
   - Set up a personal AI identity with a name and avatar image
   - Define an initial personality via a master prompt

### 2. **Add Explicit Memories**
   - Add discrete facts, opinions, or preferences
   - Each memory is tagged with metadata (author, trust level, timestamp)
   - Memories are converted to embeddings and stored in a vector DB

### 3. **Start a Conversation**
   - Chat with your avatar naturally
   - The system retrieves the top-K most relevant, trust-weighted memories
   - The LLM generates a response conditioned on:
     - Retrieved memories (context)
     - Ephemeral conversation history
     - Avatar's master prompt (personality)

### 4. **Review & Control**
   - See which memories influenced each response (explainability)
   - Edit, delete, or re-weight memories anytime
   - Conversations are cleared; only intentional memories persist

---

## 🏃 Running the Project

### Development Mode

**Terminal 1 — Frontend:**
```bash
cd apps/frontend
npm run dev
# Opens on http://localhost:3000
```

**Terminal 2 — Backend:**
```bash
cd apps/backend
npm run dev
# API server on http://localhost:8000
```

### Production Build

```bash
# Build frontend
cd apps/frontend && npm run build && npm start

# Build backend
cd apps/backend && npm run build && npm start
```

---

## 📁 Project Structure

```
mimic/
├── apps/
│   ├── frontend/          # Next.js web application
│   │   ├── src/app/       # Route handlers
│   │   ├── src/components/# Reusable UI components
│   │   └── src/lib/       # Utilities & helpers
│   └── backend/           # Express + Convex server
│       ├── convex/        # Convex functions
│       ├── routes/        # API routes
│       └── lib/           # Backend utilities
├── packages/
│   └── shared/            # Shared types & utilities
├── .gitignore
├── package.json           # Root workspace config
└── pnpm-workspace.yaml    # pnpm monorepo config
```

---

## 🤝 Contributing

Contributions are welcome! Follow these steps:

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -m 'feat: add my feature'`
3. Push to remote: `git push origin feature/my-feature`
4. Open a Pull Request with a clear description

### Code Standards
- Use TypeScript for all new code
- Follow the existing code style
- Write tests for new features
- Keep commits atomic and descriptive

---

## 📚 Documentation

- [Frontend Setup](./apps/frontend/README.md)
- [Backend Setup](./apps/backend/README.md)
- [API Documentation](./apps/backend/convex/README.md)
- [Architecture Guide](./docs/architecture.md)

---

## 🔗 Links

| Link | Description |
|------|-------------|
| [🌐 Live Demo](https://mimic01.vercel.app/dashboard) | Production deployment on Vercel |
| [📹 Video Demo](https://youtube.com/shorts/xD5wGwz724k?si=mCXV4I_gls4C9QjV) | Quick walkthrough |
| [📧 Support](mailto:support@mimic.ai) | Get help |

---

## 📜 License

This project is licensed under the [MIT License](LICENSE) — free to use and modify.

---

## ⭐ Show Your Support

If you find Mimic useful, please star this repository and share it with others!

---

<div align="center">

**Built with ❤️ by the Mimic team**

*Privacy-first. Personality-driven. Truly yours.*

</div>