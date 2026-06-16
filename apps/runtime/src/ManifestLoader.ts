import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { z } from 'zod';
import { AgentManifest } from './types.js';

const manifestSchema = z.object({
  agent_id: z.string().regex(/^[a-z0-9_]+$/),
  name: z.string(),
  version: z.string(),
  purpose: z.string(),
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
  tools: z.array(z.string()),
  memory: z.object({
    read: z.array(z.string()),
    write: z.array(z.string()),
  }),
  permissions: z.array(z.string()),
  tasks_autonomous: z.array(z.string()),
  tasks_approval: z.array(z.string()),
  sleep_cycle: z.object({
    mode: z.enum(['continuous', 'scheduled', 'event_driven']),
    schedule: z.string(),
    deep_sleep_start: z.string().optional(),
    deep_sleep_end: z.string().optional(),
    wake_interval_minutes: z.number().optional(),
    emergency_topics: z.array(z.string()),
  }),
  failure_modes: z.array(
    z.object({ name: z.string(), mitigation: z.string() })
  ),
  llm: z.object({
    default_model: z.string(),
    fallback_model: z.string(),
    task_type: z.string(),
  }),
  subscribed_topics: z.array(z.string()),
  published_topics: z.array(z.string()),
});

export class ManifestLoader {
  constructor(private manifestsDir: string) {}

  async loadAll(): Promise<Map<string, AgentManifest>> {
    const manifests = new Map<string, AgentManifest>();
    const files = await fs.readdir(this.manifestsDir);

    for (const file of files) {
      if (!file.endsWith('.yaml') && !file.endsWith('.yml')) continue;
      if (file === 'schema.json') continue;

      const content = await fs.readFile(path.join(this.manifestsDir, file), 'utf-8');
      const parsed = yaml.load(content) as any;
      const validated = manifestSchema.parse(parsed);
      manifests.set(validated.agent_id, validated);
    }

    return manifests;
  }

  async load(agentId: string): Promise<AgentManifest | undefined> {
    const all = await this.loadAll();
    return all.get(agentId);
  }
}
