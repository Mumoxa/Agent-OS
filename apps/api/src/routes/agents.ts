import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';

const agentManifests = new Map<string, any>();

  // Load manifests from agents/manifests directory (simplified)
async function loadManifests() {
  // In production, read from file system or DB
  const agents = [
    {
      agent_id: 'founder_chief_of_staff',
      name: 'Founder Chief of Staff',
      status: 'idle',
      purpose: 'Executive proxy and prioritization.',
      permissions: ['read:all', 'write:strategic'],
    },
    {
      agent_id: 'product_manager',
      name: 'Product Manager',
      status: 'idle',
      purpose: 'Backlog, PRDs, roadmap, and feature lifecycle.',
      permissions: ['read:product', 'write:product'],
    },
    {
      agent_id: 'engineering',
      name: 'Engineering',
      status: 'idle',
      purpose: 'Code generation, review, and implementation.',
      permissions: ['read:code', 'write:code:branch'],
    },
    {
      agent_id: 'qa',
      name: 'QA',
      status: 'idle',
      purpose: 'Test generation, PR review, and release gating.',
      permissions: ['read:code', 'block:merge'],
    },
    {
      agent_id: 'devops',
      name: 'DevOps',
      status: 'idle',
      purpose: 'Deployment, infrastructure, monitoring, and cost.',
      permissions: ['deploy:staging', 'deploy:canary'],
    },
    {
      agent_id: 'security_audit',
      name: 'Security / Audit',
      status: 'running',
      purpose: 'Threat monitoring, policy enforcement, and audit logging.',
      permissions: ['block:tool_call', 'read:audit_logs'],
    },
  ];
  for (const agent of agents) {
    agentManifests.set(agent.agent_id, agent);
  }
}

export async function registerAgentRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  await loadManifests();

  app.get('/', async () => ({
    agents: Array.from(agentManifests.values()).map((a) => ({
      agent_id: a.agent_id,
      name: a.name,
      status: a.status,
    })),
  }));

  app.get('/:agent_id', async (request) => {
    const { agent_id } = request.params as { agent_id: string };
    const agent = agentManifests.get(agent_id);
    if (!agent) {
      throw { statusCode: 404, message: 'Agent not found' };
    }
    return { agent };
  });

  const runBodySchema = z.object({
    trigger: z.enum(['manual', 'scheduled', 'event']).default('manual'),
    input: z.record(z.any()).optional(),
    async: z.boolean().default(true),
  });

  app.post('/:agent_id/run', async (request, reply) => {
    const { agent_id } = request.params as { agent_id: string };
    const body = runBodySchema.parse(request.body);

    // TODO: enqueue in BullMQ, emit agent.run.started event
    if (body.async) {
      return reply.status(202).send({
        run_id: `run_${Date.now()}`,
        agent_id,
        status: 'queued',
      });
    }

    return { run_id: `run_${Date.now()}`, agent_id, status: 'completed' };
  });
}
