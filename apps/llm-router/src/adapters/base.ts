import { ChatRequest, ChatResponse, ProviderAdapter } from '../types.js';
import { providers, resolveModel } from '../config.js';

export abstract class BaseAdapter implements ProviderAdapter {
  abstract id: string;
  abstract chat(request: ChatRequest, modelName: string): Promise<ChatResponse>;

  supportedModels(taskType?: string): string[] {
    const provider = providers.find((p) => p.id === this.id);
    if (!provider) return [];
    if (!taskType) return provider.models.map((m) => m.name);
    return provider.models.filter((m) => m.taskTypes.includes(taskType as any)).map((m) => m.name);
  }

  priority(modelName: string): number {
    const model = resolveModel(this.id, modelName);
    return model?.priority ?? 99;
  }

  protected createResponse(
    providerId: string,
    modelName: string,
    content: string,
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  ): ChatResponse {
    return {
      id: `chatcmpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: modelName,
      routed_via: providerId,
      cost_usd: 0,
      usage,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content },
          finish_reason: 'stop',
        },
      ],
    };
  }
}
