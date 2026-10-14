import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getBlogPostBySlug, localizePost } from './blog';
import { ApiError } from './client';

test('localized post keeps the translation timestamp for sitemap lastmod', () => {
  const post = {
    id: 1,
    title: 'English title',
    updatedAt: '2026-09-01T00:00:00.000Z',
    translation: {
      title: 'Título en español',
      updatedAt: '2026-10-11T00:00:00.000Z',
    },
  } as Parameters<typeof localizePost>[0];

  const localized = localizePost(post);
  assert.equal(localized.title, 'Título en español');
  assert.equal(localized.localizedUpdatedAt, '2026-10-11T00:00:00.000Z');
});

test('only an upstream 404 is treated as a missing blog post', async (t) => {
  let status = 404;
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    success: false,
    error: { message: 'upstream test error' },
  }), { status }));

  for (const locale of ['en', 'es'] as const) {
    status = 404;
    assert.equal(await getBlogPostBySlug('existing-post', locale), null);

    for (status of [429, 500, 503]) {
      await assert.rejects(
        getBlogPostBySlug('existing-post', locale),
        (error: unknown) => error instanceof ApiError && error.status === status,
      );
    }
  }
});

test('network failures do not become blog not-found results', async (t) => {
  const failure = new TypeError('simulated connection failure');
  t.mock.method(globalThis, 'fetch', async () => { throw failure; });
  await assert.rejects(getBlogPostBySlug('existing-post'), (error: unknown) => error === failure);
});
