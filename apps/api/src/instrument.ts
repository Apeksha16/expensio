// MUST be the very first import in server.ts
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { env } from './config/env.js';

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.NODE_ENV,
  tracesSampleRate: env.NODE_ENV === 'development' ? 1.0 : 0.2,
  profilesSampleRate: env.NODE_ENV === 'development' ? 1.0 : 0.1,
  integrations: [Sentry.httpIntegration(), Sentry.fastifyIntegration(), nodeProfilingIntegration()],
});
