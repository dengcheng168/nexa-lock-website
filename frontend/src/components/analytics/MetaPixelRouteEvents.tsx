'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { sendMetaRouteEvents, waitForMetaPixelReady } from '@/lib/analytics/meta-events';

declare global {
  interface Window {
    __META_PIXEL_READY__?: boolean;
  }
}

function trackRoute(pathname: string, locale: string) {
  if (typeof window.fbq !== 'function') return;
  const randomId = () => typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  sendMetaRouteEvents({
    pathname,
    locale,
    randomId,
    track: window.fbq,
    mirrorProductDetailView: (event) => {
      const productSlug = event.parameters.content_ids?.[0];
      if (typeof productSlug !== 'string') return;
      const body = JSON.stringify({ eventId: event.eventID, sourcePath: pathname, productSlug });
      try {
        if (typeof navigator.sendBeacon === 'function'
          && navigator.sendBeacon('/api/meta-events/product-detail-view', new Blob([body], { type: 'application/json' }))) {
          return;
        }
        fetch('/api/meta-events/product-detail-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
          credentials: 'same-origin',
        }).catch(() => {});
      } catch {
        // Analytics is best-effort and must never affect product navigation.
      }
    },
  });
}

/** Sends page events after the Pixel bootstrap signals readiness, including App Router transitions. */
export function MetaPixelRouteEvents({ locale }: { locale: string }) {
  const pathname = usePathname();
  const sentPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (sentPathRef.current === pathname) return;

    const send = () => {
      if (sentPathRef.current === pathname || typeof window.fbq !== 'function') return;
      sentPathRef.current = pathname;
      trackRoute(pathname, locale);
    };
    return waitForMetaPixelReady({
      isReady: () => !!window.__META_PIXEL_READY__,
      addReadyListener: (listener) => window.addEventListener('meta-pixel-ready', listener, { once: true }),
      removeReadyListener: (listener) => window.removeEventListener('meta-pixel-ready', listener),
      send,
    });
  }, [locale, pathname]);

  return null;
}
