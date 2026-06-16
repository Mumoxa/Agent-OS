import { BaseAdapter } from './base.js';
import { ChatRequest, ChatResponse } from '../types.js';
import { config, providers } from '../config.js';

export class CerebrasAdapter extends BaseAdapter {
  id = 'cerebras';

  async chat(request: ChatRequest, modelName: string): Promise<ChatResponse> {
    if (!config.CEREBRAS_API_KEY) throw new Error('Cerebras API key not configured');

    const response = await fetch(`${providers[2].baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 2048,
        top_p: request.top_p ?? 1.0,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Cerebras error ${response.status}: ${text}`);
    }

    const data = await response.json() as any;
    return {
      id: data.id,
      object: 'chat.completion',
      created: data.created,
      model: data.model,
      routed_via: this.id,
      cost_usd: 0,
      usage: data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      choices: data.choices,
    };
  }
}
