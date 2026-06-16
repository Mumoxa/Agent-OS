import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';

// In-memory store for MVP; replace with DB
const approvals = new Map<string, any>();

export async function registerApprovalRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get('/', async (request) => {
    const { status } = request.query as { status?: string };
    let results = Array.from(approvals.values());
    if (status) {
      results = results.filter((a) => a.status === status);
    }
    return { approvals: results };
  });

  app.get('/:approval_id', async (request) => {
    const { approval_id } = request.params as { approval_id: string };
    const approval = approvals.get(approval_id);
    if (!approval) throw { statusCode: 404, message: 'Approval not found' };
    return { approval };
  });

  const respondBodySchema = z.object({
    response: z.enum(['approved', 'rejected']),
    comment: z.string().optional(),
  });

  app.post('/:approval_id/respond', async (request) => {
    const { approval_id } = request.params as { approval_id: string };
    const body = respondBodySchema.parse(request.body);
    const approval = approvals.get(approval_id);
    if (!approval) throw { statusCode: 404, message: 'Approval not found' };

    approval.status = body.response;
    approval.responded_at = new Date().toISOString();
    approval.comment = body.comment;

    // TODO: emit approval.response event

    return { approval };
  });
}
