import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CategoryFilterSidebar } from '@/components/product/CategoryFilterSidebar';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Pagination } from '@/components/ui/Pagination';
import { JsonLd } from '@/components/seo/JsonLd';
import { getProductCategoryBySlug, listVisibleProductCategories } from '@/lib/api/products';
import { t } from '@/lib/i18n/site-strings';
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
    getProductCategoryBySlug(categorySlug, {}, 'es'),
    getDefaultSocialImages(),
  ]);
  if (!result) return {};
  const enPath = paginatedPath(`/products/category/${categorySlug}`, pageParam);
  const esPath = paginatedPath(`/es/products/category/${categorySlug}`, pageParam);

  return {
    title: paginatedTitle(result.category.seoTitle ?? result.category.name, pageParam, 'es'),
    description: paginatedDescription(result.category.seoDescription ?? result.category.description ?? undefined, pageParam, 'es'),
    alternates: {
      canonical: esPath,
      languages: {
        en: enPath,
        es: esPath,
        'x-default': enPath,
      },
    },
    openGraph: { type: 'website', url: esPath, images: result.category.image ? [result.category.image] : defaultImages },
    ...(result.products.length === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function SpanishProductCategoryPage({
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
    getProductCategoryBySlug(categorySlug, { page, pageSize: 12 }, 'es'),
    listVisibleProductCategories('es'),
  ]);

  if (!result) notFound();

  const siteUrl = await getSiteUrl();
  const categoryUrl = `${siteUrl}/es/products/category/${categorySlug}`;

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
              url: `${siteUrl}/es/products/${product.slug}`,
            })),
            breadcrumbs: [
              { name: 'Inicio', url: `${siteUrl}/es` },
              { name: 'Productos', url: `${siteUrl}/es/products` },
              { name: result.category.name, url: categoryUrl },
            ],
          })}
        />
      )}
      <Breadcrumbs
        items={[
          { label: t('es', 'breadcrumbHome'), href: '/es' },
          { label: t('es', 'breadcrumbProducts'), href: '/es/products' },
          { label: result.category.name },
        ]}
        locale="es"
      />
      <h1 className="mt-4 text-3xl font-semibold text-navy-950">{result.category.name}</h1>
      {result.category.description && <p className="mt-3 max-w-2xl text-grey-500">{result.category.description}</p>}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <CategoryFilterSidebar categories={categories} activeSlug={categorySlug} locale="es" />
        </aside>
        <div>
          <ProductGrid products={result.products} locale="es" />
          <Pagination
            page={result.meta?.page ?? 1}
            totalPages={result.meta?.totalPages ?? 1}
            basePath={`/es/products/category/${categorySlug}`}
            locale="es"
          />
        </div>
      </div>
    </Container>
  );
}
