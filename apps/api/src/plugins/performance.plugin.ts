import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import * as Sentry from '@sentry/node';
import { env } from '../config/env.js';

const SLOW_REQUEST_THRESHOLD_MS = env.SLOW_REQUEST_THRESHOLD_MS || 1000;
const CRITICAL_REQUEST_THRESHOLD_MS = env.CRITICAL_REQUEST_THRESHOLD_MS || 3000;

const performancePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request) => {
    (request as any).startTime = performance.now();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const startTime = (request as any).startTime;
    if (!startTime) return;

    const durationMs = performance.now() - startTime;
    const { method, url } = request;
    const statusCode = reply.statusCode;
    const userId = (request as any).user?.id;

    fastify.log.info({ method, url, statusCode, durationMs: durationMs.toFixed(2) });

    if (durationMs > CRITICAL_REQUEST_THRESHOLD_MS) {
      fastify.log.error({
        label: 'CRITICAL_SLOW_REQUEST',
        method,
        url,
        statusCode,
        durationMs: durationMs.toFixed(2),
      });
      Sentry.captureEvent({
        message: `Critical slow request: ${method} ${url}`,
        level: 'error',
        extra: { method, url, userId, durationMs, statusCode },
      });
    } else if (durationMs > SLOW_REQUEST_THRESHOLD_MS) {
      fastify.log.warn({
        label: 'SLOW_REQUEST',
        method,
        url,
        statusCode,
        durationMs: durationMs.toFixed(2),
      });
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `Slow request: ${method} ${url}`,
        level: 'warning',
        data: { durationMs, statusCode },
      });
    }
  });

  fastify.addHook('onError', async (request, reply, error) => {
    const { method, url } = request;
    const userId = (request as any).user?.id;
    Sentry.captureException(error, { extra: { method, url, userId } });
  });
};

export default fp(performancePlugin, { name: 'performancePlugin' });
