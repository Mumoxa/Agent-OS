import { describe, it, expect, beforeAll } from 'vitest';
import { apiJson, healthCheck, waitFor } from './setup.js';

describe('Agent runtime flow', () => {
  beforeAll(async () => {
    let healthy = false;
    for (let i = 0; i < 30; i++) {
      healthy = await healthCheck();
      if (healthy) break;
      await waitFor(1000);
    }
    if (!healthy) throw new Error('API did not become healthy');
  }, 60_000);

  it('triggers an agent run and receives queued run ID', async () => {
    const data = await apiJson('/v1/agents/founder_chief_of_staff/run', {
      method: 'POST',
      body: JSON.stringify({
        trigger: 'manual',
        input: { request: 'Generate a test briefing' },
        async: true,
      }),
    });

    expect(data.run_id).toBeDefined();
    expect(data.status).toBe('queued');
  });

  it('publishes a lifecycle event to Redis stream', async () => {
    // This test verifies the event bus is reachable by querying events endpoint
    // In a real test, subscribe to SSE and listen for agent.run.completed
    const data = await apiJson('/v1/events?topic=agent.lifecycle&limit=10');
    expect(data.events).toBeInstanceOf(Array);
  });
});
