import { cache } from 'react';
import { apiFetch, ApiError, type ApiMeta } from './client';
import { resolveMediaUrl } from '@/lib/utils/media';
import type { Product, ProductCategory } from '@/types/product';
import type { Locale } from '@/lib/i18n/locales';
import { resolveLocalizedEntity, localeQueryParam, localizedTag } from '@/lib/i18n/localize';
import { localeHref } from '@/lib/i18n/paths';
import { publicRedirectSourcePaths } from '@/lib/seo/sitemap-redirects';

export interface ProductListParams {
  category?: string;
  featured?: boolean;
  q?: string;
  page?: number;
  pageSize?: number;
}

type WithTranslation<T> = T & { translation?: Partial<T> | null };

const PRODUCT_TRANSLATABLE_FIELDS: (keyof Product)[] = [
  'name',
  'shortDescription',
  'description',
  'features',
  'specs',
  'applications',
  'packagingInfo',
  'moq',
  'seoTitle',
  'seoDescription',
  'seoKeywords',
];

const CATEGORY_TRANSLATABLE_FIELDS: (keyof ProductCategory)[] = ['name', 'description', 'seoTitle', 'seoDescription'];

export function localizeProduct(product: WithTranslation<Product>): Product {
  const { translation, ...base } = product;
  return {
    ...resolveLocalizedEntity(base as Product, translation, PRODUCT_TRANSLATABLE_FIELDS),
    localizedUpdatedAt: translation?.updatedAt ?? base.updatedAt,
  };
}

function localizeCategory(category: WithTranslation<ProductCategory>): ProductCategory {
  const { translation, ...base } = category;
  return {
    ...resolveLocalizedEntity(base as ProductCategory, translation, CATEGORY_TRANSLATABLE_FIELDS),
    localizedUpdatedAt: translation?.updatedAt ?? base.updatedAt,
  };
}

export function resolveProductMedia(product: Product): Product {
  return {
    ...product,
    mainImage: resolveMediaUrl(product.mainImage),
    ogImage: product.ogImage ? resolveMediaUrl(product.ogImage) : product.ogImage,
    specSheetUrl: product.specSheetUrl ? resolveMediaUrl(product.specSheetUrl) : product.specSheetUrl,
    galleryImages: product.galleryImages.map((img) => ({
      ...img,
      url: resolveMediaUrl(img.url),
      mobileUrl: img.mobileUrl ? resolveMediaUrl(img.mobileUrl) : img.mobileUrl,
    })),
  };
}

function resolveCategoryMedia(category: ProductCategory): ProductCategory {
  return { ...category, image: category.image ? resolveMediaUrl(category.image) : category.image };
}

export async function listProducts(
  params: ProductListParams = {},
  locale: Locale = 'en',
): Promise<{ items: Product[]; meta?: ApiMeta }> {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  if (params.featured !== undefined) search.set('featured', String(params.featured));
  if (params.q) search.set('q', params.q);
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  const localeParam = localeQueryParam(locale);
  if (localeParam) search.set('locale', localeParam);

  const qs = search.toString();
  try {
    const { data, meta } = await apiFetch<WithTranslation<Product>[]>(`/products${qs ? `?${qs}` : ''}`, {
      revalidate: 60,
      tags: ['products', 'product-categories', ...localizedTag('products', locale), ...localizedTag('product-categories', locale)],
    });
    return { items: data.map((p) => resolveProductMedia(localizeProduct(p))), meta };
  } catch {
    // 构建期后端不可达时的兜底：见 lib/api/settings.ts 顶部注释
    return { items: [] };
  }
}

// 与后端 backend/src/config/constants.ts 的 MAX_PAGE_SIZE 保持一致——
// 单页最多只能取这么多条，超过要翻页取，不能直接传更大的 pageSize（会被后端 schema 拒绝）。
const PUBLIC_PRODUCTS_MAX_PAGE_SIZE = 100;

/**
 * 取全部已发布产品（跨全部分页，不只是默认第一页/前100条），用于 Previous/Next 等
 * 需要在完整产品池里做相邻计算的场景。已发布产品数量在合理范围内增长时，这里通常只需
 * 请求一页；一旦超过单页上限，会按后端已有的 page/pageSize 分页参数继续翻页取全，
 * 不新增任何接口、不改分页合同。
 */
