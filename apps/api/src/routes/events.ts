import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function registerEventRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get('/', async (request) => {
    const { topic, limit } = request.query as { topic?: string; limit?: string };
    // TODO: read from Redis Streams or event store
    return {
      events: [],
      topic,
      limit: limit ? Number(limit) : 50,
    };
  });

  app.post('/replay', async () => {
    // TODO: replay events from store (admin only)
    return { replayed: 0 };
  });
}
