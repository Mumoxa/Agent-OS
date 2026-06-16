import { describe, it, expect, beforeAll } from 'vitest';
import { apiJson, healthCheck, waitFor } from './setup.js';

describe('API health and core endpoints', () => {
  beforeAll(async () => {
    let healthy = false;
    for (let i = 0; i < 30; i++) {
      healthy = await healthCheck();
      if (healthy) break;
      await waitFor(1000);
    }
    if (!healthy) throw new Error('API did not become healthy');
  }, 60_000);

  it('health endpoint returns ok', async () => {
    const data = await apiJson('/health');
    expect(data.status).toBe('ok');
  });

  it('lists agents', async () => {
    const data = await apiJson('/v1/agents');
    expect(data.agents).toBeInstanceOf(Array);
    const agentIds = data.agents.map((a: any) => a.agent_id);
    expect(agentIds).toContain('founder_chief_of_staff');
    expect(agentIds).toContain('product_manager');
    expect(agentIds).toContain('engineering');
    expect(agentIds).toContain('qa');
    expect(agentIds).toContain('devops');
    expect(agentIds).toContain('security_audit');
  });

  it('returns agent detail', async () => {
    const data = await apiJson('/v1/agents/founder_chief_of_staff');
    expect(data.agent.agent_id).toBe('founder_chief_of_staff');
  });

  it('triggers product release workflow', async () => {
    const data = await apiJson('/v1/workflows/product_release', {
      method: 'POST',
      body: JSON.stringify({ request: 'E2E test feature' }),
    });
    expect(data.workflow_id).toBeDefined();
    expect(data.run_id).toBeDefined();
    expect(data.status).toBe('queued');
    expect(data.stages).toHaveLength(4);
  });

  it('creates and retrieves a KG entity', async () => {
    const entityId = `ent_test_${Date.now()}`;
    await apiJson('/v1/kg/entities', {
      method: 'POST',
      body: JSON.stringify({
        entity_id: entityId,
        type: 'Feature',
        name: 'Test Feature',
        properties: { status: 'test' },
      }),
    });

    const data = await apiJson(`/v1/kg/entities/${entityId}`);
    expect(data.entity.name).toBe('Test Feature');
  });

  it('stores and retrieves a memory', async () => {
    const response = await apiJson('/v1/memory', {
      method: 'POST',
      body: JSON.stringify({
        agent_id: 'agent_cos_01',
        memory_type: 'observation',
        content: 'Test memory for E2E',
        importance: 0.8,
      }),
    });

    expect(response.memory_id).toBeDefined();

    const retrieved = await apiJson(`/v1/memory/${response.memory_id}`);
    expect(retrieved.memory.content).toBe('Test memory for E2E');
  });
});
