import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function registerAuditRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get('/', async (request) => {
    const { agent_id, limit } = request.query as { agent_id?: string; limit?: string };
    // TODO: read from append-only audit log
    return {
      logs: [],
      agent_id,
      limit: limit ? Number(limit) : 100,
    };
  });

  app.get('/verify', async () => {
    // TODO: verify hash chain
    return { valid: true, checked_entries: 0 };
  });
}
