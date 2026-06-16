import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import * as neo4j from '../services/neo4j.js';

export async function registerKGRoutes(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.get('/entities', async (request) => {
    const { q, types, org_id } = request.query as { q?: string; types?: string; org_id?: string };
    const orgId = org_id ?? 'org_demo_001';
    const typeList = types ? types.split(',') : undefined;
    const results = await neo4j.searchEntities(q ?? '', orgId, typeList);
    return { entities: results };
  });

  app.get('/entities/:entity_id', async (request) => {
    const { entity_id } = request.params as { entity_id: string };
    const { org_id } = request.query as { org_id?: string };
    const orgId = org_id ?? 'org_demo_001';
    const entity = await neo4j.getEntity(entity_id, orgId);
    if (!entity) throw { statusCode: 404, message: 'Entity not found' };
    return { entity };
  });

  const createEntitySchema = z.object({
    entity_id: z.string(),
    type: z.string(),
    name: z.string(),
    properties: z.record(z.any()).default({}),
    source_id: z.string().optional(),
    source_agent_id: z.string().optional(),
  });

  app.post('/entities', async (request) => {
    const body = createEntitySchema.parse(request.body);
    const { org_id } = request.query as { org_id?: string };
    await neo4j.createEntity({ ...body, org_id: org_id ?? 'org_demo_001' });
    return { success: true };
  });

  const relationSchema = z.object({
    from_id: z.string(),
    to_id: z.string(),
    type: z.string(),
    properties: z.record(z.any()).optional(),
  });

  app.post('/relations', async (request) => {
    const body = relationSchema.parse(request.body);
    const { org_id } = request.query as { org_id?: string };
    await neo4j.createRelation(body, org_id ?? 'org_demo_001');
    return { success: true };
  });

  const querySchema = z.object({
    cypher: z.string(),
    parameters: z.record(z.any()).default({}),
  });

  app.post('/query', async (request) => {
    const body = querySchema.parse(request.body);
    const { org_id } = request.query as { org_id?: string };
    // Only allow read queries for safety
    if (!/^\s*(MATCH|RETURN|WITH|CALL|SHOW|EXPLAIN)\s+/i.test(body.cypher)) {
      throw { statusCode: 400, message: 'Only read queries are allowed' };
    }
    const results = await neo4j.queryCypher(body.cypher, body.parameters, org_id ?? 'org_demo_001');
    return { results };
  });
}
