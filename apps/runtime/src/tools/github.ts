import { ToolRegistry } from './ToolRegistry.js';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

export function registerGitHubTools(registry: ToolRegistry): void {
  registry.register({
    name: 'github.create_issue',
    description: 'Create a GitHub issue for a product feature or bug',
    required_permissions: ['repo:write'],
    approval_threshold: 'low',
    handler: async (args, ctx) => {
      const { title, body, labels } = args;

      if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        ctx.log('GitHub not configured, simulating issue creation');
        return { issue_number: Math.floor(Math.random() * 1000) + 1, simulated: true };
      }

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, body, labels }),
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub issue creation failed: ${response.status}`);
      }

      const data = await response.json() as any;
      return { issue_number: data.number, url: data.html_url };
    },
  });

  registry.register({
    name: 'github.create_branch',
    description: 'Create a Git branch from the default branch',
    required_permissions: ['repo:write'],
    approval_threshold: 'low',
    handler: async (args, ctx) => {
      const { branch_name, from_branch = 'main' } = args;

      if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        ctx.log('GitHub not configured, simulating branch creation');
        return { branch_name, simulated: true };
      }

      // Get the latest commit SHA from the base branch
      const baseResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${from_branch}`,
        {
          headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
        }
      );
      if (!baseResponse.ok) throw new Error('Failed to get base branch');
      const baseData = await baseResponse.json() as any;
      const sha = baseData.object.sha;

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ref: `refs/heads/${branch_name}`, sha }),
        }
      );

      if (!response.ok && response.status !== 422) {
        throw new Error(`GitHub branch creation failed: ${response.status}`);
      }

      return { branch_name, from_branch };
    },
  });

  registry.register({
    name: 'github.create_pr',
    description: 'Create a pull request from a branch',
    required_permissions: ['repo:write'],
    approval_threshold: 'medium',
    handler: async (args, ctx) => {
      const { title, body, branch, base = 'main' } = args;

      if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        ctx.log('GitHub not configured, simulating PR creation');
        return { pr_number: Math.floor(Math.random() * 1000) + 1, simulated: true };
      }

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, body, head: branch, base }),
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub PR creation failed: ${response.status}`);
      }

      const data = await response.json() as any;
      return { pr_number: data.number, url: data.html_url };
    },
  });
}
