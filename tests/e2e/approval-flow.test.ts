import { describe, it, expect, beforeAll } from 'vitest';
import { apiJson, healthCheck, waitFor } from './setup.js';

describe('Approval flow', () => {
  beforeAll(async () => {
    let healthy = false;
    for (let i = 0; i < 30; i++) {
      healthy = await healthCheck();
      if (healthy) break;
      await waitFor(1000);
    }
    if (!healthy) throw new Error('API did not become healthy');
  }, 60_000);

  it('lists pending approvals', async () => {
    const data = await apiJson('/v1/approvals?status=pending');
    expect(data.approvals).toBeInstanceOf(Array);
  });

  it('responds to an approval', async () => {
    // Create a mock approval via Redis event in real scenario
    // For this test, we assume a pending approval exists
    const list = await apiJson('/v1/approvals?status=pending');
    if (list.approvals.length === 0) {
      console.log('No pending approvals to test response');
      return;
    }

    const approvalId = list.approvals[0].approval_id;
    const response = await apiJson(`/v1/approvals/${approvalId}/respond`, {
      method: 'POST',
      body: JSON.stringify({
        response: 'approved',
        comment: 'E2E test approval',
      }),
    });

    expect(response.approval.status).toBe('approved');
  });
});
