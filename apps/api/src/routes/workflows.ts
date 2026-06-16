import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { randomUUID } from 'crypto';
import { config } from '../config.js';

const redis = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });
const agentQueue = new Queue('agent-runs', { connection: redis });

const triggerWorkflowSchema = z.object({
  request: z.string().min(1),
  async: z.boolean().default(true),
});

export async function registerWorkflowRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get('/', async () => ({
    workflows: [
      {
        id: 'product_release',
        name: 'Product Release Pipeline',
        description: 'PM → Engineering → QA → DevOps staging deploy',
        stages: ['product.prd', 'code.pr', 'qa.review', 'deploy.staging'],
      },
    ],
  }));

  app.post('/product_release', async (request, reply) => {
    const body = triggerWorkflowSchema.parse(request.body);
    const runId = randomUUID();
    const workflowId = randomUUID();

    await agentQueue.add(
      'agent-run',
      {
        agent_id: 'product_manager',
        input: {
          trigger: 'manual',
          request: body.request,
          workflow_id: workflowId,
        },
        run_id: runId,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
    );

    return reply.status(202).send({
      workflow_id: workflowId,
      run_id: runId,
      status: 'queued',
      stages: [
        { stage: 'product.prd', status: 'pending', agent: 'product_manager' },
        { stage: 'code.pr', status: 'pending', agent: 'engineering' },
        { stage: 'qa.review', status: 'pending', agent: 'qa' },
        { stage: 'deploy.staging', status: 'pending', agent: 'devops' },
      ],
    });
  });

  app.get('/product_release/:workflow_id/status', async (request) => {
    const { workflow_id } = request.params as { workflow_id: string };
    // TODO: query workflow state from Redis or DB
    return {
      workflow_id,
      status: 'in_progress',
      stages: [
        { stage: 'product.prd', status: 'pending' },
        { stage: 'code.pr', status: 'pending' },
        { stage: 'qa.review', status: 'pending' },
        { stage: 'deploy.staging', status: 'pending' },
      ],
    };
  });
}
