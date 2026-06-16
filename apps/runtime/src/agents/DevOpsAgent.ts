import { Agent, AgentManifest, AgentInput, AgentOutput, AgentContext, AgentEvent } from '../types.js';

export class DevOpsAgent implements Agent {
  constructor(public manifest: AgentManifest) {}

  async initialize(): Promise<void> {
    console.log(`[${this.manifest.agent_id}] Initialized`);
  }

  async run(input: AgentInput, context: AgentContext): Promise<AgentOutput> {
    context.log('Running DevOps Agent', { trigger: input.trigger });

    const event = input.event;
    let prNumber = 0;
    let branch = 'main';
    let releaseReady = false;
    let workflowId: string | undefined;

    if (event?.topic === 'qa.review') {
      prNumber = event.payload.pr_number ?? 0;
      branch = event.payload.branch ?? 'main';
      releaseReady = event.payload.release_ready ?? false;
      workflowId = event.payload.workflow_id;
    }

    if (!releaseReady) {
      return {
        summary: `PR #${prNumber} not ready for staging deploy`,
        content: 'QA review marked release as not ready. Skipping deployment.',
      };
    }

    // Deploy to staging
    const deployResult = await context.tools.request('deploy.staging', {
      pr_number: prNumber,
      branch,
    });

    // Run smoke tests
    const smokeResult = await context.tools.request('smoke.test', {
      deployment_url: deployResult.url,
    });

    await context.memory.save({
      memory_type: 'output',
      content: `Deployed PR #${prNumber} to staging: ${deployResult.url}. Smoke tests: ${smokeResult.passed ? 'passed' : 'failed'}`,
      importance: 0.85,
      source_event_id: event?.event_id,
    });

    return {
      summary: `PR #${prNumber} deployed to staging`,
      content: `Deployment URL: ${deployResult.url}`,
      events: [
        {
          event_id: `evt_${Date.now()}`,
          event_type: 'deploy.staging',
          topic: 'deploy.staging',
          source_agent_id: this.manifest.agent_id,
          org_id: context.org_id,
          correlation_id: context.run_id,
          timestamp: new Date().toISOString(),
          payload: {
            pr_number: prNumber,
            branch,
            deployment_url: deployResult.url,
            smoke_tests: smokeResult,
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
        request: 'Deploy to staging if QA approved.',
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
}
