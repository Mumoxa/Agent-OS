import { Redis } from 'ioredis';
import { config } from './config.js';

const redis = new Redis(config.REDIS_URL);
const FAILURE_THRESHOLD = 3;
const FAILURE_WINDOW_SECONDS = 60;
const OPEN_DURATION_SECONDS = 300;

export class CircuitBreaker {
  async isOpen(providerId: string): Promise<boolean> {
    const openKey = `llm_router:circuit:${providerId}:open`;
    const open = await redis.get(openKey);
    if (open) return true;
    return false;
  }

  async recordFailure(providerId: string): Promise<void> {
    const failuresKey = `llm_router:circuit:${providerId}:failures`;
    const openKey = `llm_router:circuit:${providerId}:open`;

    const count = await redis.incr(failuresKey);
    await redis.expire(failuresKey, FAILURE_WINDOW_SECONDS);

    if (count >= FAILURE_THRESHOLD) {
      await redis.setex(openKey, OPEN_DURATION_SECONDS, '1');
    }
  }

  async recordSuccess(providerId: string): Promise<void> {
    const failuresKey = `llm_router:circuit:${providerId}:failures`;
    await redis.del(failuresKey);
  }
}
