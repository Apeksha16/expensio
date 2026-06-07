import { FastifyRequest, FastifyReply } from 'fastify';
import { pushService, PushSubscriptionData } from './push.service.js';

export class PushController {
  async subscribe(
    request: FastifyRequest<{ Body: { subscription: PushSubscriptionData } }>,
    reply: FastifyReply
  ) {
    if (!request.user) {
      return reply.status(401).send({ error: { message: 'Unauthorized' } });
    }
    const userId = request.user.id;
    const { subscription } = request.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return reply.status(400).send({ error: { message: 'Invalid subscription data' } });
    }

    // SSRF Protection: Validate the endpoint URL
    try {
      const url = new URL(subscription.endpoint);
      if (url.protocol !== 'https:') {
        return reply.status(400).send({ error: { message: 'Endpoint must be HTTPS' } });
      }

      const allowedDomains = [
        'fcm.googleapis.com',
        'updates.push.services.mozilla.com',
        'push.apple.com',
      ];

      const isAllowed = allowedDomains.some(
        (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`)
      );
      if (!isAllowed) {
        return reply.status(400).send({ error: { message: 'Endpoint domain not allowed' } });
      }
    } catch (err) {
      return reply.status(400).send({ error: { message: 'Invalid endpoint URL format' } });
    }

    try {
      const sub = await pushService.saveSubscription(userId, subscription);
      return reply.send({ data: sub });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: { message: 'Failed to save subscription' } });
    }
  }

  async unsubscribe(request: FastifyRequest<{ Body: { endpoint: string } }>, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ error: { message: 'Unauthorized' } });
    }
    const userId = request.user.id;
    const { endpoint } = request.body;

    if (!endpoint) {
      return reply.status(400).send({ error: { message: 'Endpoint is required' } });
    }

    try {
      await pushService.removeSubscription(userId, endpoint);
      return reply.send({ success: true });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ error: { message: 'Failed to remove subscription' } });
    }
  }
}

export const pushController = new PushController();
