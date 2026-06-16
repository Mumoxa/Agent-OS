import { Pool } from 'pg';
import { config } from '../config.js';

const pool = new Pool({ connectionString: config.DATABASE_URL });

export interface MemoryEntry {
  memory_id?: string;
  agent_id: string;
  org_id: string;
  memory_type: 'observation' | 'output' | 'conversation';
  content: string;
  metadata?: Record<string, any>;
  importance: number;
  source_event_id?: string;
}

export interface MemorySearchResult {
  memory_id: string;
  content: string;
  score: number;
  memory_type: string;
  agent_id: string;
  source_event_id?: string;
  importance: number;
}

export async function ensureTable(): Promise<void> {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE TABLE IF NOT EXISTS memories (
      memory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      memory_type TEXT NOT NULL,
      content TEXT NOT NULL,
      embedding VECTOR(${config.VECTOR_DIMENSION}),
      metadata JSONB DEFAULT '{}',
      importance REAL DEFAULT 0.5,
      source_event_id TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_memories_org_agent ON memories(org_id, agent_id);
    CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING hnsw (embedding vector_cosine_ops);
  `);
}

export async function saveMemory(entry: MemoryEntry): Promise<{ memory_id: string }> {
  await ensureTable();

  // Generate a simple embedding using the LLM router or a local model
  // For MVP, we use a placeholder zero embedding if no embedding service is available
  const embedding = await generateEmbedding(entry.content);

  const result = await pool.query(
    `
    INSERT INTO memories (org_id, agent_id, memory_type, content, embedding, metadata, importance, source_event_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING memory_id
    `,
    [
      entry.org_id,
      entry.agent_id,
      entry.memory_type,
      entry.content,
      `[${embedding.join(',')}]`,
      JSON.stringify(entry.metadata ?? {}),
      entry.importance,
      entry.source_event_id ?? null,
    ]
  );

  return { memory_id: result.rows[0].memory_id };
}

export async function retrieveMemories(
  query: string,
  orgId: string,
  options: {
    agent_id?: string;
    memory_type?: string[];
    top_k?: number;
    after?: string;
  } = {}
): Promise<MemorySearchResult[]> {
  await ensureTable();

  const embedding = await generateEmbedding(query);
  const topK = options.top_k ?? 5;

  let sql = `
    SELECT memory_id, content, agent_id, memory_type, source_event_id, importance,
           1 - (embedding <=> $1) as score
    FROM memories
    WHERE org_id = $2
  `;
  const params: any[] = [`[${embedding.join(',')}]`, orgId];
  let paramIdx = 3;

  if (options.agent_id) {
    sql += ` AND agent_id = $${paramIdx++}`;
    params.push(options.agent_id);
  }

  if (options.memory_type && options.memory_type.length > 0) {
    sql += ` AND memory_type = ANY($${paramIdx++})`;
    params.push(options.memory_type);
  }

  if (options.after) {
    sql += ` AND created_at > $${paramIdx++}`;
    params.push(options.after);
  }

  sql += ` ORDER BY embedding <=> $1 LIMIT $${paramIdx}`;
  params.push(topK);

  const result = await pool.query(sql, params);
  return result.rows.map((r) => ({
    memory_id: r.memory_id,
    content: r.content,
    score: Number(r.score),
    memory_type: r.memory_type,
    agent_id: r.agent_id,
    source_event_id: r.source_event_id,
    importance: Number(r.importance),
  }));
}

export async function getMemoryById(memoryId: string, orgId: string): Promise<MemoryEntry | null> {
  await ensureTable();
  const result = await pool.query(
    `SELECT * FROM memories WHERE memory_id = $1 AND org_id = $2`,
    [memoryId, orgId]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0];
}

async function generateEmbedding(text: string): Promise<number[]> {
  // Placeholder: generate a simple hash-based embedding.
  // In production, call the LLM router or a dedicated embedding service.
  const dim = config.VECTOR_DIMENSION;
  const embedding = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    embedding[i % dim] += text.charCodeAt(i) / 1000;
  }
  const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  return norm > 0 ? embedding.map((v) => v / norm) : embedding;
}
