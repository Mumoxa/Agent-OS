import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import * as pgvector from '../services/pgvector.js';

export async function registerMemoryRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  const saveSchema = z.object({
    agent_id: z.string(),
    memory_type: z.enum(['observation', 'output', 'conversation']),
    content: z.string(),
    metadata: z.record(z.any()).optional(),
    importance: z.number().min(0).max(1).default(0.5),
    source_event_id: z.string().optional(),
  });

  app.post('/', async (request) => {
    const body = saveSchema.parse(request.body);
    const { org_id } = request.query as { org_id?: string };
    const result = await pgvector.saveMemory({
      ...body,
      org_id: org_id ?? 'org_demo_001',
    });
    return { success: true, memory_id: result.memory_id };
  });

  const retrieveSchema = z.object({
    query: z.string(),
    agent_id: z.string().optional(),
    memory_type: z.array(z.enum(['observation', 'output', 'conversation'])).optional(),
    top_k: z.number().int().positive().default(5),
    after: z.string().optional(),
  });

  app.post('/retrieve', async (request) => {
    const body = retrieveSchema.parse(request.body);
    const { org_id } = request.query as { org_id?: string };
    const results = await pgvector.retrieveMemories(body.query, org_id ?? 'org_demo_001', {
      agent_id: body.agent_id,
      memory_type: body.memory_type,
      top_k: body.top_k,
      after: body.after,
    });
    return { memories: results };
  });

  app.get('/:memory_id', async (request) => {
    const { memory_id } = request.params as { memory_id: string };
    const { org_id } = request.query as { org_id?: string };
    const memory = await pgvector.getMemoryById(memory_id, org_id ?? 'org_demo_001');
    if (!memory) throw { statusCode: 404, message: 'Memory not found' };
    return { memory };
  });
}
