import { FastifyRequest, FastifyReply } from 'fastify';
import { syncQueue } from './sync.queue.js';
import crypto from 'node:crypto';

export const bulkSync = async (request: FastifyRequest, reply: FastifyReply) => {
  const { mutations } = request.body as { mutations: any[] };
  const user = (request as any).user;

  if (!mutations || !Array.isArray(mutations)) {
    return reply.code(400).send({ success: false, message: 'Invalid payload' });
  }

  const hash = crypto.createHash('md5').update(JSON.stringify(mutations)).digest('hex');
  const jobId = `sync-${user.id}-${hash}`;

  await syncQueue.add(
    'process-bulk-sync',
    { userId: user.id, mutations },
    { jobId, attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
  );

  return reply.code(202).send({ success: true, message: 'Sync queued' });
};
