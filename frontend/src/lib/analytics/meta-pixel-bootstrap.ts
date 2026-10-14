/**
 * The exact browser bootstrap used by MetaPixel. Keeping it here makes the
 * inline Next Script independently executable in the lightweight regression
 * harness without replacing it with a second, simplified implementation.
 */
export function buildMetaPixelBootstrap(pixelId: string): string {
  return `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    window.__META_PIXEL_ID__ = '${pixelId}';
    function metaCookie(name) {
      var prefix = name + '=';
      var parts = (document.cookie || '').split(';');
      for (var i = 0; i < parts.length; i += 1) {
        var part = parts[i].trim();
        if (part.indexOf(prefix) === 0) return decodeURIComponent(part.slice(prefix.length));
      }
      return '';
    }
    function setMetaCookie(name, value, maxAge) {
      document.cookie = name + '=' + encodeURIComponent(value)
        + '; Path=/; Max-Age=' + maxAge + '; SameSite=Lax'
        + (window.location.protocol === 'https:' ? '; Secure' : '');
    }
    // Give CAPI a valid browser identifier even when a visitor clicks a
    // contact link before fbevents.js has finished creating _fbp.
    if (!metaCookie('_fbp')) {
      setMetaCookie('_fbp', 'fb.1.' + Date.now() + '.' + Math.floor(Math.random() * 10000000000), 7776000);
    }
    // A stable, non-PII first-party identifier improves Contact matching. The
    // server hashes it before transmission and never sends the raw value.
    if (!metaCookie('_meta_uid')) {
      setMetaCookie('_meta_uid', metaEventId('visitor'), 31536000);
    }
    // Use the stable anonymous first-party ID for browser advanced matching as
    // well as CAPI. Meta hashes browser matching values before transmission;
    // this raises match quality without collecting additional PII.
    fbq('init', '${pixelId}', { external_id: metaCookie('_meta_uid') });
    // Meta normally creates _fbc itself after an ad click. Persist it here as
    // a first-party fallback so an immediate server action can still forward
    // the click id to CAPI before fbevents.js has finished loading.
    var metaFbclid = new URLSearchParams(window.location.search || '').get('fbclid');
    if (metaFbclid && /^[A-Za-z0-9_-]{1,500}$/.test(metaFbclid) && !metaCookie('_fbc')) {
      var metaFbc = 'fb.1.' + Date.now() + '.' + metaFbclid;
      setMetaCookie('_fbc', metaFbc, 7776000);
    }
    function metaEventId(prefix) {
      return prefix + '_' + (
        window.crypto && typeof window.crypto.randomUUID === 'function'
          ? window.crypto.randomUUID()
          : Date.now().toString(36) + '_' + Math.random().toString(36).slice(2)
      );
    }
    function mirrorMetaContact(payload) {
      var body = JSON.stringify(payload);
      try {
        if (window.navigator && typeof window.navigator.sendBeacon === 'function') {
          var queued = window.navigator.sendBeacon(
            '/api/meta-events/contact',
            new Blob([body], { type: 'application/json' })
          );
          if (queued) return;
        }
        if (typeof window.fetch === 'function') {
          window.fetch('/api/meta-events/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body,
            keepalive: true,
            credentials: 'same-origin'
          }).catch(function() {});
        }
      } catch (_) {
        // Analytics is best-effort and must never interfere with navigation.
      }
    }
    window.__META_PIXEL_READY__ = true;
    window.dispatchEvent(new Event('meta-pixel-ready'));
    document.addEventListener('click', function(event) {
      var target = event.target;
      if (!(target instanceof Element)) return;
      var link = target.closest('a');
      if (!link || typeof window.fbq !== 'function') return;
      var href = link.href || '';
      var productMatch = window.location.pathname.match(/^\\/(?:es\\/)?products\\/([^/]+)$/);
      var contactContext = {
        page_path: window.location.pathname,
        contact_location: link.getAttribute('data-meta-contact-location') || link.getAttribute('aria-label') || 'link',
        ...(productMatch ? { content_type: 'product', content_ids: [decodeURIComponent(productMatch[1])] } : {})
      };
      var contactMethod = '';
      if (href.indexOf('wa.me/') !== -1 || href.indexOf('whatsapp') !== -1) {
        contactMethod = 'whatsapp_link';
      } else if (href.indexOf('mailto:') === 0) {
        contactMethod = 'email_link';
      } else if (href.indexOf('tel:') === 0) {
        contactMethod = 'phone_link';
      }
      if (!contactMethod) return;
      var eventId = metaEventId('contact');
      window.fbq('track', 'Contact', { ...contactContext, contact_method: contactMethod }, { eventID: eventId });
      mirrorMetaContact({
        eventId: eventId,
        sourcePath: window.location.pathname,
        contactMethod: contactMethod,
        contactLocation: contactContext.contact_location,
        ...(productMatch ? { productSlug: decodeURIComponent(productMatch[1]) } : {})
      });
    });
  `;
}
