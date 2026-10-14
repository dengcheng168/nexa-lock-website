import { createHash } from 'node:crypto';

export interface MetaInquiryEvents {
  pixelId?: string | null;
  accessToken?: string | null;
  apiVersion?: string | null;
  eventId: string;
  eventTime: Date;
  eventSourceUrl: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  country?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  productName?: string | null;
}

export interface MetaContactEvent {
  pixelId?: string | null;
  accessToken?: string | null;
  apiVersion?: string | null;
  eventId: string;
  eventTime: Date;
  eventSourceUrl: string;
  contactMethod: 'whatsapp_link' | 'email_link' | 'phone_link';
  contactLocation?: string | null;
  productSlug?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  clientExternalId?: string | null;
}

export interface MetaProductDetailViewEvent {
  pixelId?: string | null;
  accessToken?: string | null;
  apiVersion?: string | null;
  eventId: string;
  eventTime: Date;
  eventSourceUrl: string;
  productSlug: string;
  fbp?: string | null;
  fbc?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  clientExternalId?: string | null;
}

type FetchLike = typeof fetch;

/** Error safe to put in application logs: it deliberately carries no request data. */
export class MetaConversionError extends Error {
  constructor(
    public readonly status: number | undefined,
    public readonly code: string,
  ) {
    super(`Meta CAPI delivery failed${status ? ` (${status})` : ''}: ${code}`);
    this.name = 'MetaConversionError';
  }
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const clean = (value?: string | null) => value?.trim() || '';

export function resolveMetaEventSourcePath(value?: string | null): string {
  const sourcePath = clean(value);
  return sourcePath.startsWith('/') && !sourcePath.startsWith('//') ? sourcePath : '/contact';
}

function hashEmail(value: string) {
  return sha256(value.trim().toLowerCase());
}

function hashPhone(value?: string | null) {
  const normalized = clean(value).replace(/\D/g, '');
  return normalized ? sha256(normalized) : undefined;
}

function hashFirstName(value?: string | null) {
  const normalized = clean(value).toLowerCase().split(/\s+/)[0];
  return normalized ? sha256(normalized) : undefined;
}

function hashLastName(value?: string | null) {
  const parts = clean(value).toLowerCase().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? sha256(parts.at(-1)!) : undefined;
}

function hashCountry(value?: string | null) {
  const normalized = clean(value).toLowerCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ');
  const countryCodes: Record<string, string> = {
    china: 'cn', 'people s republic of china': 'cn', prc: 'cn',
    'united states': 'us', 'united states of america': 'us', usa: 'us',
    'united kingdom': 'gb', uk: 'gb', 'great britain': 'gb',
    spain: 'es', mexico: 'mx', canada: 'ca', australia: 'au',
    germany: 'de', france: 'fr', italy: 'it', netherlands: 'nl',
    singapore: 'sg', philippines: 'ph', indonesia: 'id', malaysia: 'my',
    thailand: 'th', vietnam: 'vn', india: 'in', 'united arab emirates': 'ae', uae: 'ae',
    'saudi arabia': 'sa', egypt: 'eg', brazil: 'br', chile: 'cl', peru: 'pe',
  };
  const code = /^[a-z]{2}$/.test(normalized) ? normalized : countryCodes[normalized];
  return code ? sha256(code) : undefined;
}

export function buildMetaUserData(input: {
  email: string;
  phone?: string | null;
  firstName?: string | null;
  country?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
}): Record<string, string | string[]> {
  const userData: Record<string, string | string[]> = {
    em: [hashEmail(input.email)],
    external_id: [hashEmail(input.email)],
  };
  const optionalHashed = {
    ph: hashPhone(input.phone),
    fn: hashFirstName(input.firstName),
    ln: hashLastName(input.firstName),
    country: hashCountry(input.country),
  };
  for (const [key, value] of Object.entries(optionalHashed)) {
    if (value) userData[key] = [value];
  }
  if (clean(input.fbp)) userData.fbp = clean(input.fbp);
  if (clean(input.fbc)) userData.fbc = clean(input.fbc);
  if (clean(input.clientIpAddress)) userData.client_ip_address = clean(input.clientIpAddress);
  if (clean(input.clientUserAgent)) userData.client_user_agent = clean(input.clientUserAgent);
  return userData;
}

/**
 * Deliver one CAPI payload with a short timeout and one retry for failures that
 * are safe to retry. Callers always reuse the same event_id, so Meta can
 * deduplicate a response-lost retry against the original browser/server event.
 */
async function deliverMetaEvent(endpoint: URL, body: string, fetchImpl: FetchLike): Promise<void> {
  let lastError: MetaConversionError | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(3000),
      });
      let responseBody: { events_received?: unknown; error?: { code?: unknown } } | undefined;
      try { responseBody = await response.json() as typeof responseBody; } catch { /* response is not JSON */ }

      if (response.ok && responseBody?.events_received === 1) return;

      const code = typeof responseBody?.error?.code === 'number'
        ? `meta_${responseBody.error.code}`
        : response.ok ? 'unexpected_events_received' : 'http_error';
      const error = new MetaConversionError(response.status, code);
      if (attempt === 0 && (response.status === 408 || response.status === 429 || response.status >= 500)) {
        lastError = error;
        continue;
      }
      throw error;
    } catch (err) {
      const error = err instanceof MetaConversionError
        ? err
        : new MetaConversionError(undefined, 'network_error');
      if (attempt === 0 && error.code === 'network_error') {
        lastError = error;
        continue;
      }
      throw error;
    }
  }
  throw lastError ?? new MetaConversionError(undefined, 'unknown_error');
}

