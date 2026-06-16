import { AgentRuntime } from '../AgentRuntime.js';

export class ProductReleaseWorkflow {
  constructor(private runtime: AgentRuntime) {}

  async start(request: string): Promise<string> {
    console.log('Starting product release workflow:', request);

    // Step 1: Product Manager creates PRD
    const pmRunId = await this.runtime.runAgent('product_manager', {
      trigger: 'manual',
      request,
    });

    // Subsequent steps are triggered by events:
    // PM publishes product.prd → Engineering creates branch/PR
    // Engineering publishes code.pr → QA reviews
    // QA publishes qa.review → DevOps deploys to staging

    return pmRunId;
  }
}
