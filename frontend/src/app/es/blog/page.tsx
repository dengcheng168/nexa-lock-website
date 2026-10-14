import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogProjectCta } from '@/components/blog/BlogProjectCta';
import { Pagination } from '@/components/ui/Pagination';
import { PageHeroBanner } from '@/components/site/PageHeroBanner';
import { listBlogPosts, listBlogCategories, listBlogTags } from '@/lib/api/blog';
import { getPageBySlug } from '@/lib/api/content';
import { t } from '@/lib/i18n/site-strings';
import { paginatedDescription, paginatedPath, paginatedTitle } from '@/lib/seo/pagination';
import { getDefaultSocialImages } from '@/lib/seo/base-metadata';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const [page, images] = await Promise.all([getPageBySlug('blog', 'es'), getDefaultSocialImages()]);
  const baseTitle = page?.seoTitle ?? page?.title ?? t('es', 'blogPageTitle');
  const baseDescription = page?.seoDescription ?? t('es', 'blogPageDescription');
  const enPath = paginatedPath('/blog', pageParam);
  const esPath = paginatedPath('/es/blog', pageParam);
  return {
    title: paginatedTitle(baseTitle, pageParam, 'es'),
    description: paginatedDescription(baseDescription, pageParam, 'es'),
    alternates: { canonical: esPath, languages: { en: enPath, es: esPath, 'x-default': enPath } },
    openGraph: { type: 'website', url: esPath, images },
  };
}

export default async function SpanishBlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;

  const [{ items, meta }, categories, tags, pageContent] = await Promise.all([
    listBlogPosts({ page, pageSize: 9 }, 'es'),
    listBlogCategories('es'),
    listBlogTags(),
    getPageBySlug('blog', 'es'),
  ]);
  const hasHero = Boolean(pageContent?.heroImage || pageContent?.heroImageMobile);

  return (
    <>
      {hasHero && (
        <PageHeroBanner image={pageContent?.heroImage} imageMobile={pageContent?.heroImageMobile} title={pageContent?.title ?? t('es', 'blogPageTitle')}>
          {pageContent?.bodyHtml && (
            <div
              className="prose prose-sm prose-invert mt-4 max-w-2xl text-grey-100/90"
              dangerouslySetInnerHTML={{ __html: pageContent.bodyHtml }}
            />
          )}
        </PageHeroBanner>
      )}

      <Container className="py-12">
        <Breadcrumbs items={[{ label: t('es', 'breadcrumbHome'), href: '/es' }, { label: t('es', 'breadcrumbBlog') }]} locale="es" />
        {!hasHero && (
          <>
            <h1 className="mt-4 text-3xl font-semibold text-navy-950">{pageContent?.title ?? t('es', 'blogPageTitle')}</h1>
            {pageContent?.bodyHtml && (
              <div
                className="prose prose-sm mt-4 max-w-2xl text-grey-500"
                dangerouslySetInnerHTML={{ __html: pageContent.bodyHtml }}
              />
            )}
          </>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <BlogSidebar categories={categories} tags={tags} locale="es" />
          <div>
            {items.length === 0 ? (
              <p className="py-12 text-center text-grey-500">{t('es', 'noArticlesFound')}</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((post) => (
                  <BlogCard key={post.id} post={post} locale="es" />
                ))}
              </div>
            )}
            <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} basePath="/es/blog" locale="es" />
          </div>
        </div>
      </Container>
      <BlogProjectCta locale="es" />
    </>
  );
}
