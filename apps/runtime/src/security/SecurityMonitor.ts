import { Redis } from 'ioredis';
import { AgentEvent, AgentContext } from '../types.js';
import { SecurityAgent } from '../agents/SecurityAgent.js';

interface SecurityMonitorConfig {
  redisUrl: string;
  orgId: string;
  llmRouterUrl: string;
}

export class SecurityMonitor {
  private redis: Redis;
  private securityAgent: SecurityAgent;
  private running = false;

  constructor(private config: SecurityMonitorConfig) {
    this.redis = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
    this.securityAgent = new SecurityAgent({
      agent_id: 'security_audit',
      name: 'Security / Audit',
      version: '1.0',
      purpose: 'Monitors all events and enforces policies.',
      inputs: [],
      outputs: [],
      tools: [],
      memory: { read: [], write: [] },
      permissions: [],
      tasks_autonomous: [],
      tasks_approval: [],
      sleep_cycle: { mode: 'continuous', schedule: 'always-on', emergency_topics: [] },
      failure_modes: [],
      llm: { default_model: 'gemini-2.5-pro', fallback_model: 'llama-3.1-70b', task_type: 'reasoning' },
      subscribed_topics: [],
      published_topics: [],
    });
  }

  async initialize(): Promise<void> {
    await this.securityAgent.initialize();
    this.running = true;
    this.startMonitoring();
  }

  async shutdown(): Promise<void> {
    this.running = false;
    await this.securityAgent.shutdown();
    await this.redis.quit();
  }

  private async startMonitoring(): Promise<void> {
    const topics = [
      'agent.lifecycle',
      'agent.tool_request',
      'agent.approval_request',
      'user.action',
      'knowledge.change',
    ];

    for (const topic of topics) {
      this.monitorTopic(topic);
    }
  }

  private async monitorTopic(topic: string): Promise<void> {
    while (this.running) {
      try {
        const result = await this.redis.xread('COUNT', 1, 'BLOCK', 5000, 'STREAMS', topic, '$');
        if (!result) continue;

        for (const [, messages] of result) {
          for (const [, fields] of messages) {
            const payloadIndex = fields.indexOf('payload');
            const payload = payloadIndex === -1 ? null : fields[payloadIndex + 1];
            if (!payload) continue;

            const event = JSON.parse(payload) as AgentEvent;
            if (event.org_id !== this.config.orgId) continue;

            await this.auditEvent(event);
            await this.evaluatePolicies(event);
            await this.securityAgent.auditEvent(event, this.createContext(event));
          }
        }
      } catch (err) {
        console.error(`Security monitor error on ${topic}:`, err);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  private async auditEvent(event: AgentEvent): Promise<void> {
    const auditEntry = {
      event_id: event.event_id,
      timestamp: event.timestamp,
      actor: event.source_agent_id,
      action: event.event_type,
      topic: event.topic,
      correlation_id: event.correlation_id,
      org_id: event.org_id,
      payload_hash: await this.hash(JSON.stringify(event.payload)),
    };

    await this.redis.xadd('security.audit.log', '*', 'payload', JSON.stringify(auditEntry));
  }

  private async evaluatePolicies(event: AgentEvent): Promise<void> {
    const policies = [
      {
        id: 'no_prod_deploy_without_qa',
        check: () =>
          event.event_type === 'agent.tool.requested' &&
          event.payload?.tool_name?.includes('deploy.production') &&
          !event.payload?.qa_approved,
        severity: 'high',
        action: 'block',
      },
      {
        id: 'no_secret_read',
        check: () =>
          event.event_type === 'agent.tool.requested' &&
          event.payload?.tool_name?.includes('secrets.read'),
        severity: 'high',
        action: 'block',
      },
      {
        id: 'spend_limit',
        check: () =>
          event.event_type === 'agent.approval.requested' &&
          event.payload?.estimated_cost_usd > 1000,
        severity: 'medium',
        action: 'require_approval',
      },
    ];

    for (const policy of policies) {
      if (policy.check()) {
        await this.redis.xadd('security.alert', '*', 'payload', JSON.stringify({
          alert_id: `alrt_${Date.now()}`,
          severity: policy.severity,
          category: 'policy_violation',
          policy_id: policy.id,
          source_event_id: event.event_id,
          action: policy.action,
          org_id: event.org_id,
        }));
      }
    }
  }

  private async hash(input: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  private createContext(event: AgentEvent): AgentContext {
    return {
      org_id: this.config.orgId,
      agent_id: 'security_audit',
      run_id: event.correlation_id,
      manifest: this.securityAgent.manifest,
      memory: {
        save: async () => {},
        retrieve: async () => [],
      },
      tools: {
        request: async () => ({ status: 'noop' }),
      },
      llm: async (req: any) => {
        const response = await fetch(`${this.config.llmRouterUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'auto',
            messages: req.messages,
            task_type: 'reasoning',
            agent_id: 'security_audit',
            org_id: this.config.orgId,
          }),
        });
        const data = await response.json() as any;
        return { content: data.choices[0]?.message?.content ?? '', usage: data.usage };
      },
      events: {
        publish: async (e: Omit<AgentEvent, 'event_id' | 'timestamp'>) => {
          await this.redis.xadd(e.topic, '*', 'payload', JSON.stringify(e));
        },
        subscribe: (topic, handler) => {
          console.log(`Security monitor subscribed to ${topic}`, handler);
        },
      },
      log: (msg: string) => console.log(`[SecurityMonitor] ${msg}`),
    };
  }
}
