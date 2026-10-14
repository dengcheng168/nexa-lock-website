import type { FastifyInstance } from 'fastify';
import { publicContactEventHandler, publicProductDetailViewEventHandler } from './meta-events.controller.js';

export async function publicMetaEventRoutes(app: FastifyInstance) {
  app.post(
    '/meta-events/contact',
    {
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    publicContactEventHandler,
  );
  app.post(
    '/meta-events/product-detail-view',
    {
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    publicProductDetailViewEventHandler,
  );
}
