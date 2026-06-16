import { ChatRequest, ChatResponse, RoutingCandidate } from './types.js';
import { providers } from './config.js';
import { BaseAdapter } from './adapters/base.js';
import { GeminiAdapter } from './adapters/gemini.js';
import { GroqAdapter } from './adapters/groq.js';
import { CerebrasAdapter } from './adapters/cerebras.js';
import { OpenRouterAdapter } from './adapters/openrouter.js';
import { OllamaAdapter } from './adapters/ollama.js';
import { RateLimiter } from './rate-limit.js';
import { CircuitBreaker } from './circuit-breaker.js';
import * as cache from './cache.js';

export class LLMRouter {
  private adapters = new Map<string, BaseAdapter>();
  private rateLimiter = new RateLimiter();
  private circuitBreaker = new CircuitBreaker();

  constructor() {
    for (const provider of providers) {
      if (!provider.enabled) continue;
      switch (provider.id) {
        case 'gemini':
          this.adapters.set(provider.id, new GeminiAdapter());
          break;
        case 'groq':
          this.adapters.set(provider.id, new GroqAdapter());
          break;
        case 'cerebras':
          this.adapters.set(provider.id, new CerebrasAdapter());
          break;
        case 'openrouter':
          this.adapters.set(provider.id, new OpenRouterAdapter());
          break;
        case 'ollama':
          this.adapters.set(provider.id, new OllamaAdapter());
          break;
      }
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const taskType = request.task_type ?? 'chat';

    if (request.cache !== false) {
      const key = cache.cacheKey(request);
      const cached = await cache.get(key);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    const candidates = this.selectCandidates(request, taskType);

    const errors: string[] = [];
    for (const candidate of candidates) {
      const isOpen = await this.circuitBreaker.isOpen(candidate.id);
      if (isOpen) {
        errors.push(`${candidate.id} circuit open`);
        continue;
      }

      const canUse = await this.rateLimiter.canUse(candidate.id, candidate.model);
      if (!canUse) {
        errors.push(`${candidate.id}/${candidate.model} rate limited`);
        continue;
      }

      try {
        const response = await candidate.adapter.chat(request, candidate.model);
        await this.rateLimiter.recordUsage(candidate.id, candidate.model, response.usage);
        await this.circuitBreaker.recordSuccess(candidate.id);

        if (request.cache !== false) {
          await cache.set(cache.cacheKey(request), response, taskType);
        }

        return response;
      } catch (err: any) {
        await this.circuitBreaker.recordFailure(candidate.id);
        errors.push(`${candidate.id}: ${err.message}`);
      }
    }

    throw new Error(`All providers exhausted. Errors: ${errors.join('; ')}`);
  }

  listModels() {
    const result = [];
    for (const provider of providers) {
      if (!provider.enabled) continue;
      for (const model of provider.models) {
        result.push({
          id: `${provider.id}/${model.name}`,
          provider: provider.id,
          model: model.name,
          task_types: model.taskTypes,
          priority: model.priority,
        });
      }
    }
    return { models: result };
  }

  async usageSummary() {
    const summary: Record<string, any> = {};
    for (const provider of providers) {
      if (!provider.enabled) continue;
      for (const model of provider.models) {
        summary[`${provider.id}/${model.name}`] = await this.rateLimiter.remaining(
          provider.id,
          model.name
        );
      }
    }
    return summary;
  }

  private selectCandidates(request: ChatRequest, taskType: string): RoutingCandidate[] {
    const candidates: RoutingCandidate[] = [];

    for (const [providerId, adapter] of this.adapters) {
      const provider = providers.find((p) => p.id === providerId)!;
      for (const model of provider.models) {
        if (!model.taskTypes.includes(taskType as any)) continue;
        if (request.model !== 'auto' && request.model !== model.name && !model.aliases?.includes(request.model)) continue;
        if (request.fallback_policy === 'allow_local_only' && providerId !== 'ollama') continue;

        candidates.push({
          id: providerId,
          model: model.name,
          adapter,
          priority: model.priority,
        });
      }
    }

    return candidates.sort((a, b) => a.priority - b.priority);
  }
}
