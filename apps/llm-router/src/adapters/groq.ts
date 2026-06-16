import { BaseAdapter } from './base.js';
import { ChatRequest, ChatResponse } from '../types.js';
import { config } from '../config.js';

export class GroqAdapter extends BaseAdapter {
  id = 'groq';

  async chat(request: ChatRequest, modelName: string): Promise<ChatResponse> {
    if (!config.GROQ_API_KEY) throw new Error('Groq API key not configured');

    const response = await fetch(`${config.providers[1].baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.GROQ_API_KEY}`,
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
      throw new Error(`Groq error ${response.status}: ${text}`);
    }

    const data = await response.json();
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