export async function sendMetaInquiryEvents(
  input: MetaInquiryEvents,
  fetchImpl: FetchLike = fetch,
): Promise<boolean> {
  const pixelId = clean(input.pixelId);
  const accessToken = clean(input.accessToken);
  if (!/^\d+$/.test(pixelId) || !accessToken || !input.eventId || !input.email) return false;

  const userData = buildMetaUserData(input);

  const eventTime = Math.floor(input.eventTime.getTime() / 1000);
  const common = {
    event_time: eventTime,
    event_source_url: input.eventSourceUrl,
    action_source: 'website',
    user_data: userData,
  };
  const endpoint = new URL(
    `https://graph.facebook.com/${clean(input.apiVersion) || 'v23.0'}/${pixelId}/events`,
  );
  endpoint.searchParams.set('access_token', accessToken);

  // A successful form submission is a Lead, not a generic Contact click. Keeping
  // Contact exclusively for contact-entry clicks prevents funnel inflation.
  const body = JSON.stringify({
    data: [{
      ...common,
      event_name: 'Lead',
      event_id: input.eventId,
      custom_data: {
        lead_type: 'B2B_inquiry_form_submission',
        ...(clean(input.productName) ? { content_name: clean(input.productName) } : {}),
      },
    }],
  });

  await deliverMetaEvent(endpoint, body, fetchImpl);
  return true;
}

/**
 * Mirrors a browser Contact event through CAPI with the same event_id. Contact
 * clicks happen before a visitor supplies PII, so only first-party attribution
 * cookies and request context are sent; no value/currency or invented customer
 * identifiers are added.
 */
export async function sendMetaContactEvent(
  input: MetaContactEvent,
  fetchImpl: FetchLike = fetch,
): Promise<boolean> {
  const pixelId = clean(input.pixelId);
  const accessToken = clean(input.accessToken);
  if (!/^\d+$/.test(pixelId) || !accessToken || !clean(input.eventId)) return false;

  const userData: Record<string, string | string[]> = {};
  if (clean(input.clientExternalId)) userData.external_id = [sha256(clean(input.clientExternalId))];
  if (clean(input.fbp)) userData.fbp = clean(input.fbp);
  if (clean(input.fbc)) userData.fbc = clean(input.fbc);
  if (clean(input.clientIpAddress)) userData.client_ip_address = clean(input.clientIpAddress);
  if (clean(input.clientUserAgent)) userData.client_user_agent = clean(input.clientUserAgent);

  const endpoint = new URL(
    `https://graph.facebook.com/${clean(input.apiVersion) || 'v23.0'}/${pixelId}/events`,
  );
  endpoint.searchParams.set('access_token', accessToken);
  const body = JSON.stringify({
    data: [{
      event_name: 'Contact',
      event_id: clean(input.eventId),
      event_time: Math.floor(input.eventTime.getTime() / 1000),
      event_source_url: input.eventSourceUrl,
      action_source: 'website',
      user_data: userData,
      custom_data: {
        contact_method: input.contactMethod,
        ...(clean(input.contactLocation) ? { contact_location: clean(input.contactLocation) } : {}),
        ...(clean(input.productSlug)
          ? { content_type: 'product', content_ids: [clean(input.productSlug)] }
          : {}),
      },
    }],
  });

  try {
    await deliverMetaEvent(endpoint, body, fetchImpl);
    return true;
  } catch {
    return false;
  }
}

