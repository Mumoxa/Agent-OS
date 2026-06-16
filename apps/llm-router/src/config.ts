import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform(Number),
  REDIS_URL: z.string().default('redis://redis:6379'),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  CEREBRAS_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OLLAMA_URL: z.string().default('http://ollama:11434'),
});

export const config = envSchema.parse(process.env);

export interface ProviderModelConfig {
  id: string;
  displayName: string;
  baseUrl: string;
  apiKey: string | undefined;
  enabled: boolean;
  models: ModelConfig[];
}

export interface ModelConfig {
  name: string;
  aliases?: string[];
  taskTypes: TaskType[];
  priority: number;
  maxTokens: number;
  quotas: Quotas;
  costPer1kInput: number;
  costPer1kOutput: number;
}

export interface Quotas {
  requestsPerDay?: number;
  requestsPerMinute?: number;
  tokensPerMinute?: number;
  tokensPerDay?: number;
}

export type TaskType = 'summary' | 'chat' | 'code' | 'reasoning' | 'creative' | 'offline';

export const providers: ProviderModelConfig[] = [
  {
    id: 'gemini',
    displayName: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: config.GEMINI_API_KEY,
    enabled: !!config.GEMINI_API_KEY,
    models: [
      {
        name: 'gemini-2.5-flash',
        aliases: ['gemini-flash'],
        taskTypes: ['summary', 'chat', 'creative', 'reasoning'],
        priority: 1,
        maxTokens: 8192,
        quotas: { requestsPerDay: 1500, requestsPerMinute: 10 },
        costPer1kInput: 0,
        costPer1kOutput: 0,
      },
    ],
  },
  {
    id: 'groq',
    displayName: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: config.GROQ_API_KEY,
    enabled: !!config.GROQ_API_KEY,
    models: [
      {
        name: 'llama-3.1-70b-versatile',
        aliases: ['llama-3.1-70b'],
        taskTypes: ['code', 'reasoning', 'chat'],
        priority: 2,
        maxTokens: 4096,
        quotas: { requestsPerDay: 1000, requestsPerMinute: 30, tokensPerMinute: 6000 },
        costPer1kInput: 0,
        costPer1kOutput: 0,
      },
      {
        name: 'llama-3.1-8b-instant',
        aliases: ['llama-3.1-8b'],
        taskTypes: ['summary', 'chat'],
        priority: 3,
        maxTokens: 4096,
        quotas: { requestsPerDay: 1000, requestsPerMinute: 30 },
        costPer1kInput: 0,
        costPer1kOutput: 0,
      },
    ],
  },
  {
    id: 'cerebras',
    displayName: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    apiKey: config.CEREBRAS_API_KEY,
    enabled: !!config.CEREBRAS_API_KEY,
    models: [
      {
        name: 'llama3.1-70b',
        aliases: ['cerebras-llama-70b'],
        taskTypes: ['reasoning', 'code'],
        priority: 4,
        maxTokens: 4096,
        quotas: { requestsPerDay: 1000, requestsPerMinute: 30, tokensPerDay: 1000000 },
        costPer1kInput: 0,
        costPer1kOutput: 0,
      },
    ],
  },
  {
    id: 'openrouter',
    displayName: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: config.OPENROUTER_API_KEY,
    enabled: !!config.OPENROUTER_API_KEY,
    models: [
      {
        name: 'google/gemini-2.5-flash-exp:free',
        aliases: ['openrouter-gemini-flash'],
        taskTypes: ['summary', 'chat'],
        priority: 5,
        maxTokens: 4096,
        quotas: { requestsPerDay: 200 },
        costPer1kInput: 0,
        costPer1kOutput: 0,
      },
    ],
  },
  {
    id: 'ollama',
    displayName: 'Ollama Local',
    baseUrl: config.OLLAMA_URL,
    apiKey: 'ollama',
    enabled: true,
    models: [
      {
        name: 'llama3.2',
        aliases: ['ollama-llama3.2'],
        taskTypes: ['summary', 'chat', 'creative'],
        priority: 10,
        maxTokens: 4096,
        quotas: {},
        costPer1kInput: 0,
        costPer1kOutput: 0,
      },
      {
        name: 'qwen2.5:7b',
        aliases: ['ollama-qwen'],
        taskTypes: ['code', 'reasoning', 'chat'],
        priority: 11,
        maxTokens: 4096,
        quotas: {},
        costPer1kInput: 0,
        costPer1kOutput: 0,
      },
    ],
  },
];

export function resolveModel(providerId: string, modelName: string): ModelConfig | undefined {
  const provider = providers.find((p) => p.id === providerId);
  return provider?.models.find(
    (m) => m.name === modelName || m.aliases?.includes(modelName)
  );
}
