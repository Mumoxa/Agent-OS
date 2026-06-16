import { config } from './config.js';
import { Queue } from 'bullmq';

const agentQueue = new Queue('agent-runs', {
  connection: { url: config.REDIS_URL, maxRetriesPerRequest: null },
});

async function main() {
  console.log('Agent OS worker started');

  // Minimal worker placeholder
  // In production, use Worker from bullmq to process jobs
  setInterval(async () => {
    const jobCount = await agentQueue.getJobCounts('wait', 'active', 'completed', 'failed');
    console.log('Queue status:', jobCount);
  }, 30_000);

  // Keep alive
  await new Promise(() => {});
}

main().catch((err) => {
  console.error('Worker failed:', err);
  process.exit(1);
});
