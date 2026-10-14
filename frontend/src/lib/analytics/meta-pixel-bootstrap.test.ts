import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { buildMetaPixelBootstrap } from './meta-pixel-bootstrap';

type FbqCall = unknown[];

class HarnessElement {
  constructor(
    readonly href = '',
    private readonly attributes: Record<string, string> = {},
  ) {}

  closest(selector: string) {
    return selector === 'a' ? this : null;
  }

  getAttribute(name: string) {
    return this.attributes[name] ?? null;
  }
}

function runHarness(pathname: string, search = '', initialCookie = '') {
  const clickHandlers: Array<(event: { target: HarnessElement }) => void> = [];
  const readyHandlers: Array<() => void> = [];
  const insertedScripts: Array<{ src?: string; async?: boolean }> = [];
  const beacons: Array<{ url: string; body: string }> = [];
  const browser = {
    location: { pathname, search, protocol: 'https:' },
    crypto: { randomUUID: (() => {
      let id = 0;
      return () => `id-${++id}`;
    })() },
    addEventListener: (name: string, handler: () => void) => {
      if (name === 'meta-pixel-ready') readyHandlers.push(handler);
    },
    dispatchEvent: (event: { type: string }) => {
      if (event.type === 'meta-pixel-ready') readyHandlers.forEach((handler) => handler());
    },
    navigator: {
      sendBeacon: (url: string, body: { text: () => Promise<string> }) => {
        void body.text().then((text) => beacons.push({ url, body: text }));
        return true;
      },
    },
  };
  const cookieJar = new Map(
    initialCookie.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
      const separator = part.indexOf('=');
      return [part.slice(0, separator), part.slice(separator + 1)];
    }),
  );
  const document = {
    get cookie() { return [...cookieJar].map(([name, value]) => `${name}=${value}`).join('; '); },
    set cookie(value: string) {
      const pair = value.split(';', 1)[0];
      const separator = pair.indexOf('=');
      cookieJar.set(pair.slice(0, separator), pair.slice(separator + 1));
    },
    createElement: () => ({}),
    getElementsByTagName: () => [{ parentNode: { insertBefore: (script: { src?: string; async?: boolean }) => insertedScripts.push(script) } }],
    addEventListener: (name: string, handler: (event: { target: HarnessElement }) => void) => {
      if (name === 'click') clickHandlers.push(handler);
    },
  };
  const context = browser as typeof browser & Record<string, unknown> & {
    window: typeof browser;
    document: typeof document;
    Element: typeof HarnessElement;
    Event: new (type: string) => { type: string };
    decodeURIComponent: typeof decodeURIComponent;
  };
  context.window = browser;
  context.document = document;
  context.Element = HarnessElement;
  context.Event = class { constructor(readonly type: string) {} };
  context.decodeURIComponent = decodeURIComponent;
  context.URLSearchParams = URLSearchParams;
  context.encodeURIComponent = encodeURIComponent;
  context.Blob = Blob;
  context.Date = class extends Date { static now() { return 1_700_000_000_000; } } as DateConstructor;
  vm.runInNewContext(buildMetaPixelBootstrap('1604635384436034'), context);

  const fbq = context.fbq as ((...args: unknown[]) => void) & { queue: FbqCall[] };
  const drainCalls = () => Array.from(fbq.queue, (call) => Array.from(call));
  const click = (href: string, attributes?: Record<string, string>) => {
    clickHandlers.forEach((handler) => handler({ target: new HarnessElement(href, attributes) }));
  };
  return { click, drainCalls, insertedScripts, readyHandlers, beacons, browser: context };
}

test('runs the exact MetaPixel bootstrap once and establishes the readiness bridge', () => {
  const harness = runHarness('/');
  assert.equal(harness.browser['__META_PIXEL_ID__'], '1604635384436034');
  assert.equal(harness.browser['__META_PIXEL_READY__'], true);
  assert.match(String(harness.browser.document.cookie), /(?:^|; )_fbp=fb\.1\.1700000000000\.\d+/);
  assert.match(String(harness.browser.document.cookie), /(?:^|; )_meta_uid=visitor_id-1/);
  assert.equal(typeof harness.browser.fbq, 'function');
  const initCalls = harness.drainCalls();
  assert.equal(initCalls.length, 1);
  assert.equal(initCalls[0][0], 'init');
  assert.equal(initCalls[0][1], '1604635384436034');
  assert.equal((initCalls[0][2] as Record<string, unknown>).external_id, 'visitor_id-1');
  assert.equal(harness.insertedScripts.length, 1);
  assert.equal(harness.insertedScripts[0].src, 'https://connect.facebook.net/en_US/fbevents.js');
});

