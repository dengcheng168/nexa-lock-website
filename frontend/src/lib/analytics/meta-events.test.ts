import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMetaAdvancedMatching, buildMetaRouteEvents, sendMetaRouteEvents, waitForMetaPixelReady, type MetaRouteEvent } from './meta-events';

test('normalizes inquiry fields for Meta manual advanced matching', () => {
  assert.deepEqual(buildMetaAdvancedMatching({
    name: ' Alice Zhang ',
    email: ' Buyer@Example.com ',
    phone: '+86 138-0013-8000',
    country: 'CN',
  }), {
    em: 'buyer@example.com',
    ph: '8613800138000',
    fn: 'alice',
    ln: 'zhang',
    country: 'cn',
  });
});

test('omits empty and non-ISO country values from Meta manual matching', () => {
  assert.deepEqual(buildMetaAdvancedMatching({ name: 'Li', country: 'China' }), { fn: 'li' });
});

test('creates one PageView with an event ID for a regular page', () => {
  const events = buildMetaRouteEvents('/about', 'en', () => 'one');
  assert.deepEqual(events, [{
    command: 'track',
    name: 'PageView',
    parameters: { page_language: 'en', page_path: '/about' },
    eventID: 'pageview_one',
  }]);
});

test('creates PageView and one B2B product detail event for supported product routes', () => {
  const ids = ['one', 'two'];
  const events = buildMetaRouteEvents('/es/products/compact-ro-600g', 'es', () => ids.shift()!);
  assert.equal(events.length, 2);
  assert.deepEqual(events[1], {
    command: 'trackCustom',
    name: 'ProductDetailView',
    parameters: {
      content_type: 'product',
      content_ids: ['compact-ro-600g'],
      page_path: '/es/products/compact-ro-600g',
    },
    eventID: 'productdetailview_two',
  });
});

test('does not treat product indexes or categories as product detail views', () => {
  for (const pathname of ['/products', '/products/category/under-sink', '/es/products/category/under-sink']) {
    assert.equal(buildMetaRouteEvents(pathname, 'en', () => 'id').length, 1, pathname);
  }
});

test('never emits legacy or placeholder Meta event names', () => {
  const events = [
    ...buildMetaRouteEvents('/', 'en', () => 'home'),
    ...buildMetaRouteEvents('/products/compact-ro-600g', 'en', () => 'product'),
  ];
  assert.equal(events.some((event) => event.name === ('ViewContent' as MetaRouteEvent['name'])), false);
  assert.equal(events.some((event) => event.name === ('__missing_event' as MetaRouteEvent['name'])), false);
});

test('sends PageView as a standard event and product detail as a B2B custom event', () => {
  const calls: unknown[][] = [];
  const mirrored: MetaRouteEvent[] = [];
  const ids = ['page', 'product'];
  sendMetaRouteEvents({
    pathname: '/products/compact-ro-600g',
    locale: 'en',
    randomId: () => ids.shift()!,
    track: (...args) => { calls.push(args); },
    mirrorProductDetailView: (event) => { mirrored.push(event); },
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0][0], 'track');
  assert.equal(calls[0][1], 'PageView');
  assert.deepEqual(calls[0][3], { eventID: 'pageview_page' });
  assert.equal(calls[1][0], 'trackCustom');
  assert.equal(calls[1][1], 'ProductDetailView');
  assert.deepEqual(calls[1][3], { eventID: 'productdetailview_product' });
  assert.equal(mirrored.length, 1);
  assert.equal(mirrored[0].eventID, 'productdetailview_product');
});

test('delivers a delayed route event once after the Pixel readiness signal', () => {
  let ready = false;
  let listener: (() => void) | undefined;
  let sends = 0;
  const dispose = waitForMetaPixelReady({
    isReady: () => ready,
    addReadyListener: (next) => { listener = next; },
    removeReadyListener: (next) => { if (listener === next) listener = undefined; },
    send: () => { sends += 1; },
  });
  assert.equal(sends, 0);
  ready = true;
  listener?.();
  listener?.();
  assert.equal(sends, 1);
  dispose();
});

test('does not emit a route event after its React effect has been disposed', () => {
  let listener: (() => void) | undefined;
  let sends = 0;
  const dispose = waitForMetaPixelReady({
    isReady: () => false,
    addReadyListener: (next) => { listener = next; },
    removeReadyListener: () => {},
    send: () => { sends += 1; },
  });
  dispose();
  listener?.();
  assert.equal(sends, 0);
});
