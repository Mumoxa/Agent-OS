# Agent OS — AI-Powered Company Operating System

A free-tier, open-source multi-agent operating system for founders and small teams. Automates product, engineering, QA, DevOps, security, and communications workflows with human-in-the-loop approval.

## 🚀 What it does

Agent OS runs a fleet of autonomous agents that work together through a shared event bus, knowledge graph, and memory store. A founder or operator can trigger a product release pipeline from the PWA and watch agents generate a PRD, open a PR, run QA, and deploy to staging — with human approval gates for risky actions.

## ✨ Key features

- **13 agent roles** defined as YAML manifests (Founder CoS, PM, Engineering, QA, DevOps, Research, Email/Comms, Customer Intelligence, Marketing, Sales, Finance/Ops, KG Librarian, Security/Audit)
- **Event-driven runtime** with sleep/wake cycles, retries, and recovery
- **Free LLM router** with Gemini, Groq, Cerebras, OpenRouter, and local Ollama fallback
- **Knowledge graph** (Neo4j) + semantic memory (pgvector)
- **Human approval queue** with PWA and mobile notifications
- **Security/Audit Agent** with continuous monitoring and policy enforcement
- **Real-time SSE** updates in the PWA
- **End-to-end tests** with Vitest + Playwright
- **Terraform + cloud-init** for Oracle Cloud Always Free VM
- **GitHub Actions** CI/CD and deploy pipeline
- **$0/month cost target** using free tiers

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   PWA       │────▶│  API (Fastify)│────▶│ Agent Runtime│
│  (React)    │     │  + SSE      │     │  + BullMQ   │
└─────────────┘     └─────────────┘     └──────┬──────┘
       │                                         │
       │         ┌─────────────┐                │
       └────────▶│  LLM Router  │◀───────────────┘
                 │ (Gemini/Groq/ │
                 │  Ollama/etc)  │
                 └──────┬────────┘
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
  ┌─────────┐    ┌──────────┐    ┌────────────┐
  │  Redis  │    │  Neo4j   │    │  Postgres  │
  │ (queue/ │    │ (knowledge│   │  + pgvector│
  │ events) │    │  graph)  │    │  (memory)  │
  └─────────┘    └──────────┘    └────────────┘
```

## 📁 Repo structure

```
agent-os/
├── apps/
│   ├── api/              # Fastify backend (REST, GraphQL, SSE)
│   ├── llm-router/       # Free LLM routing service
│   ├── runtime/          # Agent execution engine
│   └── web/              # React + Vite PWA
├── agents/
│   └── manifests/          # YAML agent definitions
├── infra/
│   ├── nginx/              # Reverse proxy
│   └── oracle/             # Terraform + cloud-init
├── tests/
│   └── e2e/                # Vitest + Playwright tests
├── .github/workflows/      # CI/CD
├── docker-compose.yml
├── .env.example
├── GETTING_STARTED.md
├── STRUCTURE.md
├── CONTRIBUTING.md
└── README.md
```

## 🚀 Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env
# Fill in .env with your free API keys

# 3. Start the full stack
docker compose up -d

# 4. Verify
curl http://localhost:3000/health
curl http://localhost:4000/health

# 5. Start the PWA
cd apps/web
pnpm dev
# Open http://localhost:5173
```

## 🔄 Trigger a product release pipeline

### From the PWA

1. Open the dashboard at http://localhost:5173
2. Enter a feature request in the **Product Release Pipeline** card
3. Click **Start pipeline**
4. Watch PRD → PR → QA → Staging deploy complete live

### From the API

```bash
curl http://localhost:3000/v1/workflows/product_release \
  -H "Content-Type: application/json" \
  -d '{
    "request": "Build a feature that exports daily briefings as PDF"
  }'
```

## 🛠️ Deploy to production (free tier)

1. Provision the Oracle Cloud Always Free VM with `infra/oracle`.
2. Configure Cloudflare DNS, R2, and Pages.
3. Set GitHub Actions secrets: `OCI_HOST`, `OCI_USER`, `OCI_SSH_KEY`, `ENV_FILE`.
4. Push to `main`. GitHub Actions deploys automatically.

See `GETTING_STARTED.md` and `infra/oracle/README.md` for detailed steps.

## 🧪 Testing

```bash
# Unit + API E2E tests
cd tests/e2e
pnpm install
pnpm test

# PWA tests with Playwright
pnpm playwright test
```

## 💰 Cost

Designed to run for **$0–$6/month** using:

- Oracle Cloud Always Free VM (4 ARM cores, 24 GB RAM, 200 GB SSD)
- Neon free Postgres
- Neo4j Community self-hosted
- Redis self-hosted
- Free LLM tiers (Gemini, Groq, OpenRouter, Ollama)
- Cloudflare free plan
- GitHub Actions free minutes (public repo)

See `cost-infra-estimate.md` for detailed breakdowns.

## 📚 Documentation

- `GETTING_STARTED.md` — Local setup and deploy guide
- `STRUCTURE.md` — Full file tree
- `CONTRIBUTING.md` — How to add agents and tools
- `phased-implementation.md` — Implementation status
- `phase-1-agent-runtime.md` through `phase-7-workflow-ui.md` — Phase-by-phase build notes
- `free-version-investigation.md` — Free tier strategy
- `free-version-sprint-plan.md` — Sprint plan
- `llm-router-implementation.md` — LLM router reference
- `github-actions-deploy.md` — Deploy workflow guide
- `agent-manifests-guide.md` — Agent manifest guide

## 🛣️ Roadmap

- [ ] Real code generation and commits in Engineering Agent
- [ ] Workflow state persistence and history page
- [ ] Approval gates before production actions
- [ ] Push notifications via Web Push API
- [ ] Memory retrieval integration in runtime context
- [ ] Real embedding model integration
- [ ] Support agents: Email, Customer Intelligence, Marketing, Sales, Finance, Research
- [ ] Multi-agent orchestration and dynamic planning
- [ ] Multi-model LLM router with cost/quality routing

## 🤝 Contributing

See `CONTRIBUTING.md` for guidelines.

## 📄 License

MIT — see `LICENSE`.
