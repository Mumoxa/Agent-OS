import { AgentRuntime } from './AgentRuntime.js';

const runtime = new AgentRuntime({
  redisUrl: process.env.REDIS_URL ?? 'redis://redis:6379',
  llmRouterUrl: process.env.LLM_ROUTER_URL ?? 'http://llm-router:4000',
  orgId: process.env.ORG_ID ?? 'org_demo_001',
  manifestsDir: process.env.MANIFESTS_DIR ?? '/data/apps/agent-os/agents/manifests',
});

async function main() {
  await runtime.initialize();

  // Run Founder CoS Agent on startup for demo
  await runtime.runAgent('founder_chief_of_staff', {
    trigger: 'manual',
    request: 'Generate the daily founder briefing.',
  });

  process.on('SIGTERM', async () => {
    console.log('Shutting down runtime...');
    await runtime.shutdown();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Runtime failed:', err);
  process.exit(1);
});
