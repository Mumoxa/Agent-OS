import { Redis } from 'ioredis';
import { config } from './config.js';
import { providers } from './config.js';

const redis = new Redis(config.REDIS_URL);

export class RateLimiter {
  async canUse(providerId: string, modelName: string): Promise<boolean> {
    const model = providers
      .find((p) => p.id === providerId)
      ?.models.find((m) => m.name === modelName || m.aliases?.includes(modelName));
    if (!model) return false;

    const quotas = model.quotas;
    if (!quotas || Object.keys(quotas).length === 0) return true; // Local Ollama has no quotas

    const dayKey = `llm_router:${providerId}:${modelName}:requests_day`;
    const minKey = `llm_router:${providerId}:${modelName}:requests_min`;
    const tpmKey = `llm_router:${providerId}:${modelName}:tokens_min`;
    const dayTokensKey = `llm_router:${providerId}:${modelName}:tokens_day`;

    const [dayCount, minCount, tokenMinuteCount, tokenDayCount] = await Promise.all([
      redis.get(dayKey).then((v: string | null) => Number(v ?? 0)),
      redis.get(minKey).then((v: string | null) => Number(v ?? 0)),
      redis.get(tpmKey).then((v: string | null) => Number(v ?? 0)),
      redis.get(dayTokensKey).then((v: string | null) => Number(v ?? 0)),
    ]);

    if (quotas.requestsPerDay && dayCount >= quotas.requestsPerDay) return false;
    if (quotas.requestsPerMinute && minCount >= quotas.requestsPerMinute) return false;
    if (quotas.tokensPerMinute && tokenMinuteCount >= quotas.tokensPerMinute) return false;
    if (quotas.tokensPerDay && tokenDayCount >= quotas.tokensPerDay) return false;

    return true;
  }

  async recordUsage(providerId: string, modelName: string, usage: { total_tokens: number }): Promise<void> {
    const quotas = providers
      .find((p) => p.id === providerId)
      ?.models.find((m) => m.name === modelName || m.aliases?.includes(modelName))?.quotas;

    const dayKey = `llm_router:${providerId}:${modelName}:requests_day`;
    const minKey = `llm_router:${providerId}:${modelName}:requests_min`;
    const tpmKey = `llm_router:${providerId}:${modelName}:tokens_min`;
    const dayTokensKey = `llm_router:${providerId}:${modelName}:tokens_day`;

    const pipeline = redis.pipeline();
    pipeline.incr(dayKey).expire(dayKey, 86400);
    pipeline.incr(minKey).expire(minKey, 60);
    if (quotas?.tokensPerMinute) {
      pipeline.incrby(tpmKey, usage.total_tokens).expire(tpmKey, 60);
    }
    if (quotas?.tokensPerDay) {
      pipeline.incrby(dayTokensKey, usage.total_tokens).expire(dayTokensKey, 86400);
    }
    await pipeline.exec();
  }

  async remaining(providerId: string, modelName: string): Promise<Record<string, number>> {
    const model = providers
      .find((p) => p.id === providerId)
      ?.models.find((m) => m.name === modelName || m.aliases?.includes(modelName));
    const quotas = model?.quotas ?? {};

    const keys = [
      `llm_router:${providerId}:${modelName}:requests_day`,
      `llm_router:${providerId}:${modelName}:requests_min`,
      `llm_router:${providerId}:${modelName}:tokens_min`,
      `llm_router:${providerId}:${modelName}:tokens_day`,
    ];
    const values = await redis.mget(...keys);

    return {
      requestsPerDay: Math.max(0, (quotas.requestsPerDay ?? Infinity) - Number(values[0] ?? 0)),
      requestsPerMinute: Math.max(0, (quotas.requestsPerMinute ?? Infinity) - Number(values[1] ?? 0)),
      tokensPerMinute: Math.max(0, (quotas.tokensPerMinute ?? Infinity) - Number(values[2] ?? 0)),
      tokensPerDay: Math.max(0, (quotas.tokensPerDay ?? Infinity) - Number(values[3] ?? 0)),
    };
  }
}
