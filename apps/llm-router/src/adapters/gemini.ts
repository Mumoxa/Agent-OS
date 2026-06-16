import { BaseAdapter } from './base.js';
import { ChatRequest, ChatResponse } from '../types.js';
import { config, providers } from '../config.js';

export class GeminiAdapter extends BaseAdapter {
  id = 'gemini';

  async chat(request: ChatRequest, modelName: string): Promise<ChatResponse> {
    if (!config.GEMINI_API_KEY) throw new Error('Gemini API key not configured');

    const contents = request.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const systemInstruction = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => ({ parts: [{ text: m.content }] }));

    const url = `${providers[0].baseUrl}/${modelName}:generateContent?key=${config.GEMINI_API_KEY}`;

    const body: any = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.max_tokens ?? 2048,
        topP: request.top_p ?? 1.0,
      },
    };
    if (systemInstruction.length > 0) {
      body.systemInstruction = systemInstruction[0];
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini error ${response.status}: ${text}`);
    }

    const data = await response.json() as any;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const promptTokens = this.estimateTokens(request.messages);
    const completionTokens = this.estimateTokens([{ content }]);

    return this.createResponse(
      this.id,
      modelName,
      content,
      {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      }
    );
  }

  private estimateTokens(messages: { content: string }[]): number {
    return messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0);
  }
}
