import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { randomUUID } from 'crypto';
import { AgentManifest, Agent, AgentInput, AgentOutput, AgentEvent, AgentContext } from './types.js';
import { ManifestLoader } from './ManifestLoader.js';
import {
  FounderCoSAgent,
  ProductManagerAgent,
  EngineeringAgent,
  QAAgent,
  DevOpsAgent,
  SecurityAgent,
} from './agents/index.js';
import { SecurityMonitor } from './security/SecurityMonitor.js';
import { ToolRegistry, ToolContext } from './tools/ToolRegistry.js';
import { registerGitHubTools } from './tools/github.js';
import { registerDeployTools } from './tools/deploy.js';
import { registerTestTools } from './tools/test.js';

interface RuntimeConfig {
  redisUrl: string;
  llmRouterUrl: string;
  orgId: string;
  manifestsDir: string;
}

export class AgentRuntime {
  private redis: IORedis;
  private queue: Queue;
  private worker?: Worker;
  private agents = new Map<string, Agent>();
  private manifests = new Map<string, AgentManifest>();
  private manifestLoader: ManifestLoader;
  private securityMonitor: SecurityMonitor;
  private toolRegistry: ToolRegistry;

  constructor(private config: RuntimeConfig) {
    this.redis = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });
    this.queue = new Queue('agent-runs', { connection: this.redis });
    this.manifestLoader = new ManifestLoader(config.manifestsDir);
    this.securityMonitor = new SecurityMonitor({
      redisUrl: config.redisUrl,
      orgId: config.orgId,
      llmRouterUrl: config.llmRouterUrl,
    });
    this.toolRegistry = new ToolRegistry();
    registerGitHubTools(this.toolRegistry);
    registerDeployTools(this.toolRegistry);
    registerTestTools(this.toolRegistry);
  }

  async initialize(): Promise<void> {
    this.manifests = await this.manifestLoader.loadAll();

    for (const [agentId, manifest] of this.manifests) {
      const agent = this.createAgentInstance(manifest);
      if (agent) {
        await agent.initialize();
        this.agents.set(agentId, agent);
        console.log(`Agent initialized: ${manifest.name} (${agentId})`);
      }
    }

    this.worker = new Worker(
      'agent-runs',
      async (job) => {
        const { agent_id, input, run_id } = job.data;
        await this.executeAgent(agent_id, input, run_id);
      },
      { connection: this.redis }
    );

    this.startScheduler();
    await this.securityMonitor.initialize();
  }

  async runAgent(agentId: string, input: AgentInput): Promise<string> {
    const runId = randomUUID();
    await this.queue.add(
      'agent-run',
      { agent_id: agentId, input, run_id: runId },
      { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
    );
    return runId;
  }

  async wakeAgent(agentId: string, event: AgentEvent): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const input = await agent.wake(event);
    if (input) {
      await this.runAgent(agentId, { ...input, trigger: 'wake', event });
    }
  }

  async executeAgent(agentId: string, input: AgentInput, runId: string): Promise<AgentOutput> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    const manifest = agent.manifest;
    const context = this.createContext(manifest, runId);

    await this.publishEvent({
      event_type: 'agent.run.started',
      topic: 'agent.lifecycle',
      source_agent_id: agentId,
      org_id: this.config.orgId,
      correlation_id: runId,
      payload: { agent_id: agentId, run_id: runId, trigger: input.trigger },
    });

    try {
      const output = await agent.run(input, context);

      await this.publishEvent({
        event_type: 'agent.run.completed',
        topic: 'agent.lifecycle',
        source_agent_id: agentId,
        org_id: this.config.orgId,
        correlation_id: runId,
        payload: {
          agent_id: agentId,
          run_id: runId,
          status: 'success',
          summary: output.summary,
        },
      });

      if (output.approval_requests) {
        for (const approval of output.approval_requests) {
          await this.publishEvent({
            event_type: 'agent.approval.requested',
            topic: 'agent.approval_request',
            source_agent_id: agentId,
            org_id: this.config.orgId,
            correlation_id: runId,
            payload: approval,
          });
        }
      }

      if (output.events) {
        for (const event of output.events) {
          await this.publishEvent({
            event_type: event.event_type,
            topic: event.topic,
            source_agent_id: event.source_agent_id,
            org_id: event.org_id,
            correlation_id: event.correlation_id,
            payload: event.payload,
          });
          await this.dispatchEvent(event);
        }
      }

      return output;
    } catch (err: any) {
      await this.publishEvent({
        event_type: 'agent.run.failed',
        topic: 'agent.lifecycle',
        source_agent_id: agentId,
        org_id: this.config.orgId,
        correlation_id: runId,
        payload: {
          agent_id: agentId,
          run_id: runId,
          error: err.message,
        },
      });
      throw err;
    }
  }

  async shutdown(): Promise<void> {
    for (const agent of this.agents.values()) {
      await agent.shutdown();
    }
    await this.securityMonitor.shutdown();
    await this.worker?.close();
    await this.queue.close();
    await this.redis.quit();
  }

  private createAgentInstance(manifest: AgentManifest): Agent | null {
    switch (manifest.agent_id) {
      case 'founder_chief_of_staff':
        return new FounderCoSAgent(manifest);
      case 'product_manager':
        return new ProductManagerAgent(manifest);
      case 'engineering':
        return new EngineeringAgent(manifest);
      case 'qa':
        return new QAAgent(manifest);
      case 'devops':
        return new DevOpsAgent(manifest);
      case 'security_audit':
        return new SecurityAgent(manifest);
      default:
        return null;
    }
  }

  private createContext(manifest: AgentManifest, runId: string): AgentContext {
    return {
      org_id: this.config.orgId,
      agent_id: manifest.agent_id,
      run_id: runId,
      manifest,
      llm: async (request) => {
        const response = await fetch(`${this.config.llmRouterUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: request.model ?? 'auto',
            messages: request.messages,
            task_type: request.task_type ?? manifest.llm.task_type,
            agent_id: manifest.agent_id,
            org_id: this.config.orgId,
          }),
        });
        if (!response.ok) throw new Error(`LLM router error: ${response.status}`);
        const data = await response.json();
        return { content: data.choices[0]?.message?.content ?? '', usage: data.usage };
      },
      memory: {
        save: async (memory) => {
          await this.publishEvent({
            event_type: 'knowledge.memory.stored',
            topic: 'knowledge.change',
            source_agent_id: manifest.agent_id,
            org_id: this.config.orgId,
            correlation_id: runId,
            payload: memory,
          });
        },
        retrieve: async (_query) => {
          // TODO: query memory API
          return [];
        },
      },
      events: {
        publish: async (event) => this.publishEvent(event),
        subscribe: (topic, handler) => {
          // TODO: Redis pub/sub subscription
          console.log(`Subscribed to ${topic}`, handler);
        },
      },
      tools: {
        request: async (toolName, args) => {
          await this.publishEvent({
            event_type: 'agent.tool.requested',
            topic: 'agent.tool_request',
            source_agent_id: manifest.agent_id,
            org_id: this.config.orgId,
            correlation_id: runId,
            payload: { tool_name: toolName, arguments: args },
          });

          const toolContext: ToolContext = {
            agent_id: manifest.agent_id,
            org_id: this.config.orgId,
            run_id: runId,
            log: (message) => console.log(`[tool:${toolName}] ${message}`),
          };

          return this.toolRegistry.execute(toolName, args, toolContext);
        },
      },
      log: (message, meta) => {
        console.log(`[${manifest.agent_id}] ${message}`, meta ?? {});
      },
    };
  }

  private async publishEvent(
    event: Omit<AgentEvent, 'event_id' | 'timestamp'>
  ): Promise<void> {
    const fullEvent: AgentEvent = {
      ...event,
      event_id: randomUUID(),
      timestamp: new Date().toISOString(),
    };
    await this.redis.xadd(event.topic, '*', 'payload', JSON.stringify(fullEvent));
  }

  private async dispatchEvent(event: AgentEvent): Promise<void> {
    for (const [agentId, manifest] of this.manifests) {
      if (agentId === event.source_agent_id) continue;
      if (manifest.subscribed_topics.includes(event.topic)) {
        await this.wakeAgent(agentId, event);
      }
    }
  }

  private startScheduler(): void {
    // Basic scheduler: wake agents periodically based on wake_interval_minutes
    setInterval(async () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      for (const [agentId, manifest] of this.manifests) {
        const interval = manifest.sleep_cycle.wake_interval_minutes ?? 15;
        if (minute % interval === 0) {
          const agent = this.agents.get(agentId);
          if (!agent) continue;
          if (manifest.sleep_cycle.deep_sleep_start && manifest.sleep_cycle.deep_sleep_end) {
            const start = manifest.sleep_cycle.deep_sleep_start;
            const end = manifest.sleep_cycle.deep_sleep_end;
            if (this.isBetween(timeStr, start, end)) continue;
          }
          await this.runAgent(agentId, { trigger: 'scheduled' });
        }
      }
    }, 60_000);
  }

  private isBetween(time: string, start: string, end: string): boolean {
    if (start < end) return time >= start && time <= end;
    return time >= start || time <= end;
  }
}
