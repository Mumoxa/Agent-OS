import { Agent, AgentManifest, AgentInput, AgentOutput, AgentContext, AgentEvent } from '../types.js';

export class EngineeringAgent implements Agent {
  constructor(public manifest: AgentManifest) {}

  async initialize(): Promise<void> {
    console.log(`[${this.manifest.agent_id}] Initialized`);
  }

  async run(input: AgentInput, context: AgentContext): Promise<AgentOutput> {
    context.log('Running Engineering Agent', { trigger: input.trigger });

    const event = input.event;
    let prdTitle = 'Feature';
    let prdContent = '';
    let issueNumber = 0;
    let workflowId: string | undefined;

    if (event?.topic === 'product.prd') {
      prdTitle = event.payload.title ?? 'Feature';
      prdContent = event.payload.content ?? '';
      issueNumber = event.payload.issue_number ?? 0;
      workflowId = event.payload.workflow_id;
    } else if (input.request) {
      prdTitle = input.request;
    }

    const branchName = `feature/${this.slugify(prdTitle)}-${Date.now()}`;

    // Create branch
    await context.tools.request('github.create_branch', {
      branch_name: branchName,
      from_branch: 'main',
    });

    // Generate implementation summary via LLM
    const llmResponse = await context.llm({
      messages: [
        { role: 'system', content: 'You are a senior engineer. Write a concise implementation plan and code outline.' },
        { role: 'user', content: `Implement this PRD:\n\n${prdContent}` },
      ],
      task_type: 'code',
    });

    const implementation = llmResponse.content;

    // Create PR
    const prResult = await context.tools.request('github.create_pr', {
      title: `Implement: ${prdTitle}`,
      body: `Closes #${issueNumber}\n\n${implementation}`,
      branch: branchName,
      base: 'main',
    });

    await context.memory.save({
      memory_type: 'output',
      content: implementation,
      importance: 0.8,
      source_event_id: event?.event_id,
    });

    return {
      summary: `PR created for ${prdTitle}`,
      content: implementation,
      events: [
        {
          event_id: `evt_${Date.now()}`,
          event_type: 'code.pr',
          topic: 'code.pr',
          source_agent_id: this.manifest.agent_id,
          org_id: context.org_id,
          correlation_id: context.run_id,
          timestamp: new Date().toISOString(),
          payload: {
            title: prdTitle,
            branch: branchName,
            pr_number: prResult.pr_number,
            issue_number: issueNumber,
            workflow_id: workflowId,
          },
        },
      ],
    };
  }

  async wake(event: AgentEvent): Promise<AgentInput | null> {
    if (this.manifest.subscribed_topics.includes(event.topic)) {
      return {
        trigger: 'event',
        event,
        request: 'Implement the PRD in the incoming event.',
      };
    }
    return null;
  }

  async sleep(): Promise<void> {
    console.log(`[${this.manifest.agent_id}] Sleeping`);
  }

  async shutdown(): Promise<void> {
    console.log(`[${this.manifest.agent_id}] Shutdown`);
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
  }
}
