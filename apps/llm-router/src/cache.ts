import { Redis } from 'ioredis';
import { config } from './config.js';
import { ChatRequest, ChatResponse } from './types.js';
import crypto from 'crypto';

const redis = new Redis(config.REDIS_URL);

const TTL_SECONDS: Record<string, number> = {
  summary: 3600,
  chat: 300,
  code: 86400,
  reasoning: 3600,
  creative: 3600,
  offline: 1800,
};

export function cacheKey(request: ChatRequest): string {
  const normalized = {
    model: request.model,
    messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: request.temperature ?? 0.7,
    max_tokens: request.max_tokens,
    top_p: request.top_p ?? 1.0,
  };
  const hash = crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
  return `llm_router:cache:${hash}`;
}

export async function get(key: string): Promise<ChatResponse | null> {
  const value = await redis.get(key);
  if (!value) return null;
  return JSON.parse(value) as ChatResponse;
}

export async function set(key: string, response: ChatResponse, taskType?: string): Promise<void> {
  const ttl = TTL_SECONDS[taskType ?? 'chat'] ?? 300;
  await redis.setex(key, ttl, JSON.stringify(response));
}

export function ttl(taskType?: string): number {
  return TTL_SECONDS[taskType ?? 'chat'] ?? 300;
}
