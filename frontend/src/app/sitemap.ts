import type { MetadataRoute } from 'next';
import type { ApiMeta } from '@/lib/api/client';
import { listProducts, listProductCategories } from '@/lib/api/products';
import { listBlogPosts } from '@/lib/api/blog';
import { absoluteUrl, getSiteUrl } from '@/lib/seo/site';
import { localeHref } from '@/lib/i18n/paths';
import { excludeSitemapRedirects } from '@/lib/seo/sitemap-redirects';
import { latestLastModified } from '@/lib/seo/last-modified';

export const dynamic = 'force-dynamic';

const staticPaths = [
  '',
  '/products',
  '/certificates',
  '/about',
  '/blog',
  '/faq',
  '/contact',
  '/privacy-policy',
  '/terms-of-use',
];

// 必须等于后端 MAX_PAGE_SIZE（backend/src/config/constants.ts），传更大的值会被 zod 校验拒绝（400）
const MAX_PAGE_SIZE = 100;

/**
 * 按页拉全量数据，不再用单次 pageSize:100 兜底——产品/文章总数一旦超过 100 条，
 * 之前的写法会静默漏掉后面的条目，sitemap 却不会报任何错，很难发现。
 */
async function fetchAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<{ items: T[]; meta?: ApiMeta }>,
): Promise<T[]> {
  const first = await fetchPage(1, MAX_PAGE_SIZE);
  const items = [...first.items];
  const totalPages = first.meta?.totalPages ?? 1;
  for (let page = 2; page <= totalPages; page++) {
    const next = await fetchPage(page, MAX_PAGE_SIZE);
    items.push(...next.items);
  }
  return items;
}

/** 每个英文路径生成一条 en 条目和一条 es 条目，互相通过 alternates.languages 关联。 */
async function bilingualEntry(
  path: string,
  extra: Pick<MetadataRoute.Sitemap[number], 'changeFrequency' | 'priority'>,
  lastModified?: { en?: string; es?: string },
): Promise<MetadataRoute.Sitemap> {
  // localeHref 只认 '/' 开头的路径（空字符串会被当成外部链接原样返回，见 lib/i18n/paths.ts
  // 的注释），首页在这份 sitemap 里用 '' 表示，所以调用前要先规整成 '/'
  const [enUrl, esUrl] = await Promise.all([
    path === '' ? getSiteUrl() : absoluteUrl(path),
    absoluteUrl(localeHref(path === '' ? '/' : path, 'es')),
  ]);
  const languages = { en: enUrl, es: esUrl, 'x-default': enUrl };
  const enLastModDate = lastModified?.en ? new Date(lastModified.en) : undefined;
  const esLastModDate = lastModified?.es ? new Date(lastModified.es) : undefined;
  return [
    { url: enUrl, alternates: { languages }, lastModified: enLastModDate, ...extra },
    { url: esUrl, alternates: { languages }, lastModified: esLastModDate, ...extra },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, posts, esCategories, esProducts, esPosts] = await Promise.all([
    listProductCategories(),
    fetchAllPages((page, pageSize) => listProducts({ page, pageSize })),
    fetchAllPages((page, pageSize) => listBlogPosts({ page, pageSize })),
    listProductCategories('es'),
    fetchAllPages((page, pageSize) => listProducts({ page, pageSize }, 'es')),
    fetchAllPages((page, pageSize) => listBlogPosts({ page, pageSize }, 'es')),
  ]);

  const esCategoryById = new Map(esCategories.map((item) => [item.id, item]));
  const esProductById = new Map(esProducts.map((item) => [item.id, item]));
  const esPostById = new Map(esPosts.map((item) => [item.id, item]));

  // 没有任何已发布产品的分类不进 sitemap——避免搜索引擎收录一个客户点进去空手而归的页面
  const categoryIdsWithProducts = new Set(products.map((p) => p.categoryId));
  const visibleCategories = categories.filter((category) => categoryIdsWithProducts.has(category.id));
  const productCatalogLastModified = latestLastModified(visibleCategories, products);
  const esProductCatalogLastModified = latestLastModified(esCategories, esProducts);
  const blogLastModified = latestLastModified(posts);
  const esBlogLastModified = latestLastModified(esPosts);
  const siteLastModified = latestLastModified(visibleCategories, products, posts);
  const esSiteLastModified = latestLastModified(esCategories, esProducts, esPosts);

  const staticLastModified = (path: string): { en?: string; es?: string } | undefined => {
    if (path === '') return { en: siteLastModified?.toISOString(), es: esSiteLastModified?.toISOString() };
    if (path === '/products') return { en: productCatalogLastModified?.toISOString(), es: esProductCatalogLastModified?.toISOString() };
    if (path === '/blog') return { en: blogLastModified?.toISOString(), es: esBlogLastModified?.toISOString() };
    return undefined;
  };

  const entryGroups = await Promise.all([
    ...staticPaths.map((path) => bilingualEntry(
      path,
      { changeFrequency: path === '' ? 'daily' : 'weekly', priority: path === '' ? 1 : 0.7 },
      staticLastModified(path),
    )),
    ...visibleCategories.map((category) =>
      bilingualEntry(`/products/category/${category.slug}`, { changeFrequency: 'weekly', priority: 0.6 }, {
        en: category.updatedAt,
        es: esCategoryById.get(category.id)?.localizedUpdatedAt ?? category.updatedAt,
      }),
    ),
    ...products.map((product) =>
      bilingualEntry(`/products/${product.slug}`, { changeFrequency: 'weekly', priority: 0.6 }, {
        en: product.updatedAt,
        es: esProductById.get(product.id)?.localizedUpdatedAt ?? product.updatedAt,
      }),
    ),
    ...posts.map((post) => bilingualEntry(`/blog/${post.slug}`, { changeFrequency: 'monthly', priority: 0.5 }, {
      en: post.updatedAt,
      es: esPostById.get(post.id)?.localizedUpdatedAt ?? post.updatedAt,
    })),
  ]);

  return excludeSitemapRedirects(entryGroups.flat());
}
