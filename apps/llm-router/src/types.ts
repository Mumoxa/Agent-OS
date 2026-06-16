export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  agent_id?: string;
  org_id?: string;
  task_type?: 'summary' | 'chat' | 'code' | 'reasoning' | 'creative' | 'offline';
  fallback_policy?: 'free_only' | 'allow_local_only' | 'allow_paid';
  cache?: boolean;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  routed_via: string;
  cost_usd: number;
  cached?: boolean;
  usage: TokenUsage;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
}

export interface ProviderAdapter {
  id: string;
  chat(request: ChatRequest, modelName: string): Promise<ChatResponse>;
  supportedModels(taskType?: string): string[];
  priority(modelName: string): number;
}

export interface RoutingCandidate {
  id: string;
  model: string;
  adapter: ProviderAdapter;
  priority: number;
}
