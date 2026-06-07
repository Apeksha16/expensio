import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { budgetController } from './budget.controller.js';

type IdParams = { Params: { id: string } };

export async function budgetRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [fastify.authenticate] };

  /** POST /api/v1/budgets — create a new budget */
  fastify.post('/api/v1/budgets', auth, (req, reply) => budgetController.create(req, reply));

  /** GET /api/v1/budgets — list budgets with summaries */
  fastify.get('/api/v1/budgets', auth, (req, reply) => budgetController.list(req, reply));

  /** GET /api/v1/budgets/:id — get single budget summary */
  fastify.get<IdParams>('/api/v1/budgets/:id', auth, (req, reply) =>
    budgetController.getOne(req as FastifyRequest<IdParams>, reply)
  );

  /** PATCH /api/v1/budgets/:id — update a budget */
  fastify.patch<IdParams>('/api/v1/budgets/:id', auth, (req, reply) =>
    budgetController.update(req as FastifyRequest<IdParams>, reply)
  );

  /** DELETE /api/v1/budgets/:id — delete a budget */
  fastify.delete<IdParams>('/api/v1/budgets/:id', auth, (req, reply) =>
    budgetController.remove(req as FastifyRequest<IdParams>, reply)
  );
}
