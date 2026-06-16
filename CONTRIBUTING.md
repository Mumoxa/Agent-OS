# Contributing to Agent OS

## Development setup

See `GETTING_STARTED.md` for local setup instructions.

## Code structure

- `apps/api` — Fastify backend
- `apps/llm-router` — Free LLM router
- `apps/runtime` — Agent runtime engine
- `apps/web` — React + Vite PWA
- `agents/manifests` — Agent YAML templates
- `infra/oracle` — Terraform + cloud-init
- `tests/e2e` — Vitest + Playwright tests

## Adding a new agent

1. Create a YAML manifest in `agents/manifests/<agent-name>.yaml`.
2. Validate against `agents/manifests/schema.json`.
3. Implement the agent class in `apps/runtime/src/agents/<AgentName>.ts`.
4. Export it from `apps/runtime/src/agents/index.ts`.
5. Register it in `apps/runtime/src/AgentRuntime.ts` `createAgentInstance()`.
6. Add it to the API agent list in `apps/api/src/routes/agents.ts`.
7. Restart the runtime.

## Agent manifest example

```yaml
agent_id: my_agent
name: My Agent
version: "1.0"
purpose: What this agent does
inputs:
  - relevant inputs
outputs:
  - expected outputs
tools:
  - tool_name
memory:
  read:
    - memory_type
  write:
    - memory_type
permissions:
  - permission_name
tasks_autonomous:
  - routine task
tasks_approval:
  - risky task
sleep_cycle:
  mode: scheduled
  schedule: 15-minute cycles
  emergency_topics:
    - security.alert
failure_modes:
  - name: some_failure
    mitigation: how to handle it
llm:
  default_model: gemini-2.5-flash
  task_type: summary
subscribed_topics:
  - relevant.topic
published_topics:
  - my.output.topic
```

## Adding a new tool

1. Add the tool to the appropriate file in `apps/runtime/src/tools/`.
2. Register it in `ToolRegistry` via `registerXTools()`.
3. Ensure it has `required_permissions` and `approval_threshold`.
4. Add the tool name to agent manifests that need it.

## Running tests

```bash
pnpm test
```

## Submitting changes

1. Open an issue or discussion for large changes.
2. Create a feature branch.
3. Make sure CI passes (`pnpm typecheck`, `pnpm lint`, `pnpm test`).
4. Submit a pull request with a clear description.

## Code style

- TypeScript strict mode enabled
- Prettier for formatting
- ESLint for linting
- Use meaningful names and keep functions small
- Add comments for complex logic
