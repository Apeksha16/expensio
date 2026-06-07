import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { idempotencyKeys } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

const idempotencyPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Only intercept POST, PUT, PATCH, DELETE
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;

    const idempotencyKey = request.headers['idempotency-key'] as string;
    if (!idempotencyKey) return;

    const user = (request as any).user;
    if (!user || !user.id) return; // Needs authentication

    // Check if key exists
    const [existing] = await db
      .select()
      .from(idempotencyKeys)
      .where(and(eq(idempotencyKeys.userId, user.id), eq(idempotencyKeys.key, idempotencyKey)))
      .limit(1);

    if (existing) {
      if (existing.statusCode) {
        // Return cached response
        reply.code(existing.statusCode).send(existing.responseBody);
        return reply;
      } else {
        // If it has been more than 2 minutes and statusCode is still null, the previous process crashed.
        const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000);
        if (existing.createdAt && existing.createdAt < twoMinsAgo) {
          // Stale lock detected. Delete it and allow this request to proceed.
          await db
            .delete(idempotencyKeys)
            .where(
              and(eq(idempotencyKeys.userId, user.id), eq(idempotencyKeys.key, idempotencyKey))
            );
        } else {
          // Concurrent request currently processing this key
          reply.code(409).send({ error: { message: 'Concurrent request detected' } });
          return reply;
        }
      }
    }

    // Insert pending idempotency record
    try {
      await db.insert(idempotencyKeys).values({
        id: crypto.randomUUID(),
        userId: user.id,
        key: idempotencyKey,
        path: request.routerPath,
        method: request.method,
      });
    } catch (err) {
      // If it fails due to unique constraint, it means a concurrent request beat us to it
      reply.code(409).send({ error: { message: 'Concurrent request detected' } });
      return reply;
    }

    // Attach to request so onSend can update it
    (request as any).idempotencyKey = idempotencyKey;
  });

  fastify.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply, payload) => {
    const idempotencyKey = (request as any).idempotencyKey;
    const user = (request as any).user;

    if (idempotencyKey && user && user.id) {
      // Parse payload to JSON if it's a string, so we can store it in JSONB
      let parsedPayload = payload;
      try {
        if (typeof payload === 'string') {
          parsedPayload = JSON.parse(payload);
        }
      } catch (e) {
        // Ignore
      }

      // Update the DB with the response
      await db
        .update(idempotencyKeys)
        .set({
          statusCode: reply.statusCode,
          responseBody: parsedPayload,
        })
        .where(and(eq(idempotencyKeys.userId, user.id), eq(idempotencyKeys.key, idempotencyKey)));
    }
    return payload;
  });
};

export default fp(idempotencyPlugin, {
  name: 'idempotency-plugin',
  dependencies: ['auth-plugin'],
});
