import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getProductCategoryBySlug, getProductBySlug, listProducts, localizeProduct } from './products';
import { ApiError } from './client';

test('localized product keeps the translation timestamp for sitemap lastmod', () => {
  const product = {
    id: 1,
    name: 'English name',
    updatedAt: '2026-09-01T00:00:00.000Z',
    translation: {
      name: 'Nombre en español',
      updatedAt: '2026-10-10T00:00:00.000Z',
    },
  } as Parameters<typeof localizeProduct>[0];

  const localized = localizeProduct(product);
  assert.equal(localized.name, 'Nombre en español');
  assert.equal(localized.localizedUpdatedAt, '2026-10-10T00:00:00.000Z');
});

test('only upstream 404 is treated as missing; rate limits and outages propagate in both languages', async (t) => {
  let status = 404;
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    success: false, error: { message: 'upstream test error' },
  }), { status }));
  for (const locale of ['en', 'es'] as const) {
    for (const read of [
      () => getProductBySlug('existing-product', locale),
      () => getProductCategoryBySlug('existing-category', {}, locale),
    ]) {
      status = 404;
      assert.equal(await read(), null);
      for (status of [429, 500, 503]) {
        await assert.rejects(read(), (error: unknown) => error instanceof ApiError && error.status === status);
      }
    }
  }
});

test('network failures do not become product or category not-found results', async (t) => {
  const failure = new TypeError('simulated connection failure');
  t.mock.method(globalThis, 'fetch', async () => { throw failure; });
  await assert.rejects(getProductBySlug('existing-product'), (error: unknown) => error === failure);
  await assert.rejects(getProductCategoryBySlug('existing-category'), (error: unknown) => error === failure);
});

test('产品与分类变更后，关联页面不再复用旧响应；西语刷新不影响英文缓存', async (t) => {
  let revision = 1;
  const cache = new Map<string, { tags: string[]; body: string }>();
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit & { next?: { tags?: string[] } }) => {
    const url = String(input);
    let cached = cache.get(url);
    if (!cached) {
      const category = { id: 1, slug: 'ro', name: `Category ${revision}`, image: null };
      const product = { id: 1, slug: 'filter', name: `Product ${revision}`, categoryId: 1, category, mainImage: '/uploads/product.webp', galleryImages: [] };
      const pathname = new URL(url).pathname;
      const data = pathname.includes('/product-categories/')
        ? { category, products: [product] }
        : pathname.endsWith('/products/filter') ? { product, related: [] } : [product];
      cached = { tags: init?.next?.tags ?? [], body: JSON.stringify({ success: true, data }) };
      cache.set(url, cached);
    }
    return new Response(cached.body, { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  const invalidate = (tag: string) => {
    for (const [url, entry] of cache) if (entry.tags.includes(tag)) cache.delete(url);
  };

  assert.equal((await getProductCategoryBySlug('ro'))?.products[0].name, 'Product 1');
  revision = 2;
  invalidate('products'); // 后台产品保存、上下架、删除和排序均使用此标签。
  assert.equal((await getProductCategoryBySlug('ro'))?.products[0].name, 'Product 2');

  await listProducts();
  await getProductBySlug('filter');
  revision = 3;
  invalidate('product-categories');
  assert.equal((await listProducts()).items[0].category?.name, 'Category 3');
  assert.equal((await getProductBySlug('filter'))?.product.category?.name, 'Category 3');

  await getProductCategoryBySlug('ro', {}, 'es');
  await getProductCategoryBySlug('ro', {}, 'en');
  await getProductBySlug('filter', 'es');
  revision = 4;
  invalidate('products:es');
  assert.equal((await getProductCategoryBySlug('ro', {}, 'es'))?.products[0].name, 'Product 4');
  assert.equal((await getProductBySlug('filter', 'es'))?.product.name, 'Product 4');
  assert.equal((await getProductCategoryBySlug('ro', {}, 'en'))?.products[0].name, 'Product 3');

  await listProducts({}, 'es');
  revision = 5;
  invalidate('product-categories:es');
  assert.equal((await listProducts({}, 'es')).items[0].category?.name, 'Category 5');
  assert.equal((await getProductBySlug('filter', 'es'))?.product.category?.name, 'Category 5');
  assert.equal((await getProductBySlug('filter', 'en'))?.product.category?.name, 'Category 3');
});
