import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { expensesController } from './expenses.controller.js';

type IdParams = { Params: { id: string } };

export async function expensesRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [fastify.authenticate] };

  /** POST /api/v1/expenses — create a new expense */
  fastify.post('/api/v1/expenses', auth, (req, reply) => expensesController.create(req, reply));

  /** GET /api/v1/expenses — list expenses with filters & pagination */
  fastify.get(
    '/api/v1/expenses',
    {
      ...auth,
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            cursorDate: { type: 'string' },
            cursorId: { type: 'string' },
            categoryId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    id: { type: 'string' },
                    userId: { type: 'string' },
                    amount: { type: 'number' },
                    currency: { type: 'string' },
                    description: { type: ['string', 'null'] },
                    category: { type: 'string', nullable: true },
                    date: { type: 'string', format: 'date-time' },
                    accountId: { type: 'string', nullable: true },
                    paymentMethod: { type: 'string', nullable: true },
                    isSplit: { type: 'boolean' },
                    createdAt: { type: 'string', nullable: true },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  hasNextPage: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    (req, reply) => expensesController.list(req, reply)
  );

  /** GET /api/v1/expenses/:id — get a single expense with its splits */
  fastify.get<IdParams>(
    '/api/v1/expenses/:id',
    {
      ...auth,
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  amount: { type: 'number' },
                  currency: { type: 'string' },
                  description: { type: ['string', 'null'] },
                  category: { type: 'string', nullable: true },
                  date: { type: 'string' },
                  accountId: { type: 'string', nullable: true },
                  isSplit: { type: 'boolean' },
                  createdAt: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
      },
    },
    (req, reply) => expensesController.getOne(req as FastifyRequest<IdParams>, reply)
  );

  /** PUT & PATCH /api/v1/expenses/:id — update an expense */
  fastify.put<IdParams>('/api/v1/expenses/:id', auth, (req, reply) =>
    expensesController.update(req as FastifyRequest<IdParams>, reply)
  );
  fastify.patch<IdParams>('/api/v1/expenses/:id', auth, (req, reply) =>
    expensesController.update(req as FastifyRequest<IdParams>, reply)
  );

  /** DELETE /api/v1/expenses/bulk — bulk delete expenses */
  fastify.delete('/api/v1/expenses/bulk', auth, (req, reply) =>
    expensesController.bulkDelete(req, reply)
  );

  /** DELETE /api/v1/expenses/:id — delete an expense */
  fastify.delete<IdParams>('/api/v1/expenses/:id', auth, (req, reply) =>
    expensesController.remove(req as FastifyRequest<IdParams>, reply)
  );
}
