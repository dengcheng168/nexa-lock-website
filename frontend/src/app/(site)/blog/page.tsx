import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogProjectCta } from '@/components/blog/BlogProjectCta';
import { Pagination } from '@/components/ui/Pagination';
import { PageHeroBanner } from '@/components/site/PageHeroBanner';
import { listBlogPosts, listBlogCategories, listBlogTags } from '@/lib/api/blog';
import { getPageBySlug } from '@/lib/api/content';
import { paginatedDescription, paginatedPath, paginatedTitle } from '@/lib/seo/pagination';
import { getDefaultSocialImages } from '@/lib/seo/base-metadata';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const [page, images] = await Promise.all([getPageBySlug('blog'), getDefaultSocialImages()]);
  const baseTitle = page?.seoTitle ?? page?.title ?? 'Blog';
  const baseDescription = page?.seoDescription ?? 'Smart access guides, product insights and factory updates.';
  const enPath = paginatedPath('/blog', pageParam);
  const esPath = paginatedPath('/es/blog', pageParam);
  return {
    title: paginatedTitle(baseTitle, pageParam),
    description: paginatedDescription(baseDescription, pageParam),
    alternates: { canonical: enPath, languages: { en: enPath, es: esPath, 'x-default': enPath } },
    openGraph: { type: 'website', url: enPath, images },
  };
}

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;

  const [{ items, meta }, categories, tags, pageContent] = await Promise.all([
    listBlogPosts({ page, pageSize: 9 }),
    listBlogCategories(),
    listBlogTags(),
    getPageBySlug('blog'),
  ]);
  const hasHero = Boolean(pageContent?.heroImage || pageContent?.heroImageMobile);
  const featuredPost = items[0];
  const remainingPosts = items.slice(1);
  const fallbackImages = [
    '/images/smart-lock/category-residential.png',
    '/images/smart-lock/category-hospitality.png',
    '/images/smart-lock/category-glass.png',
  ];
  const featuredImage = featuredPost?.coverImage || (featuredPost ? fallbackImages[Math.abs(featuredPost.id) % fallbackImages.length] : null);

  return (
    <>
      {hasHero && (
        <PageHeroBanner image={pageContent?.heroImage} imageMobile={pageContent?.heroImageMobile} title={pageContent?.title ?? 'Blog'}>
          {pageContent?.bodyHtml && (
            <div
              className="prose prose-sm prose-invert mt-4 max-w-2xl text-grey-100/90"
              dangerouslySetInnerHTML={{ __html: pageContent.bodyHtml }}
            />
          )}
        </PageHeroBanner>
      )}

      {!hasHero && (
        <section className="relative overflow-hidden bg-navy-950 text-white">
          <Image src="/images/smart-lock/hero-smart-lock.png" alt="" fill priority sizes="100vw" className="object-cover object-[72%_50%] opacity-15" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#061b36_0%,rgba(6,27,54,.94)_52%,rgba(6,27,54,.7)_100%)]" />
          <Container className="relative py-10 sm:py-14">
            <div className="text-sm text-grey-300"><Link href="/" className="hover:text-white">Home</Link><span className="mx-2">/</span>Insights</div>
            <div className="mt-7 grid items-end gap-7 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Smart Access Insights</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-grey-200">Practical guidance on smart lock selection, access technology, installation and OEM/ODM project planning.</p>
              </div>
              <p className="max-w-md border-l border-water-400/60 pl-5 text-sm leading-6 text-grey-300 lg:justify-self-end">Written for distributors, hospitality operators, developers and access-control professionals.</p>
            </div>
          </Container>
        </section>
      )}

      <Container className="py-9 sm:py-12">
        {hasHero && <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} />}

        <nav className="flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-grey-200 pb-5" aria-label="Blog categories">
          <Link href="/blog" className="bg-navy-950 px-4 py-2 text-sm font-semibold text-white">All insights</Link>
          {categories.map((category) => (
            <Link key={category.id} href={`/blog/category/${category.slug}`} className="px-4 py-2 text-sm font-medium text-grey-600 hover:bg-grey-100 hover:text-navy-950">{category.name}</Link>
          ))}
          {tags.length > 0 && <span className="mx-2 hidden h-5 w-px bg-grey-200 sm:block" />}
          {tags.slice(0, 4).map((tag) => (
            <Link key={tag.id} href={`/blog/tag/${tag.slug}`} className="px-3 py-2 text-xs text-grey-500 hover:text-water-600">#{tag.name}</Link>
          ))}
        </nav>

        {items.length === 0 || !featuredPost ? (
          <p className="py-16 text-center text-grey-500">No articles found.</p>
        ) : (
          <>
            <Link href={`/blog/${featuredPost.slug}`} className="group mt-8 grid overflow-hidden bg-[#f2f6fb] lg:grid-cols-[1.35fr_0.65fr]">
              <div className="relative min-h-[300px] overflow-hidden sm:min-h-[380px]">
                {featuredImage && <Image src={featuredImage} alt={featuredPost.coverImage ? featuredPost.title : ''} fill sizes="(min-width: 1024px) 65vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />}
              </div>
              <div className="flex flex-col justify-between p-7 sm:p-9 lg:p-10">
                <div>
                  <span className="text-xs font-semibold text-water-600">Latest insight</span>
                  {featuredPost.category && <p className="mt-5 text-sm text-grey-500">{featuredPost.category.name}</p>}
                  <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.03em] text-navy-950">{featuredPost.title}</h2>
                  {featuredPost.excerpt && <p className="mt-4 text-sm leading-6 text-grey-600">{featuredPost.excerpt}</p>}
                </div>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-navy-950">Read article <span className="text-water-600">↗</span></span>
              </div>
            </Link>

            {remainingPosts.length > 0 && (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {remainingPosts.map((post) => <BlogCard key={post.id} post={post} />)}
              </div>
            )}
          </>
        )}
        <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} basePath="/blog" />
      </Container>
      <BlogProjectCta />
    </>
  );
}