export async function listAllProducts(locale: Locale = 'en'): Promise<Product[]> {
  const first = await listProducts({ pageSize: PUBLIC_PRODUCTS_MAX_PAGE_SIZE }, locale);
  const totalPages = first.meta?.totalPages ?? 1;
  if (totalPages <= 1) return first.items;

  const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  const rest = await Promise.all(
    remainingPages.map((page) => listProducts({ page, pageSize: PUBLIC_PRODUCTS_MAX_PAGE_SIZE }, locale)),
  );
  return [first.items, ...rest.map((r) => r.items)].flat();
}

export async function getProductBySlug(
  slug: string,
  locale: Locale = 'en',
): Promise<{ product: Product; related: Product[] } | null> {
  const localeParam = localeQueryParam(locale);
  try {
    const { data } = await apiFetch<{ product: WithTranslation<Product>; related: WithTranslation<Product>[] }>(
      `/products/${slug}${localeParam ? `?locale=${localeParam}` : ''}`,
      {
        revalidate: 60,
        tags: ['products', 'product-categories', `product:${slug}`, ...localizedTag('products', locale), ...localizedTag('product-categories', locale), ...localizedTag(`product:${slug}`, locale)],
      },
    );
    return {
      product: resolveProductMedia(localizeProduct(data.product)),
      related: data.related.map((r) => resolveProductMedia(localizeProduct(r))),
    };
  } catch (error) {
    // Only a confirmed missing resource may trigger the page's notFound().
    // Rate limits and upstream outages must remain errors, not false SEO 404s.
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function listProductCategories(locale: Locale = 'en'): Promise<ProductCategory[]> {
  const localeParam = localeQueryParam(locale);
  try {
    const { data } = await apiFetch<WithTranslation<ProductCategory>[]>(
      `/product-categories${localeParam ? `?locale=${localeParam}` : ''}`,
      { revalidate: 300, tags: ['product-categories', ...localizedTag('product-categories', locale)] },
    );
    return data.map((c) => resolveCategoryMedia(localizeCategory(c)));
  } catch {
    return [];
  }
}

/**
 * 只返回"当前语言下至少有一个已发布产品"的分类，用于导航/Footer/分类筛选栏/首页分类模块/
 * sitemap 这些客户可见入口——公开 /products 接口本身已经只返回 PUBLISHED 产品（见后端
 * products.service.ts），这里不重复做发布状态判断，只是按 categoryId 交叉过滤，不新增接口、
 * 不改分页合同。分类总数不大，一次性拉全部已发布产品做交叉即可，避免逐个分类发请求的 N+1。
 */
export const listVisibleProductCategories = cache(async (locale: Locale = 'en'): Promise<ProductCategory[]> => {
  const [categories, products] = await Promise.all([listProductCategories(locale), listAllProducts(locale)]);
  const categoryIdsWithProducts = new Set(products.map((p) => p.categoryId));
  const visible = categories.filter((c) => categoryIdsWithProducts.has(c.id));
  try {
    const paths = visible.map((c) => localeHref(`/products/category/${c.slug}`, locale));
    const redirectSources = await publicRedirectSourcePaths(paths);
    return visible.filter((c) => !redirectSources.has(localeHref(`/products/category/${c.slug}`, locale)));
  } catch {
    // A redirect lookup outage must not make the public category navigation disappear.
    return visible;
  }
});

export async function getProductCategoryBySlug(
  slug: string,
  params: { page?: number; pageSize?: number } = {},
  locale: Locale = 'en',
): Promise<({ category: ProductCategory; products: Product[]; meta?: ApiMeta }) | null> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  const localeParam = localeQueryParam(locale);
  if (localeParam) search.set('locale', localeParam);
  const qs = search.toString();

  try {
    const { data, meta } = await apiFetch<{ category: WithTranslation<ProductCategory>; products: WithTranslation<Product>[] }>(
      `/product-categories/${slug}${qs ? `?${qs}` : ''}`,
      // 分类详情包含产品列表：发布、下架、排序和译文更新都必须使这份缓存失效。
      { revalidate: 300, tags: ['product-categories', 'products', ...localizedTag('product-categories', locale), ...localizedTag('products', locale)] },
    );
    return {
      category: resolveCategoryMedia(localizeCategory(data.category)),
      products: data.products.map((p) => resolveProductMedia(localizeProduct(p))),
      meta,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
