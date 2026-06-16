import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function registerHealthRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get('/health', async () => ({ status: 'ok', service: 'agent-os-api' }));
  app.get('/ready', async () => ({ status: 'ready' }));
}