/** Mirrors the browser product view through CAPI using the identical event_id. */
export async function sendMetaProductDetailViewEvent(
  input: MetaProductDetailViewEvent,
  fetchImpl: FetchLike = fetch,
): Promise<boolean> {
  const pixelId = clean(input.pixelId);
  const accessToken = clean(input.accessToken);
  if (!/^\d+$/.test(pixelId) || !accessToken || !clean(input.eventId) || !clean(input.productSlug)) return false;

  const userData: Record<string, string | string[]> = {};
  if (clean(input.clientExternalId)) userData.external_id = [sha256(clean(input.clientExternalId))];
  if (clean(input.fbp)) userData.fbp = clean(input.fbp);
  if (clean(input.fbc)) userData.fbc = clean(input.fbc);
  if (clean(input.clientIpAddress)) userData.client_ip_address = clean(input.clientIpAddress);
  if (clean(input.clientUserAgent)) userData.client_user_agent = clean(input.clientUserAgent);

  const endpoint = new URL(`https://graph.facebook.com/${clean(input.apiVersion) || 'v23.0'}/${pixelId}/events`);
  endpoint.searchParams.set('access_token', accessToken);
  const body = JSON.stringify({
      data: [{
        event_name: 'ProductDetailView',
        event_id: clean(input.eventId),
        event_time: Math.floor(input.eventTime.getTime() / 1000),
        event_source_url: input.eventSourceUrl,
        action_source: 'website',
        user_data: userData,
        custom_data: { content_type: 'product', content_ids: [clean(input.productSlug)] },
      }],
  });
  try {
    await deliverMetaEvent(endpoint, body, fetchImpl);
    return true;
  } catch {
    return false;
  }
}

export async function sendMetaQualityEvent(input: {
  prisma: import('@prisma/client').PrismaClient;
  eventName: 'QualifiedLead' | 'QuoteProvided' | 'SaleWon';
  eventId: string;
  eventTime: Date;
  sourceUrl?: string | null;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  country?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  customData?: Record<string, unknown>;
}, fetchImpl: FetchLike = fetch): Promise<boolean> {
  const { env } = await import('../config/env.js');
  if (!env.META_CAPI_ACCESS_TOKEN) throw new MetaConversionError(undefined, 'not_configured');
  const settings = await input.prisma.siteSetting.findUnique({
    where: { id: 1 },
    select: { metaPixelId: true, siteBaseUrl: true },
  });
  const pixelId = clean(settings?.metaPixelId);
  if (!/^\d+$/.test(pixelId) || !settings?.siteBaseUrl) {
    throw new MetaConversionError(undefined, 'invalid_pixel_configuration');
  }
  const userData = buildMetaUserData(input);
  const endpoint = new URL(`https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${pixelId}/events`);
  endpoint.searchParams.set('access_token', env.META_CAPI_ACCESS_TOKEN);
  const sourcePath = resolveMetaEventSourcePath(input.sourceUrl);
  const body = JSON.stringify({
      data: [{
        event_name: input.eventName,
        event_id: input.eventId,
        event_time: Math.floor(input.eventTime.getTime() / 1000),
        event_source_url: new URL(sourcePath, settings.siteBaseUrl).toString(),
        action_source: 'website',
        user_data: userData,
        custom_data: input.customData ?? {},
      }],
  });
  await deliverMetaEvent(endpoint, body, fetchImpl);
  return true;
}
