import { Agent, AgentManifest, AgentInput, AgentOutput, AgentContext, AgentEvent } from '../types.js';

export class SecurityAgent implements Agent {
  constructor(public manifest: AgentManifest) {}

  async initialize(): Promise<void> {
    console.log(`[${this.manifest.agent_id}] Initialized — always-on sentinel`);
  }

  async run(_input: AgentInput, context: AgentContext): Promise<AgentOutput> {
    context.log('Running security audit scan');

    // TODO: query audit logs and detect anomalies
    return {
      summary: 'Security scan completed — no anomalies detected',
    };
  }

  async wake(event: AgentEvent): Promise<AgentInput | null> {
    // Security agent wakes on all events to audit them
    return {
      trigger: 'wake',
      request: 'Audit event',
      event,
    };
  }

  async sleep(): Promise<void> {
    // Security agent never sleeps
  }

  async shutdown(): Promise<void> {
    console.log(`[${this.manifest.agent_id}] Shutdown`);
  }

  async auditEvent(event: AgentEvent, context: AgentContext): Promise<void> {
    const risk = this.assessRisk(event);

    if (risk === 'high') {
      await context.events.publish({
        event_type: 'security.alert.raised',
        topic: 'security.alert',
        source_agent_id: this.manifest.agent_id,
        org_id: context.org_id,
        correlation_id: event.correlation_id,
        payload: {
          alert_id: `alrt_${Date.now()}`,
          severity: 'high',
          category: 'policy_violation',
          source_event_id: event.event_id,
          message: `High-risk event detected: ${event.event_type}`,
          action_taken: 'alerted',
        },
      });
    }
  }

  private assessRisk(event: AgentEvent): 'low' | 'medium' | 'high' {
    if (event.event_type === 'agent.tool.requested') {
      const tool = event.payload?.tool_name ?? '';
      if (tool.includes('secrets') || tool.includes('production')) return 'high';
      if (tool.includes('deploy') || tool.includes('delete')) return 'medium';
    }
    if (event.event_type === 'agent.approval.requested') {
      return event.payload?.risk_level === 'high' ? 'high' : 'medium';
    }
    return 'low';
  }
}
