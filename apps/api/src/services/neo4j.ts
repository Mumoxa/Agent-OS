import neo4j, { Driver, Record as Neo4jRecord } from 'neo4j-driver';
import { config } from '../config.js';

let driver: Driver;

export function getNeo4jDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      config.NEO4J_URL,
      neo4j.auth.basic(config.NEO4J_USER, config.NEO4J_PASSWORD)
    );
  }
  return driver;
}

export interface KGEntity {
  entity_id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  source_id?: string;
  source_agent_id?: string;
  org_id: string;
}

export interface KGRelation {
  from_id: string;
  to_id: string;
  type: string;
  properties?: Record<string, any>;
}

export async function createEntity(entity: KGEntity): Promise<void> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  try {
    await session.run(
      `
      MERGE (e:Entity {entity_id: $entity_id, org_id: $org_id})
      SET e.type = $type,
          e.name = $name,
          e.properties = $properties,
          e.source_id = $source_id,
          e.source_agent_id = $source_agent_id,
          e.updated_at = datetime()
      RETURN e
      `,
      {
        entity_id: entity.entity_id,
        org_id: entity.org_id,
        type: entity.type,
        name: entity.name,
        properties: JSON.stringify(entity.properties),
        source_id: entity.source_id ?? null,
        source_agent_id: entity.source_agent_id ?? null,
      }
    );
  } finally {
    await session.close();
  }
}

export async function createRelation(relation: KGRelation, orgId: string): Promise<void> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  try {
    await session.run(
      `
      MATCH (a:Entity {entity_id: $from_id, org_id: $org_id})
      MATCH (b:Entity {entity_id: $to_id, org_id: $org_id})
      MERGE (a)-[r:${relation.type}]->(b)
      SET r.properties = $properties,
          r.updated_at = datetime()
      RETURN r
      `,
      {
        from_id: relation.from_id,
        to_id: relation.to_id,
        org_id: orgId,
        properties: JSON.stringify(relation.properties ?? {}),
      }
    );
  } finally {
    await session.close();
  }
}

export async function getEntity(entityId: string, orgId: string): Promise<any | null> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (e:Entity {entity_id: $entity_id, org_id: $org_id})
      OPTIONAL MATCH (e)-[r]->(related)
      OPTIONAL MATCH (other)-[r2]->(e)
      RETURN e,
             collect(DISTINCT { relation: type(r), target: related.entity_id, target_name: related.name, target_type: related.type }) as outgoing,
             collect(DISTINCT { relation: type(r2), source: other.entity_id, source_name: other.name, source_type: other.type }) as incoming
      `,
      { entity_id: entityId, org_id: orgId }
    );
    if (result.records.length === 0) return null;
    return recordToEntity(result.records[0]);
  } finally {
    await session.close();
  }
}

export async function searchEntities(query: string, orgId: string, types?: string[]): Promise<any[]> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  try {
    let cypher = `
      MATCH (e:Entity {org_id: $org_id})
      WHERE e.name CONTAINS $query
    `;
    if (types && types.length > 0) {
      cypher += ` AND e.type IN $types`;
    }
    cypher += `
      RETURN e
      LIMIT 20
    `;
    const result = await session.run(cypher, { query, org_id: orgId, types: types ?? [] });
    return result.records.map((r) => recordToEntity(r));
  } finally {
    await session.close();
  }
}

export async function queryCypher(cypher: string, params: Record<string, any>, orgId: string): Promise<any[]> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  try {
    const result = await session.run(cypher, { ...params, org_id: orgId });
    return result.records.map((r) => Object.fromEntries(r.keys.map((k) => [k, r.get(k)])));
  } finally {
    await session.close();
  }
}

function recordToEntity(record: Neo4jRecord): any {
  const node = record.get('e')?.properties ?? record.get(0)?.properties;
  return {
    ...node,
    properties: safeJsonParse(node.properties),
    outgoing: record.get('outgoing') ?? [],
    incoming: record.get('incoming') ?? [],
  };
}

function safeJsonParse(value: any): any {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