test('bootstrap cannot reintroduce legacy or placeholder event names', () => {
  const script = buildMetaPixelBootstrap('1604635384436034');
  assert.equal(script.includes('ViewContent'), false);
  assert.equal(script.includes('__missing_event'), false);
});

test('sends exactly one Contact for one WhatsApp click with product context and an event ID', () => {
  const harness = runHarness('/products/compact-ro-600g');
  harness.click('https://wa.me/123456', { 'data-meta-contact-location': 'product_cta' });
  const calls = harness.drainCalls();
  assert.equal(calls.length, 2);
  assert.equal(calls[1][0], 'track');
  assert.equal(calls[1][1], 'Contact');
  const parameters = calls[1][2] as Record<string, unknown>;
  const options = calls[1][3] as Record<string, unknown>;
  assert.equal(parameters.page_path, '/products/compact-ro-600g');
  assert.equal(parameters.contact_location, 'product_cta');
  assert.equal(parameters.content_type, 'product');
  assert.deepEqual(Array.from(parameters.content_ids as string[]), ['compact-ro-600g']);
  assert.equal(parameters.contact_method, 'whatsapp_link');
  assert.equal(options.eventID, 'contact_id-2');
});

test('mirrors a Contact click to CAPI with the same non-empty event ID', async () => {
  const harness = runHarness('/products/compact-ro-600g');
  harness.click('mailto:sales@example.com', { 'aria-label': 'email_sales' });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(harness.beacons.length, 1);
  assert.equal(harness.beacons[0].url, '/api/meta-events/contact');
  const payload = JSON.parse(harness.beacons[0].body);
  assert.equal(payload.eventId, 'contact_id-2');
  assert.equal(payload.contactMethod, 'email_link');
  assert.equal(payload.contactLocation, 'email_sales');
  assert.equal(payload.productSlug, 'compact-ro-600g');
});

test('does not send Contact for a non-contact click', () => {
  const harness = runHarness('/');
  harness.click('https://koigatetech.com/products');
  const calls = harness.drainCalls();
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'init');
  assert.equal(calls[0][1], '1604635384436034');
  assert.equal((calls[0][2] as Record<string, unknown>).external_id, 'visitor_id-1');
});

test('persists a valid fbclid as a first-party _fbc fallback for immediate CAPI use', () => {
  const harness = runHarness('/', '?utm_source=meta&fbclid=AbC_123-xyz');
  assert.match(String(harness.browser.document.cookie), /(?:^|; )_fbc=fb\.1\.1700000000000\.AbC_123-xyz(?:;|$)/);
  assert.match(buildMetaPixelBootstrap('1604635384436034'), /SameSite=Lax/);
});

test('does not overwrite an existing _fbc or persist an invalid fbclid', () => {
  const existing = runHarness('/', '?fbclid=new-click', '_fbp=one; _fbc=fb.1.1.existing');
  assert.match(String(existing.browser.document.cookie), /(?:^|; )_fbc=fb\.1\.1\.existing(?:;|$)/);
  assert.doesNotMatch(String(existing.browser.document.cookie), /new-click/);
  const invalid = runHarness('/', '?fbclid=%3Cscript%3E');
  assert.doesNotMatch(String(invalid.browser.document.cookie), /(?:^|; )_fbc=/);
});

test('reuses an existing anonymous external ID instead of rotating it', () => {
  const harness = runHarness('/', '', '_meta_uid=visitor_existing-123');
  const initCall = harness.drainCalls()[0];
  assert.equal(initCall[0], 'init');
  assert.equal(initCall[1], '1604635384436034');
  assert.equal((initCall[2] as Record<string, unknown>).external_id, 'visitor_existing-123');
  assert.match(String(harness.browser.document.cookie), /(?:^|; )_meta_uid=visitor_existing-123(?:;|$)/);
});
