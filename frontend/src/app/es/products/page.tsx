import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CategoryFilterSidebar } from '@/components/product/CategoryFilterSidebar';
import { ProductGrid } from '@/components/product/ProductGrid';
import { JsonLd } from '@/components/seo/JsonLd';
import { Pagination } from '@/components/ui/Pagination';
import { PageHeroBanner } from '@/components/site/PageHeroBanner';
import { listAllProducts, listProducts, listVisibleProductCategories } from '@/lib/api/products';
import { getPageBySlug } from '@/lib/api/content';
import { t } from '@/lib/i18n/site-strings';
import { paginatedDescription, paginatedPath, paginatedTitle } from '@/lib/seo/pagination';
import { productCollectionJsonLd } from '@/lib/seo/jsonld';
import { getSiteUrl } from '@/lib/seo/site';
import { getDefaultSocialImages } from '@/lib/seo/base-metadata';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const [page, images] = await Promise.all([getPageBySlug('products', 'es'), getDefaultSocialImages()]);
  const enPath = paginatedPath('/products', pageParam);
  const esPath = paginatedPath('/es/products', pageParam);
  const baseTitle = page?.seoTitle ?? page?.title ?? t('es', 'productsPageTitle');
  const baseDescription = page?.seoDescription ?? t('es', 'productsPageDescription');
  return {
    title: paginatedTitle(baseTitle, pageParam, 'es'),
    description: paginatedDescription(baseDescription, pageParam, 'es'),
    alternates: { canonical: esPath, languages: { en: enPath, es: esPath, 'x-default': enPath } },
    openGraph: { type: 'website', url: esPath, images },
  };
}

export default async function SpanishProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const currentPage = Number(pageParam) || 1;

  const [{ items, meta }, categories, pageContent, allProducts, siteUrl] = await Promise.all([
    listProducts({ page: currentPage, pageSize: 12 }, 'es'),
    listVisibleProductCategories('es'),
    getPageBySlug('products', 'es'),
    currentPage === 1 ? listAllProducts('es') : Promise.resolve([]),
    currentPage === 1 ? getSiteUrl() : Promise.resolve(''),
  ]);
  const hasHero = Boolean(pageContent?.heroImage || pageContent?.heroImageMobile);

  return (
    <>
      {currentPage === 1 && <JsonLd data={productCollectionJsonLd(allProducts, siteUrl, 'es')} />}
      {hasHero && (
        <PageHeroBanner image={pageContent?.heroImage} imageMobile={pageContent?.heroImageMobile} title={pageContent?.title ?? t('es', 'productsPageTitle')}>
          {pageContent?.bodyHtml && (
            <div
              className="prose prose-sm prose-invert mt-4 max-w-2xl text-grey-100/90"
              dangerouslySetInnerHTML={{ __html: pageContent.bodyHtml }}
            />
          )}
        </PageHeroBanner>
      )}

      <Container className="py-12">
        <Breadcrumbs items={[{ label: t('es', 'breadcrumbHome'), href: '/es' }, { label: t('es', 'breadcrumbProducts') }]} locale="es" />
        {!hasHero && (
          <>
            <h1 className="mt-4 text-3xl font-semibold text-navy-950">{pageContent?.title ?? t('es', 'productsPageTitle')}</h1>
            {pageContent?.bodyHtml && (
              <div
                className="prose prose-sm mt-4 max-w-2xl text-grey-500"
                dangerouslySetInnerHTML={{ __html: pageContent.bodyHtml }}
              />
            )}
          </>
        )}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          <aside>
            <CategoryFilterSidebar categories={categories} locale="es" />
          </aside>
          <div>
            <ProductGrid products={items} locale="es" />
            <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} basePath="/es/products" locale="es" />
          </div>
        </div>
      </Container>
    </>
  );
}
