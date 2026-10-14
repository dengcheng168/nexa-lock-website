import assert from 'node:assert/strict';
import test from 'node:test';
import { createMachineReadableResponse } from './machine-response';

const options = { contentLanguage: 'en', contentType: 'text/plain; charset=utf-8' };

test('machine-readable responses expose stable validators', async () => {
  const first = createMachineReadableResponse(new Request('https://example.com/llms.txt'), 'body', options);
  assert.equal(first.status, 200);
  assert.equal(await first.text(), 'body');
  assert.match(first.headers.get('etag') ?? '', /^"[A-Za-z0-9_-]+"$/);
  assert.equal(first.headers.get('cache-control'), 'public, max-age=300, stale-while-revalidate=3600');
  assert.equal(first.headers.get('x-robots-tag'), 'noindex, follow');
});

test('machine-readable responses return 304 for a matching ETag', async () => {
  const first = createMachineReadableResponse(new Request('https://example.com/llms.txt'), 'body', options);
  const etag = first.headers.get('etag') ?? '';
  const conditional = createMachineReadableResponse(
    new Request('https://example.com/llms.txt', { headers: { 'if-none-match': etag } }),
    'body',
    options,
  );
  assert.equal(conditional.status, 304);
  assert.equal(await conditional.text(), '');
});

test('machine-readable responses accept proxy-generated weak ETags', () => {
  const first = createMachineReadableResponse(new Request('https://example.com/llms.txt'), 'body', options);
  const etag = first.headers.get('etag') ?? '';
  const conditional = createMachineReadableResponse(
    new Request('https://example.com/llms.txt', { headers: { 'if-none-match': `W/${etag}` } }),
    'body',
    options,
  );
  assert.equal(conditional.status, 304);
});
