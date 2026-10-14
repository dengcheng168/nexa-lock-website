import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildMetaUserData, resolveMetaEventSourcePath, sendMetaContactEvent, sendMetaInquiryEvents, sendMetaProductDetailViewEvent } from '../src/lib/meta-conversions.js';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

test('keeps Meta event source URLs on the configured website origin', () => {
  assert.equal(resolveMetaEventSourcePath('/products/ro-500'), '/products/ro-500');
  assert.equal(resolveMetaEventSourcePath('//attacker.example/path'), '/contact');
  assert.equal(resolveMetaEventSourcePath('https://attacker.example/path'), '/contact');
  assert.equal(resolveMetaEventSourcePath(undefined), '/contact');
});

test('sends one deduplicated Lead with normalized hashed customer data', async () => {
  let requestUrl = '';
  let requestBody = '';
  const fakeFetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
    requestUrl = String(input);
    requestBody = String(init?.body ?? '');
    return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
  }) as typeof fetch;

  const sent = await sendMetaInquiryEvents({
    pixelId: '1604635384436034',
    accessToken: 'server-only-token',
    apiVersion: 'v23.0',
    eventId: 'inquiry-123',
    eventTime: new Date('2026-09-14T10:00:00Z'),
    eventSourceUrl: 'https://koigatetech.com/contact',
    email: ' Buyer@Example.com ',
    phone: '+86 138-0013-8000',
    firstName: 'Alice Zhang',
    country: 'CN',
    fbp: 'fb.1.123.456',
    fbc: 'fb.1.123.click',
    clientIpAddress: '203.0.113.9',
    clientUserAgent: 'Example Browser',
    productName: 'RO System',
  }, fakeFetch);

  assert.equal(sent, true);
  const url = new URL(requestUrl);
  assert.equal(url.pathname, '/v23.0/1604635384436034/events');
  assert.equal(url.searchParams.get('access_token'), 'server-only-token');
  const body = JSON.parse(requestBody);
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].event_name, 'Lead');
  assert.equal(body.data[0].event_id, 'inquiry-123');
  assert.deepEqual(body.data[0].user_data.em, [sha256('buyer@example.com')]);
  assert.deepEqual(body.data[0].user_data.ph, [sha256('8613800138000')]);
  assert.deepEqual(body.data[0].user_data.fn, [sha256('alice')]);
  assert.deepEqual(body.data[0].user_data.ln, [sha256('zhang')]);
  assert.deepEqual(body.data[0].user_data.external_id, [sha256('buyer@example.com')]);
  assert.deepEqual(body.data[0].user_data.country, [sha256('cn')]);
  assert.equal(body.data[0].user_data.client_ip_address, '203.0.113.9');
  assert.equal(body.data[0].user_data.client_user_agent, 'Example Browser');
  assert.equal(requestBody.includes('Buyer@Example.com'), false);
  assert.equal(requestBody.includes('+86 138-0013-8000'), false);
});

test('mirrors Contact with the browser event id and request attribution', async () => {
  let requestBody = '';
  const fakeFetch = (async (_input: URL | RequestInfo, init?: RequestInit) => {
    requestBody = String(init?.body ?? '');
    return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
  }) as typeof fetch;

  const sent = await sendMetaContactEvent({
    pixelId: '1604635384436034',
    accessToken: 'server-only-token',
    eventId: 'contact-id-123',
    eventTime: new Date('2026-10-06T09:00:00Z'),
    eventSourceUrl: 'https://koigatetech.com/products/compact-ro-600g',
    contactMethod: 'whatsapp_link',
    contactLocation: 'product_cta',
    productSlug: 'compact-ro-600g',
    fbp: 'fb.1.123.456',
    fbc: 'fb.1.123.click',
    clientIpAddress: '203.0.113.9',
    clientUserAgent: 'Example Browser',
    clientExternalId: 'visitor_stable-123',
  }, fakeFetch);

  assert.equal(sent, true);
  const body = JSON.parse(requestBody);
  assert.equal(body.data[0].event_name, 'Contact');
  assert.equal(body.data[0].event_id, 'contact-id-123');
  assert.equal(body.data[0].user_data.fbp, 'fb.1.123.456');
  assert.equal(body.data[0].user_data.fbc, 'fb.1.123.click');
  assert.equal(body.data[0].user_data.client_ip_address, '203.0.113.9');
  assert.deepEqual(body.data[0].user_data.external_id, [sha256('visitor_stable-123')]);
  assert.equal(requestBody.includes('visitor_stable-123'), false);
  assert.equal(body.data[0].custom_data.contact_method, 'whatsapp_link');
  assert.deepEqual(body.data[0].custom_data.content_ids, ['compact-ro-600g']);
  assert.equal(requestBody.includes('__missing_event'), false);
});

test('mirrors ProductDetailView with the browser event id', async () => {
  let requestBody = '';
  const fakeFetch = (async (_input: URL | RequestInfo, init?: RequestInit) => {
    requestBody = String(init?.body ?? '');
    return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
  }) as typeof fetch;

  const sent = await sendMetaProductDetailViewEvent({
    pixelId: '1604635384436034',
    accessToken: 'server-only-token',
    eventId: 'productdetailview-id-123',
    eventTime: new Date('2026-10-08T09:00:00Z'),
    eventSourceUrl: 'https://koigatetech.com/products/compact-ro-600g',
    productSlug: 'compact-ro-600g',
    fbp: 'fb.1.123.456',
    clientExternalId: 'visitor_stable-123',
  }, fakeFetch);

  assert.equal(sent, true);
  const body = JSON.parse(requestBody);
  assert.equal(body.data[0].event_name, 'ProductDetailView');
  assert.equal(body.data[0].event_id, 'productdetailview-id-123');
  assert.deepEqual(body.data[0].custom_data.content_ids, ['compact-ro-600g']);
  assert.deepEqual(body.data[0].user_data.external_id, [sha256('visitor_stable-123')]);
});

