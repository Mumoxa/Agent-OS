import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config.js';
import { registerAgentRoutes } from './routes/agents.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerApprovalRoutes } from './routes/approvals.js';
import { registerEventRoutes } from './routes/events.js';
import { registerAuditRoutes } from './routes/audit.js';
import { registerKGRoutes } from './routes/kg.js';
import { registerMemoryRoutes } from './routes/memory.js';
import { registerWorkflowRoutes } from './routes/workflows.js';
import { SSEManager } from './sse.js';

const sseManager = new SSEManager(config.REDIS_URL);

const app = Fastify({
  logger: {
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

async function main() {
  await app.register(cors, { origin: true, credentials: true });
  await app.register(jwt, { secret: config.JWT_SECRET });

  await app.register(registerHealthRoutes);
  await app.register(registerAgentRoutes, { prefix: '/v1/agents' });
  await app.register(registerApprovalRoutes, { prefix: '/v1/approvals' });
  await app.register(registerEventRoutes, { prefix: '/v1/events' });
  await app.register(registerAuditRoutes, { prefix: '/v1/audit' });
  await app.register(registerKGRoutes, { prefix: '/v1/kg' });
  await app.register(registerMemoryRoutes, { prefix: '/v1/memory' });
  await app.register(registerWorkflowRoutes, { prefix: '/v1/workflows' });

  app.get('/v1/stream', async (request, reply) => {
    sseManager.addClient(request, reply);
    return reply;
  });

  await sseManager.start();

  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    app.log.info(`Agent OS API running on port ${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
