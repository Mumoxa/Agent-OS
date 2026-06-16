

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface AgentManifest {
  agent_id: string;
  name: string;
  version: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  tools: string[];
  memory: {
    read: string[];
    write: string[];
  };
  permissions: string[];
  tasks_autonomous: string[];
  tasks_approval: string[];
  sleep_cycle: {
    mode: 'continuous' | 'scheduled' | 'event_driven';
    schedule: string;
    deep_sleep_start?: string;
    deep_sleep_end?: string;
    wake_interval_minutes?: number;
    emergency_topics: string[];
  };
  failure_modes: Array<{ name: string; mitigation: string }>;
  llm: {
    default_model: string;
    fallback_model: string;
    task_type: string;
  };
  subscribed_topics: string[];
  published_topics: string[];
}

export interface AgentInput {
  trigger: 'manual' | 'scheduled' | 'event' | 'wake';
  request?: string;
  event?: AgentEvent;
  context?: Record<string, any>;
  workflow_id?: string;
}

export interface AgentOutput {
  summary: string;
  content?: string;
  decisions?: AgentDecision[];
  approval_requests?: AgentApprovalRequest[];
  tool_requests?: AgentToolRequest[];
  events?: AgentEvent[];
  memories?: AgentMemory[];
}

export interface AgentDecision {
  decision_id: string;
  title: string;
  rationale: string;
  requires_approval: boolean;
}

export interface AgentApprovalRequest {
  approval_id: string;
  title: string;
  description: string;
  risk_level: 'low' | 'medium' | 'high';
  requested_action: { tool_name: string; arguments: Record<string, any> };
}

export interface AgentToolRequest {
  tool_request_id: string;
  tool_name: string;
  arguments: Record<string, any>;
}

export interface AgentMemory {
  memory_type: 'observation' | 'output' | 'conversation';
  content: string;
  importance: number;
  source_event_id?: string;
}

export interface AgentEvent {
  event_id: string;
  event_type: string;
  topic: string;
  payload: Record<string, any>;
  source_agent_id: string;
  org_id: string;
  correlation_id: string;
  timestamp: string;
}

export interface Agent {
  manifest: AgentManifest;
  initialize(): Promise<void>;
  run(input: AgentInput, context: AgentContext): Promise<AgentOutput>;
  wake(event: AgentEvent): Promise<AgentInput | null>;
  sleep(): Promise<void>;
  shutdown(): Promise<void>;
}

export interface AgentContext {
  org_id: string;
  agent_id: string;
  run_id: string;
  manifest: AgentManifest;
  llm: (request: {
    model?: string;
    messages: ChatMessage[];
    task_type?: string;
  }) => Promise<{ content: string; usage: any }>;
  memory: {
    save: (memory: AgentMemory) => Promise<void>;
    retrieve: (query: string, topK?: number) => Promise<AgentMemory[]>;
  };
  events: {
    publish: (event: Omit<AgentEvent, 'event_id' | 'timestamp'>) => Promise<void>;
    subscribe: (topic: string, handler: (event: AgentEvent) => void) => void;
  };
  tools: {
    request: (toolName: string, args: Record<string, any>) => Promise<any>;
  };
  log: (message: string, meta?: Record<string, any>) => void;
}