test('retries a transient Contact delivery with the same event id', async () => {
  let calls = 0;
  const eventIds: string[] = [];
  const fakeFetch = (async (_input: URL | RequestInfo, init?: RequestInit) => {
    calls += 1;
    eventIds.push(JSON.parse(String(init?.body)).data[0].event_id);
    return calls === 1
      ? new Response(JSON.stringify({ error: { code: 4 } }), { status: 500 })
      : new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
  }) as typeof fetch;

  const sent = await sendMetaContactEvent({
    pixelId: '1604635384436034', accessToken: 'token', eventId: 'contact-retry-1',
    eventTime: new Date(), eventSourceUrl: 'https://koigatetech.com/contact',
    contactMethod: 'email_link',
  }, fakeFetch);

  assert.equal(sent, true);
  assert.equal(calls, 2);
  assert.deepEqual(eventIds, ['contact-retry-1', 'contact-retry-1']);
});

test('retries a ProductDetailView network failure and does not retry a client error', async () => {
  let transientCalls = 0;
  const transientFetch = (async () => {
    transientCalls += 1;
    if (transientCalls === 1) throw new TypeError('connection reset');
    return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
  }) as typeof fetch;
  const base = {
    pixelId: '1604635384436034', accessToken: 'token', eventId: 'view-retry-1',
    eventTime: new Date(), eventSourceUrl: 'https://koigatetech.com/products/model', productSlug: 'model',
  };
  assert.equal(await sendMetaProductDetailViewEvent(base, transientFetch), true);
  assert.equal(transientCalls, 2);

  let clientErrorCalls = 0;
  const clientErrorFetch = (async () => {
    clientErrorCalls += 1;
    return new Response(JSON.stringify({ error: { code: 100 } }), { status: 400 });
  }) as typeof fetch;
  assert.equal(await sendMetaProductDetailViewEvent(base, clientErrorFetch), false);
  assert.equal(clientErrorCalls, 1);
});

test('normalizes common country names for Meta advanced matching', async () => {
  let requestBody = '';
  const fakeFetch = (async (_input: URL | RequestInfo, init?: RequestInit) => {
    requestBody = String(init?.body ?? '');
    return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
  }) as typeof fetch;

  await sendMetaInquiryEvents({
    pixelId: '1604635384436034',
    accessToken: 'server-only-token',
    eventId: 'inquiry-country-name',
    eventTime: new Date('2026-09-17T10:00:00Z'),
    eventSourceUrl: 'https://koigatetech.com/contact',
    email: 'buyer@example.com',
    firstName: 'Alice Zhang',
    country: 'China',
  }, fakeFetch);

  const body = JSON.parse(requestBody);
  assert.deepEqual(body.data[0].user_data.country, [sha256('cn')]);
  assert.deepEqual(body.data[0].user_data.ln, [sha256('zhang')]);
});

test('builds CRM quality matching data with persisted browser attribution', () => {
  const userData = buildMetaUserData({
    email: 'buyer@example.com',
    phone: '+86 138-0013-8000',
    firstName: 'Alice Zhang',
    country: 'China',
    fbp: 'fb.1.123.456',
    fbc: 'fb.1.123.click',
    clientIpAddress: '203.0.113.9',
    clientUserAgent: 'Example Browser',
  });

  assert.equal(userData.fbp, 'fb.1.123.456');
  assert.equal(userData.fbc, 'fb.1.123.click');
  assert.equal(userData.client_ip_address, '203.0.113.9');
  assert.equal(userData.client_user_agent, 'Example Browser');
  assert.deepEqual(userData.em, [sha256('buyer@example.com')]);
  assert.deepEqual(userData.ph, [sha256('8613800138000')]);
});

test('does nothing without valid server-side credentials', async () => {
  let calls = 0;
  const fakeFetch = (async () => {
    calls += 1;
    return new Response(null, { status: 200 });
  }) as typeof fetch;
  const base = {
    eventId: 'inquiry-123',
    eventTime: new Date(),
    eventSourceUrl: 'https://koigatetech.com/contact',
    email: 'buyer@example.com',
  };
  assert.equal(await sendMetaInquiryEvents(base, fakeFetch), false);
  assert.equal(await sendMetaInquiryEvents({ ...base, pixelId: 'bad', accessToken: 'token' }, fakeFetch), false);
  assert.equal(calls, 0);
});

test('retries a transient Meta error once and surfaces a safe error', async () => {
  let calls = 0;
  const fakeFetch = (async () => {
    calls += 1;
    return new Response(JSON.stringify({ error: { code: 4 } }), { status: 500 });
  }) as typeof fetch;
  await assert.rejects(
    sendMetaInquiryEvents({
      pixelId: '1604635384436034', accessToken: 'token', eventId: 'inquiry-123',
      eventTime: new Date(), eventSourceUrl: 'https://koigatetech.com/contact', email: 'buyer@example.com',
    }, fakeFetch),
    /Meta CAPI delivery failed \(500\): meta_4/,
  );
  assert.equal(calls, 2);
});

test('rejects a successful response that does not acknowledge the expected event', async () => {
  const fakeFetch = (async () => new Response(null, { status: 500 })) as typeof fetch;
  await assert.rejects(
    sendMetaInquiryEvents({
      pixelId: '1604635384436034',
      accessToken: 'token',
      eventId: 'inquiry-123',
      eventTime: new Date(),
      eventSourceUrl: 'https://koigatetech.com/contact',
      email: 'buyer@example.com',
    }, fakeFetch),
    /Meta CAPI delivery failed \(500\): http_error/,
  );
});
