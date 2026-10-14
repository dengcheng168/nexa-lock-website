import type { FastifyRequest } from 'fastify';
import { ok } from '../../lib/api-response.js';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { resolveMetaEventSourcePath, sendMetaContactEvent, sendMetaProductDetailViewEvent } from '../../lib/meta-conversions.js';
import { contactEventSchema, productDetailViewEventSchema } from './meta-events.schema.js';

/** Best-effort analytics endpoint: Meta outages must never block navigation. */
export async function publicContactEventHandler(request: FastifyRequest) {
  try {
    const input = contactEventSchema.parse(request.body);
    const settings = await request.server.prisma.siteSetting.findUnique({
      where: { id: 1 },
      select: { metaPixelId: true, siteBaseUrl: true },
    });
    if (settings?.siteBaseUrl) {
      const startedAt = Date.now();
      const sourcePath = resolveMetaEventSourcePath(input.sourcePath);
      const delivered = await sendMetaContactEvent({
        pixelId: settings.metaPixelId,
        accessToken: env.META_CAPI_ACCESS_TOKEN,
        apiVersion: env.META_GRAPH_API_VERSION,
        eventId: input.eventId,
        eventTime: new Date(),
        eventSourceUrl: new URL(sourcePath, settings.siteBaseUrl).toString(),
        contactMethod: input.contactMethod,
        contactLocation: input.contactLocation,
        productSlug: input.productSlug,
        fbp: request.cookies._fbp,
        fbc: request.cookies._fbc,
        clientIpAddress: request.ip,
        clientUserAgent: request.headers['user-agent'],
        clientExternalId: request.cookies._meta_uid,
      });
      logger[delivered ? 'debug' : 'warn'](
        { eventName: 'Contact', eventId: input.eventId, delivered, durationMs: Date.now() - startedAt },
        delivered ? 'Meta CAPI 事件发送成功' : 'Meta CAPI 事件发送失败',
      );
    }
  } catch (error) {
    logger.debug({ error: error instanceof Error ? error.message : 'unknown_error' }, 'Meta Contact 回传已忽略');
  }
  return ok({ recorded: true });
}

/** Best-effort product-view mirror used only for Pixel/CAPI event deduplication. */
export async function publicProductDetailViewEventHandler(request: FastifyRequest) {
  try {
    const input = productDetailViewEventSchema.parse(request.body);
    const settings = await request.server.prisma.siteSetting.findUnique({
      where: { id: 1 },
      select: { metaPixelId: true, siteBaseUrl: true },
    });
    if (settings?.siteBaseUrl) {
      const startedAt = Date.now();
      const sourcePath = resolveMetaEventSourcePath(input.sourcePath);
      const delivered = await sendMetaProductDetailViewEvent({
        pixelId: settings.metaPixelId,
        accessToken: env.META_CAPI_ACCESS_TOKEN,
        apiVersion: env.META_GRAPH_API_VERSION,
        eventId: input.eventId,
        eventTime: new Date(),
        eventSourceUrl: new URL(sourcePath, settings.siteBaseUrl).toString(),
        productSlug: input.productSlug,
        fbp: request.cookies._fbp,
        fbc: request.cookies._fbc,
        clientIpAddress: request.ip,
        clientUserAgent: request.headers['user-agent'],
        clientExternalId: request.cookies._meta_uid,
      });
      logger[delivered ? 'debug' : 'warn'](
        { eventName: 'ProductDetailView', eventId: input.eventId, delivered, durationMs: Date.now() - startedAt },
        delivered ? 'Meta CAPI 事件发送成功' : 'Meta CAPI 事件发送失败',
      );
    }
  } catch (error) {
    logger.debug({ error: error instanceof Error ? error.message : 'unknown_error' }, 'Meta ProductDetailView 回传已忽略');
  }
  return ok({ recorded: true });
}
