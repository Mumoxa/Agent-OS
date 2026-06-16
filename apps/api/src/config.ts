import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  APP_NAME: z.string().default('Agent OS'),
  ORG_ID: z.string().default('org_demo_001'),
  ORG_NAME: z.string().default('Demo Org'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://redis:6379'),
  NEO4J_URL: z.string().default('bolt://neo4j:7687'),
  NEO4J_USER: z.string().default('neo4j'),
  NEO4J_PASSWORD: z.string(),
  LLM_ROUTER_URL: z.string().default('http://llm-router:4000'),
  CLERK_SECRET_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(16),
  VECTOR_DIMENSION: z.string().default('1536').transform(Number),
});

export const config = envSchema.parse(process.env);
