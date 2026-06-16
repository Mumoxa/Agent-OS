import Fastify from 'fastify';
import { z } from 'zod';
import { LLMRouter } from './router.js';
import { ChatRequest } from './types.js';
import { config } from './config.js';

const app = Fastify({
  logger: { level: config.NODE_ENV === 'production' ? 'info' : 'debug' },
});

const router = new LLMRouter();

const chatBodySchema = z.object({
  model: z.string().default('auto'),
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant', 'tool']),
      content: z.string(),
      name: z.string().optional(),
    })
  ),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  top_p: z.number().min(0).max(1).optional(),
  stream: z.boolean().default(false),
  agent_id: z.string().optional(),
  org_id: z.string().optional(),
  task_type: z.enum(['summary', 'chat', 'code', 'reasoning', 'creative', 'offline']).default('chat'),
  fallback_policy: z.enum(['free_only', 'allow_local_only', 'allow_paid']).default('free_only'),
  cache: z.boolean().default(true),
});

app.get('/health', async () => ({ status: 'ok', service: 'llm-router' }));
app.get('/v1/models', async () => router.listModels());
app.get('/usage', async () => router.usageSummary());

app.post('/v1/chat/completions', async (request, reply) => {
  const body = chatBodySchema.parse(request.body) as ChatRequest;

  if (body.stream) {
    return reply.status(501).send({
      error: { message: 'Streaming not yet supported in free router', type: 'not_implemented' },
    });
  }

  try {
    const response = await router.chat(body);
    return response;
  } catch (err: any) {
    app.log.error(err);
    return reply.status(503).send({
      error: {
        message: err.message,
        type: 'provider_exhausted',
        code: 'free_quota_depleted',
      },
    });
  }
});

async function main() {
  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    app.log.info(`Free LLM Router running on port ${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
