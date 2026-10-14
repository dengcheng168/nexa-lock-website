export type MetaRouteEvent = {
  command: 'track' | 'trackCustom';
  name: 'PageView' | 'ProductDetailView';
  parameters: Record<string, string | string[]>;
  eventID: string;
};

export function createMetaEventId(prefix: string, randomId: () => string): string {
  return `${prefix}_${randomId()}`;
}

export function buildMetaAdvancedMatching(input: {
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
}): Record<string, string> {
  const result: Record<string, string> = {};
  const email = input.email?.trim().toLowerCase();
  if (email) result.em = email;
  const phone = input.phone?.replace(/\D/g, '');
  if (phone) result.ph = phone;
  const nameParts = input.name?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  if (nameParts[0]) result.fn = nameParts[0];
  if (nameParts.length > 1) result.ln = nameParts.at(-1)!;
  const country = input.country?.trim().toLowerCase();
  if (country && /^[a-z]{2}$/.test(country)) result.country = country;
  return result;
}

/** Builds the page events once per eligible App Router pathname. */
export function buildMetaRouteEvents(
  pathname: string,
  locale: string,
  randomId: () => string,
): MetaRouteEvent[] {
  const events: MetaRouteEvent[] = [{
    command: 'track',
    name: 'PageView',
    parameters: { page_language: locale, page_path: pathname },
    eventID: createMetaEventId('pageview', randomId),
  }];
  const productMatch = pathname.match(/^\/(?:es\/)?products\/([^/]+)$/);
  if (productMatch) {
    events.push({
      command: 'trackCustom',
      name: 'ProductDetailView',
      parameters: {
        content_type: 'product',
        content_ids: [decodeURIComponent(productMatch[1])],
        page_path: pathname,
      },
      eventID: createMetaEventId('productdetailview', randomId),
    });
  }
  return events;
}

/** Sends the events built above through the real fbq call shape. */
export function sendMetaRouteEvents(input: {
  pathname: string;
  locale: string;
  randomId: () => string;
  track: (command: MetaRouteEvent['command'], name: MetaRouteEvent['name'], parameters: MetaRouteEvent['parameters'], options: { eventID: string }) => void;
  mirrorProductDetailView?: (event: MetaRouteEvent) => void;
}): void {
  for (const event of buildMetaRouteEvents(input.pathname, input.locale, input.randomId)) {
    input.track(event.command, event.name, event.parameters, { eventID: event.eventID });
    if (event.name === 'ProductDetailView') input.mirrorProductDetailView?.(event);
  }
}

/** Schedules one route-send without losing it when the Pixel bootstrap is delayed. */
export function waitForMetaPixelReady(input: {
  isReady: () => boolean;
  addReadyListener: (listener: () => void) => void;
  removeReadyListener: (listener: () => void) => void;
  send: () => void;
}): () => void {
  let disposed = false;
  let sent = false;
  const sendOnce = () => {
    if (disposed || sent) return;
    sent = true;
    input.send();
  };
  if (input.isReady()) sendOnce();
  else input.addReadyListener(sendOnce);
  return () => {
    disposed = true;
    input.removeReadyListener(sendOnce);
  };
}
