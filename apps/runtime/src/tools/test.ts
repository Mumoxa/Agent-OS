import { ToolRegistry } from './ToolRegistry.js';

export function registerTestTools(registry: ToolRegistry): void {
  registry.register({
    name: 'test.generate',
    description: 'Generate test cases for a PRD or PR',
    required_permissions: ['test:write'],
    approval_threshold: 'none',
    handler: async (args, ctx) => {
      const { prd, pr } = args;
      ctx.log('Generating test cases');
      return {
        test_cases: [
          { name: 'Should accept valid input', type: 'unit' },
          { name: 'Should reject invalid input', type: 'unit' },
          { name: 'Should complete end-to-end flow', type: 'e2e' },
        ],
        source: prd || pr,
      };
    },
  });

  registry.register({
    name: 'test.run',
    description: 'Run test suite for a branch',
    required_permissions: ['test:run'],
    approval_threshold: 'none',
    handler: async (args, ctx) => {
      const { branch } = args;
      ctx.log(`Running tests for branch ${branch}`);
      return {
        passed: true,
        branch,
        tests_run: 10,
        tests_failed: 0,
        simulated: true,
      };
    },
  });
}
