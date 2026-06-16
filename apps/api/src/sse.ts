import { FastifyReply, FastifyRequest } from 'fastify';
import IORedis from 'ioredis';

interface Client {
  id: string;
  reply: FastifyReply;
  topics: string[];
  org_id: string;
}

export class SSEManager {
  private clients = new Map<string, Client>();
  private redis: IORedis;
  private running = false;

  constructor(redisUrl: string) {
    this.redis = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  }

  async start(): Promise<void> {
    this.running = true;
    this.listen();
  }

  async stop(): Promise<void> {
    this.running = false;
    await this.redis.quit();
  }

  addClient(request: FastifyRequest, reply: FastifyReply): string {
    const clientId = crypto.randomUUID();
    const topics = ((request.query as any).topics ?? 'agent.lifecycle,agent.approval_request,security.alert').split(',');
    const orgId = (request.query as any).org_id ?? 'org_demo_001';

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', client_id: clientId })}\n\n`);

    const client: Client = { id: clientId, reply, topics, org_id: orgId };
    this.clients.set(clientId, client);

    request.raw.on('close', () => {
      this.clients.delete(clientId);
    });

    return clientId;
  }

  broadcast(topic: string, event: any, orgId: string): void {
    for (const client of this.clients.values()) {
      if (client.org_id !== orgId) continue;
      if (!client.topics.includes(topic) && !client.topics.includes('#')) continue;

      try {
        client.reply.raw.write(`event: ${topic}\n`);
        client.reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (err) {
        this.clients.delete(client.id);
      }
    }
  }

  private async listen(): Promise<void> {
    const topics = ['agent.lifecycle', 'agent.approval_request', 'security.alert', 'knowledge.change'];
    const lastIds: Record<string, string> = {};
    for (const topic of topics) lastIds[topic] = '$';

    while (this.running) {
      try {
        const args: (string | number)[] = [];
        for (const topic of topics) {
          args.push('STREAMS', topic, lastIds[topic]);
        }

        const result = await this.redis.xread('COUNT', 10, 'BLOCK', 1000, ...args);
        if (!result) continue;

        for (const [topic, messages] of result) {
          for (const [id, fields] of messages) {
            lastIds[topic] = id;
            const payloadIndex = fields.indexOf('payload');
            if (payloadIndex === -1) continue;
            const payload = JSON.parse(fields[payloadIndex + 1]);
            this.broadcast(topic, payload, payload.org_id);
          }
        }
      } catch (err) {
        console.error('SSE listen error:', err);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
}
