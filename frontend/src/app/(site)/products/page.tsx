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
  const [page, images] = await Promise.all([getPageBySlug('products'), getDefaultSocialImages()]);
  const enPath = paginatedPath('/products', pageParam);
  const esPath = paginatedPath('/es/products', pageParam);
  const baseTitle = page?.seoTitle ?? page?.title ?? 'Products';
  const baseDescription = page?.seoDescription ?? 'Browse our full range of OEM/ODM smart door locks and access-control hardware.';
  return {
    title: paginatedTitle(baseTitle, pageParam),
    description: paginatedDescription(baseDescription, pageParam),
    alternates: { canonical: enPath, languages: { en: enPath, es: esPath, 'x-default': enPath } },
    openGraph: { type: 'website', url: enPath, images },
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const currentPage = Number(pageParam) || 1;

  const [{ items, meta }, categories, pageContent, allProducts, siteUrl] = await Promise.all([
    listProducts({ page: currentPage, pageSize: 12 }),
    listVisibleProductCategories(),
    getPageBySlug('products'),
    currentPage === 1 ? listAllProducts() : Promise.resolve([]),
    currentPage === 1 ? getSiteUrl() : Promise.resolve(''),
  ]);
  const hasHero = Boolean(pageContent?.heroImage || pageContent?.heroImageMobile);

  return (
    <>
      {currentPage === 1 && <JsonLd data={productCollectionJsonLd(allProducts, siteUrl)} />}
      {hasHero && (
        <PageHeroBanner image={pageContent?.heroImage} imageMobile={pageContent?.heroImageMobile} title={pageContent?.title ?? 'Products'}>
          {pageContent?.bodyHtml && (
            <div
              className="prose prose-sm prose-invert mt-4 max-w-2xl text-grey-100/90"
              dangerouslySetInnerHTML={{ __html: pageContent.bodyHtml }}
            />
          )}
        </PageHeroBanner>
      )}

      <Container className="py-12">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Products' }]} />
        {!hasHero && (
          <>
            <h1 className="mt-4 text-3xl font-semibold text-navy-950">{pageContent?.title ?? 'Products'}</h1>
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
            <CategoryFilterSidebar categories={categories} />
          </aside>
          <div>
            <ProductGrid products={items} />
            <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} basePath="/products" />
          </div>
        </div>
      </Container>
    </>
  );
}
