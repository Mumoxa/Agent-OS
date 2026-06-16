import { Agent, AgentManifest, AgentInput, AgentOutput, AgentContext, AgentEvent } from '../types.js';

export class QAAgent implements Agent {
  constructor(public manifest: AgentManifest) {}

  async initialize(): Promise<void> {
    console.log(`[${this.manifest.agent_id}] Initialized`);
  }

  async run(input: AgentInput, context: AgentContext): Promise<AgentOutput> {
    context.log('Running QA Agent', { trigger: input.trigger });

    const event = input.event;
    let prTitle = 'PR';
    let prNumber = 0;
    let branch = 'main';
    let workflowId: string | undefined;

    if (event?.topic === 'code.pr') {
      prTitle = event.payload.title ?? 'PR';
      prNumber = event.payload.pr_number ?? 0;
      branch = event.payload.branch ?? 'main';
      workflowId = event.payload.workflow_id;
    }

    // Generate test cases
    const testResult = await context.tools.request('test.generate', { pr: prTitle });

    // Run tests
    const testRunResult = await context.tools.request('test.run', { branch });

    // Risk assessment via LLM
    const riskResponse = await context.llm({
      messages: [
        { role: 'system', content: 'You are a QA engineer. Assess risk of a PR based on title, branch, and test results.' },
        { role: 'user', content: `PR: ${prTitle}\nBranch: ${branch}\nTests: ${testRunResult.passed ? 'passed' : 'failed'}\nTest cases: ${JSON.stringify(testResult.test_cases)}` },
      ],
      task_type: 'reasoning',
    });

    const riskLevel = testRunResult.passed ? 'low' : 'high';
    const releaseReady = testRunResult.passed && riskLevel === 'low';

    await context.memory.save({
      memory_type: 'output',
      content: riskResponse.content,
      importance: 0.8,
      source_event_id: event?.event_id,
    });

    return {
      summary: `QA review complete for PR #${prNumber}: risk ${riskLevel}`,
      content: riskResponse.content,
      decisions: [
        {
          decision_id: `qa_${Date.now()}`,
          title: `Approve release readiness for PR #${prNumber}`,
          rationale: `Tests ${testRunResult.passed ? 'passed' : 'failed'}; risk ${riskLevel}`,
          requires_approval: !releaseReady,
        },
      ],
      events: [
        {
          event_id: `evt_${Date.now()}`,
          event_type: 'qa.review',
          topic: 'qa.review',
          source_agent_id: this.manifest.agent_id,
          org_id: context.org_id,
          correlation_id: context.run_id,
          timestamp: new Date().toISOString(),
          payload: {
            pr_number: prNumber,
            pr_title: prTitle,
            branch,
            risk_level: riskLevel,
            release_ready: releaseReady,
            test_cases: testResult.test_cases,
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
        request: 'Review the PR and generate tests.',
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
