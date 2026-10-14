import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CategoryFilterSidebar } from '@/components/product/CategoryFilterSidebar';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Pagination } from '@/components/ui/Pagination';
import { JsonLd } from '@/components/seo/JsonLd';
import { getProductCategoryBySlug, listVisibleProductCategories } from '@/lib/api/products';
import { collectionPagesJsonLd } from '@/lib/seo/jsonld';
import { paginatedDescription, paginatedPath, paginatedTitle } from '@/lib/seo/pagination';
import { getSiteUrl } from '@/lib/seo/site';
import { getDefaultSocialImages } from '@/lib/seo/base-metadata';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const { page: pageParam } = await searchParams;
  const [result, defaultImages] = await Promise.all([
    getProductCategoryBySlug(categorySlug),
    getDefaultSocialImages(),
  ]);
  if (!result) return {};
  const enPath = paginatedPath(`/products/category/${categorySlug}`, pageParam);
  const esPath = paginatedPath(`/es/products/category/${categorySlug}`, pageParam);

  return {
    title: paginatedTitle(result.category.seoTitle ?? result.category.name, pageParam),
    description: paginatedDescription(result.category.seoDescription ?? result.category.description ?? undefined, pageParam),
    alternates: {
      canonical: enPath,
      languages: {
        en: enPath,
        es: esPath,
        'x-default': enPath,
      },
    },
    openGraph: { type: 'website', url: enPath, images: result.category.image ? [result.category.image] : defaultImages },
    // 分类当前没有任何已发布产品时不参与索引，但仍允许爬虫顺着链接继续走——
    // 页面本身不删除，只是不让空分类占搜索结果位
    ...(result.products.length === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ProductCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { categorySlug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;

  const [result, categories] = await Promise.all([
    getProductCategoryBySlug(categorySlug, { page, pageSize: 12 }),
    listVisibleProductCategories(),
  ]);

  if (!result) notFound();

  const siteUrl = await getSiteUrl();
  const categoryUrl = `${siteUrl}/products/category/${categorySlug}`;

  return (
    <Container className="py-12">
      {page === 1 && (
        <JsonLd
          data={collectionPagesJsonLd({
            name: result.category.name,
            description: result.category.description ?? result.category.seoDescription ?? result.category.name,
            url: categoryUrl,
            itemCount: result.meta?.total ?? result.products.length,
            items: result.products.map((product) => ({
              name: product.name,
              url: `${siteUrl}/products/${product.slug}`,
            })),
            breadcrumbs: [
              { name: 'Home', url: siteUrl },
              { name: 'Products', url: `${siteUrl}/products` },
              { name: result.category.name, url: categoryUrl },
            ],
          })}
        />
      )}
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Products', href: '/products' }, { label: result.category.name }]}
      />
      <h1 className="mt-4 text-3xl font-semibold text-navy-950">{result.category.name}</h1>
      {result.category.description && <p className="mt-3 max-w-2xl text-grey-500">{result.category.description}</p>}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <CategoryFilterSidebar categories={categories} activeSlug={categorySlug} />
        </aside>
        <div>
          <ProductGrid products={result.products} />
          <Pagination
            page={result.meta?.page ?? 1}
            totalPages={result.meta?.totalPages ?? 1}
            basePath={`/products/category/${categorySlug}`}
          />
        </div>
      </div>
    </Container>
  );
}
