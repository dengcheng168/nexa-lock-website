import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { PageHeroBanner } from '@/components/site/PageHeroBanner';
import { FactoryGallery } from '@/components/site/FactoryGallery';
import { WhatWeSupport } from '@/components/site/WhatWeSupport';
import { getPageBySlug, listFactoryGalleryItems } from '@/lib/api/content';
import { t } from '@/lib/i18n/site-strings';
import { JsonLd } from '@/components/seo/JsonLd';
import { aboutPageJsonLd, breadcrumbListJsonLd, organizationJsonLd } from '@/lib/seo/jsonld';
import { getPublicSettings } from '@/lib/api/settings';
import { getSiteUrl } from '@/lib/seo/site';
import { getDefaultSocialImages } from '@/lib/seo/base-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [page, images] = await Promise.all([getPageBySlug('about', 'es'), getDefaultSocialImages()]);
  return {
    title: page?.seoTitle ?? page?.title ?? t('es', 'aboutPageTitle'),
    description: page?.seoDescription ?? undefined,
    alternates: { canonical: '/es/about', languages: { en: '/about', es: '/es/about', 'x-default': '/about' } },
    openGraph: { type: 'website', url: '/es/about', images },
  };
}

export default async function SpanishAboutPage() {
  const [page, galleryItems, settings, siteUrl] = await Promise.all([
    getPageBySlug('about', 'es'),
    listFactoryGalleryItems('es'),
    getPublicSettings(),
    getSiteUrl(),
  ]);
  const hasHero = Boolean(page?.heroImage || page?.heroImageMobile);

  return (
    <>
      <JsonLd data={organizationJsonLd(settings, siteUrl)} />
      <JsonLd data={aboutPageJsonLd(settings, siteUrl, 'es')} />
      <JsonLd data={breadcrumbListJsonLd([
        { label: t('es', 'breadcrumbHome'), href: '/es' },
        { label: t('es', 'breadcrumbAbout'), href: '/es/about' },
      ], siteUrl)} />
      {hasHero && (
        <PageHeroBanner
          image={page?.heroImage}
          imageMobile={page?.heroImageMobile}
          eyebrow={t('es', 'aboutEyebrow')}
          title={page?.title ?? t('es', 'aboutPageTitle')}
        >
          {page?.bodyHtml && (
            <div
              className="prose prose-sm prose-invert mt-4 max-w-3xl text-grey-100/90"
              dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
            />
          )}
        </PageHeroBanner>
      )}

      <Container className="py-12">
        <Breadcrumbs items={[{ label: t('es', 'breadcrumbHome'), href: '/es' }, { label: t('es', 'breadcrumbAbout') }]} locale="es" />
        {!hasHero && (
          <>
            <h1 className="mt-4 text-3xl font-semibold text-navy-950">{page?.title ?? t('es', 'aboutPageTitle')}</h1>
            {page?.bodyHtml && (
              <div
                className="prose prose-sm mt-6 max-w-3xl text-grey-700"
                dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
              />
            )}
          </>
        )}

        {typeof page?.sections === 'string' && page.sections && (
          <div className="mt-10" dangerouslySetInnerHTML={{ __html: page.sections }} />
        )}
      </Container>

      <WhatWeSupport locale="es" />
      <FactoryGallery items={galleryItems} locale="es" />

      <section className="border-t border-grey-200 bg-[#f2f6fb] py-10 sm:py-12">
        <Container className="grid items-center gap-7 lg:grid-cols-[1fr_auto] lg:gap-12">
          <div className="max-w-3xl border-l-4 border-water-500 pl-5 sm:pl-7">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-navy-950">{t('es', 'aboutCtaTitle')}</h2>
            <p className="mt-3 max-w-2xl leading-7 text-grey-600">{t('es', 'aboutCtaDescription')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Button href="/es/contact" variant="primary" className="min-w-40">
              {t('es', 'aboutCtaPrimaryButton')}
            </Button>
            <Button href="/es/products" variant="outline" className="min-w-36 !border-navy-950 !text-navy-950 hover:!bg-navy-950 hover:!text-white">
              {t('es', 'aboutCtaSecondaryButton')}
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
