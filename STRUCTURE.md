# Repo Structure

```
starter-repo/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Deploy to Oracle VM on push to main
├── agents/
│   └── manifests/
│       ├── schema.json           # JSON Schema for agent manifests
│       ├── founder-chief-of-staff.yaml
│       ├── product-manager.yaml
│       ├── engineering.yaml
│       ├── qa.yaml
│       ├── devops.yaml
│       ├── research.yaml
│       ├── email-communications.yaml
│       ├── customer-intelligence.yaml
│       ├── marketing.yaml
│       ├── sales.yaml
│       ├── finance-ops.yaml
│       ├── knowledge-graph-librarian.yaml
│       └── security-audit.yaml
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── index.ts        # Fastify server entry
│   │   │   ├── worker.ts       # BullMQ worker entry
│   │   │   ├── config.ts       # Environment config
│   │   │   ├── sse.ts          # SSE manager for real-time updates
│   │   │   ├── services/
│   │   │   │   ├── neo4j.ts     # Knowledge Graph service
│   │   │   │   └── pgvector.ts  # Vector memory service
│   │   │   └── routes/
│   │   │       ├── health.ts
│   │   │       ├── agents.ts
│   │   │       ├── approvals.ts
│   │   │       ├── events.ts
│   │   │       ├── audit.ts
│   │   │       ├── kg.ts        # Knowledge Graph routes
│   │   │       ├── memory.ts    # Memory routes
│   │   │       └── workflows.ts # Workflow trigger routes
│   │   ├── Dockerfile
│   │   ├── Dockerfile.worker
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── llm-router/
│   │   ├── src/
│   │   │   ├── index.ts        # Fastify server
│   │   │   ├── router.ts       # Routing logic
│   │   │   ├── config.ts       # Provider configs
│   │   │   ├── cache.ts
│   │   │   ├── rate-limit.ts
│   │   │   ├── circuit-breaker.ts
│   │   │   ├── types.ts
│   │   │   └── adapters/
│   │   │       ├── base.ts
│   │   │       ├── gemini.ts
│   │   │       ├── groq.ts
│   │   │       ├── cerebras.ts
│   │   │       ├── openrouter.ts
│   │   │       └── ollama.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── runtime/
│   │   ├── src/
│   │   │   ├── index.ts              # Runtime entrypoint
│   │   │   ├── run-workflow.ts       # Product release workflow entrypoint
│   │   │   ├── AgentRuntime.ts       # Core runtime engine
│   │   │   ├── ManifestLoader.ts     # YAML manifest loading + validation
│   │   │   ├── types.ts              # Agent and context types
│   │   │   ├── agents/
│   │   │   │   ├── FounderCoSAgent.ts
│   │   │   │   ├── ProductManagerAgent.ts
│   │   │   │   ├── EngineeringAgent.ts
│   │   │   │   ├── QAAgent.ts
│   │   │   │   ├── DevOpsAgent.ts
│   │   │   │   ├── SecurityAgent.ts
│   │   │   │   └── index.ts
│   │   │   ├── tools/
│   │   │   │   ├── ToolRegistry.ts
│   │   │   │   ├── github.ts
│   │   │   │   ├── deploy.ts
│   │   │   │   └── test.ts
│   │   │   ├── security/
│   │   │   │   └── SecurityMonitor.ts
│   │   │   └── workflows/
│   │   │       └── ProductReleaseWorkflow.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── index.css
│       │   ├── hooks/
│       │   │   ├── useSSE.ts      # Server-Sent Events hook
│       │   │   └── useWorkflow.ts # Workflow trigger hook
│       │   ├── components/
│       │   │   ├── Layout.tsx
│       │   │   ├── StatusBadge.tsx
│       │   │   ├── AgentCard.tsx
│       │   │   └── WorkflowPanel.tsx # Pipeline UI
│       │   └── pages/
│       │       ├── Dashboard.tsx
│       │       ├── AgentDetail.tsx
│       │       ├── Approvals.tsx
│       │       ├── KnowledgeGraph.tsx
│       │       └── Login.tsx
│       ├── wireframe.html       # Interactive mockup
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── package.json
│       └── tsconfig.json
├── infra/
│   ├── nginx/
│   │   └── nginx.conf           # Reverse proxy config
│   └── oracle/
│       ├── main.tf              # Terraform resources
│       ├── variables.tf
│       ├── terraform.tfvars.example
│       ├── cloud-init.yaml      # VM first-boot setup
│       └── README.md
├── tests/
│   └── e2e/
│       ├── setup.ts             # Test helpers
│       ├── vitest.config.ts
│       ├── playwright.config.ts
│       ├── api.test.ts
│       ├── agent-flow.test.ts
│       ├── approval-flow.test.ts
│       └── pwa.test.ts
├── docker-compose.yml           # Free stack orchestration
├── .env.example                 # Environment template
├── .gitignore
├── package.json                 # Root workspace config
├── pnpm-workspace.yaml
├── tsconfig.json
├── README.md                    # Main repo docs
└── STRUCTURE.md                 # This file
```
