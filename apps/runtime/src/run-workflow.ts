import { AgentRuntime } from './AgentRuntime.js';
import { ProductReleaseWorkflow } from './workflows/ProductReleaseWorkflow.js';

const runtime = new AgentRuntime({
  redisUrl: process.env.REDIS_URL ?? 'redis://redis:6379',
  llmRouterUrl: process.env.LLM_ROUTER_URL ?? 'http://llm-router:4000',
  orgId: process.env.ORG_ID ?? 'org_demo_001',
  manifestsDir: process.env.MANIFESTS_DIR ?? '/data/apps/agent-os/agents/manifests',
});

async function main() {
  await runtime.initialize();

  const request = process.env.WORKFLOW_REQUEST ?? 'Build a feature that lets users export their daily briefings as PDF.';
  const workflow = new ProductReleaseWorkflow(runtime);
  const runId = await workflow.start(request);

  console.log('Workflow started. Run ID:', runId);
  console.log('Watch the event stream for PM → Engineering → QA → DevOps handoffs.');

  process.on('SIGTERM', async () => {
    console.log('Shutting down runtime...');
    await runtime.shutdown();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Workflow failed:', err);
  process.exit(1);
});
