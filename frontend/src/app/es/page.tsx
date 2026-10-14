import type { Metadata } from 'next';
import { getPublicSettings } from '@/lib/api/settings';
import { listVisibleProductCategories, listProducts } from '@/lib/api/products';
import { listCertificates, listFaqs } from '@/lib/api/content';
import { listBlogPosts } from '@/lib/api/blog';
import { getTranslationMap } from '@/lib/api/translations';
import { localizeHero, localizeCoreAdvantages } from '@/lib/i18n/content-overlay';
import { resolveHomeSeoMetadata } from '@/lib/seo/home-metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/jsonld';
import { getSiteUrl } from '@/lib/seo/site';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CoreAdvantages } from '@/components/home/CoreAdvantages';
import { ProductCategories } from '@/components/home/ProductCategories';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { CertificatesShowcase } from '@/components/home/CertificatesShowcase';
import { LatestBlogPosts } from '@/components/home/LatestBlogPosts';
import { FaqPreview } from '@/components/home/FaqPreview';
import { InquirySection } from '@/components/home/InquirySection';

// The homepage depends on CMS data that is unavailable inside the isolated
// Docker build network. Render it at request time so a build-time fallback is
// never persisted as the production homepage.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const [settings, translations] = await Promise.all([getPublicSettings(), getTranslationMap('es')]);
  const seo = resolveHomeSeoMetadata({
    translations,
    defaultSeoTitle: settings.defaultSeoTitle,
    defaultSeoDescription: settings.defaultSeoDescription,
  });
  return {
    ...(seo.title ? { title: seo.title } : {}),
    ...(seo.description ? { description: seo.description } : {}),
    alternates: { canonical: '/es', languages: { en: '/', es: '/es', 'x-default': '/' } },
    openGraph: {
      type: 'website',
      url: '/es',
      locale: 'es',
      alternateLocale: 'en',
      ...(seo.title ? { title: seo.title } : {}),
      ...(seo.description ? { description: seo.description } : {}),
      images: settings.defaultOgImage || settings.heroDesktopImage || settings.companyLogoUrl
        ? [settings.defaultOgImage || settings.heroDesktopImage || settings.companyLogoUrl!]
        : undefined,
    },
    twitter: {
      ...(seo.title ? { title: seo.title } : {}),
      ...(seo.description ? { description: seo.description } : {}),
      images: settings.defaultOgImage || settings.heroDesktopImage || settings.companyLogoUrl
        ? [settings.defaultOgImage || settings.heroDesktopImage || settings.companyLogoUrl!]
        : undefined,
    },
  };
}

export default async function SpanishHomePage() {
  const [settings, categories, featuredProducts, certificates, latestPosts, faqs, translations, siteUrl] =
    await Promise.all([
      getPublicSettings(),
      listVisibleProductCategories('es'),
      listProducts({ featured: true, pageSize: 4 }, 'es'),
      listCertificates('es'),
      listBlogPosts({ pageSize: 3 }, 'es'),
      // listFaqs('es') 内部按 FaqTranslation 已发布内容优先、旧 Translation 表兼容、
      // 英文原文兜底的三级顺序解析，见 lib/api/content.ts 和 lib/i18n/faq-source.ts
      listFaqs('es'),
      getTranslationMap('es'),
      getSiteUrl(),
    ]);

  // 产品分类/推荐产品/证书/博客文章/FAQ 现在都通过 locale-aware 数据函数请求西语翻译，
  // 缺失翻译的字段自动回退显示英文原文（见 lib/i18n/localize.ts 和 lib/i18n/faq-source.ts）。
  const localizedSettings = localizeHero(settings, translations);
  const localizedCoreAdvantages = localizeCoreAdvantages(settings.coreAdvantages, translations);

  return (
    <>
      <JsonLd data={organizationJsonLd(settings, siteUrl)} />
      <JsonLd data={websiteJsonLd(settings, siteUrl, 'es')} />

      <HeroBanner settings={localizedSettings} locale="es" />
      <CoreAdvantages items={localizedCoreAdvantages} locale="es" />
      <ProductCategories categories={categories} locale="es" />
      <InquirySection locale="es" videoUrl={settings.homepageVideoUrl} />
      <FeaturedProducts products={featuredProducts.items} locale="es" />
      <CertificatesShowcase certificates={certificates} locale="es" />
      <LatestBlogPosts posts={latestPosts.items} locale="es" />
      <FaqPreview faqs={faqs} locale="es" />
    </>
  );
}
