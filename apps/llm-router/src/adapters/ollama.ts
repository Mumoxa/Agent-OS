import { BaseAdapter } from './base.js';
import { ChatRequest, ChatResponse } from '../types.js';
import { config } from '../config.js';

export class OllamaAdapter extends BaseAdapter {
  id = 'ollama';

  async chat(request: ChatRequest, modelName: string): Promise<ChatResponse> {
    const baseUrl = config.OLLAMA_URL;

    // Ensure model is pulled (best-effort; may fail if model unavailable)
    await fetch(`${baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
    }).catch(() => {
      // Model may already be pulled; ignore errors
    });

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      throw new Error(`Ollama error ${response.status}: ${text}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      object: 'chat.completion',
      created: data.created,
      model: data.model,
      routed_via: this.id,
      cost_usd: 0,
      local: true,
      usage: data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      choices: data.choices,
    };
  }
}
