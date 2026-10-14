import type { Product } from '@/types/product';
import type { BlogPost } from '@/types/blog';
import type { Certificate, Faq } from '@/types/content';
import type { PublicSiteSettings } from '@/types/settings';
import type { Locale } from '@/lib/i18n/locales';
import { localeHref } from '@/lib/i18n/paths';

/**
 * 所有 JSON-LD helper 都是纯函数：siteUrl 由调用方（Server Component）通过
 * getSiteUrl()/lib/seo/site.ts 解析一次后传入，而不是每个 helper 自己内部再去请求一次
 * 域名配置——见 Runtime Site Domain Configuration 需求「八」："不要让 Header、Footer、
 * ProductCard 各自读取站点域名"同样适用于这里。好处是这些函数保持同步、不依赖网络请求，
 * 可以直接单元测试（见 jsonld.test.ts），不需要在测试里 mock fetch 或起一个真实后端。
 */
function toAbsolute(siteUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function organizationJsonLd(settings: PublicSiteSettings, siteUrl: string) {
  const organizationId = toAbsolute(siteUrl, '/#organization');
  const sameAs = settings.socialLinks
    .filter((link) => link.enabled && /^https?:\/\//i.test(link.url))
    .map((link) => link.url);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId,
    name: settings.companyName,
    legalName: settings.companyName,
    alternateName: settings.brandName ?? undefined,
    description: settings.defaultSeoDescription ?? settings.footerCompanyIntro ?? undefined,
    url: siteUrl,
    logo: settings.companyLogoUrl ? toAbsolute(siteUrl, settings.companyLogoUrl) : undefined,
    email: settings.companyEmail ?? undefined,
    telephone: settings.companyPhone ?? undefined,
    address: settings.companyAddress
      ? {
          '@type': 'PostalAddress',
          streetAddress: settings.companyAddress,
          addressCountry: 'CN',
        }
      : undefined,
    contactPoint: settings.companyEmail || settings.companyPhone
      ? {
          '@type': 'ContactPoint',
          contactType: 'sales',
          email: settings.companyEmail ?? undefined,
          telephone: settings.companyPhone ?? undefined,
          availableLanguage: ['English', 'Spanish'],
        }
      : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}

export function websiteJsonLd(settings: PublicSiteSettings, siteUrl: string, locale: Locale = 'en') {
  const homepageUrl = locale === 'en' ? siteUrl : toAbsolute(siteUrl, localeHref('/', locale));
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${toAbsolute(siteUrl, localeHref('/', locale))}#website`,
    name: settings.companyName,
    url: homepageUrl,
    inLanguage: locale,
    publisher: { '@id': toAbsolute(siteUrl, '/#organization') },
  };
}

export function breadcrumbListJsonLd(items: { label: string; href: string }[], siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: toAbsolute(siteUrl, item.href),
    })),
  };
}

/** Generic page graph used by the contact and legal pages on the live site. */
export function webPageJsonLd({ type = 'WebPage', name, description, url, breadcrumbs }: {
  type?: 'WebPage' | 'ContactPage';
  name: string;
  description: string;
  url: string;
  breadcrumbs: { name: string; url: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': type, '@id': `${url}#webpage`, url, name, description },
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({
          '@type': 'ListItem', position: index + 1, name: item.name, item: item.url,
        })),
      },
    ],
  };
}

export function productJsonLd(
  product: Product,
  siteUrl: string,
  locale: Locale = 'en',
) {
  const images = [...new Set([
    product.mainImage,
    ...product.galleryImages.map((image) => image.url),
  ].filter(Boolean))].map((image) => toAbsolute(siteUrl, image));

  const productUrl = toAbsolute(siteUrl, localeHref(`/products/${product.slug}`, locale));

  return {
    '@context': 'https://schema.org',
    // The public page is a B2B specification and quote-request page. It has no
    // public checkout price or first-party review corpus, so modelling it as a
    // Product rich-result candidate would create an unresolvable GSC error.
    '@type': 'WebPage',
    '@id': `${productUrl}#webpage`,
    name: product.name,
    description: product.shortDescription ?? product.seoDescription ?? undefined,
    primaryImageOfPage: images[0]
      ? { '@type': 'ImageObject', url: images[0] }
      : undefined,
    url: productUrl,
    inLanguage: locale,
    isPartOf: { '@id': `${toAbsolute(siteUrl, localeHref('/', locale))}#website` },
    about: { '@id': toAbsolute(siteUrl, '/#organization') },
  };
}

export function productCollectionJsonLd(
  products: readonly Pick<Product, 'name' | 'slug'>[],
  siteUrl: string,
  locale: Locale = 'en',
) {
  const url = toAbsolute(siteUrl, localeHref('/products', locale));

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection-page`,
    url,
    name: locale === 'es' ? 'Catálogo de purificadores de agua' : 'Water purifier product catalog',
    description: locale === 'es'
      ? 'Catálogo B2B de purificadores de agua y plataformas OEM/ODM para distribuidores, marcas y proyectos comerciales.'
      : 'B2B catalog of water purifiers and OEM/ODM platforms for distributors, brands and commercial projects.',
    inLanguage: locale,
    isPartOf: { '@id': `${toAbsolute(siteUrl, localeHref('/', locale))}#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: product.name,
        url: toAbsolute(siteUrl, localeHref(`/products/${product.slug}`, locale)),
      })),
    },
  };
}

type CollectionPageJsonLdInput = {
  name: string;
  description: string;
  url: string;
  itemCount: number;
  items?: readonly { name: string; url: string }[];
  breadcrumbs: { name: string; url: string }[];
};

/** Compatibility helper used by the live blog and product-category templates. */
export function collectionPageJsonLd({
  name,
  description,
  url,
  itemCount,
  items = [],
  breadcrumbs,
}: CollectionPageJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#collection`,
        url,
        name,
        description,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: itemCount,
          itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            url: item.url,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      },
    ],
  };
}

// The production templates currently use this pluralized export name.
export const collectionPagesJsonLd = collectionPageJsonLd;

export function aboutPageJsonLd(
  settings: PublicSiteSettings,
  siteUrl: string,
  locale: Locale = 'en',
) {
  const url = toAbsolute(siteUrl, localeHref('/about', locale));
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${url}#about-page`,
    url,
    name: locale === 'es' ? `Sobre ${settings.brandName || settings.companyName}` : `About ${settings.brandName || settings.companyName}`,
    inLanguage: locale,
    about: { '@id': toAbsolute(siteUrl, '/#organization') },
    isPartOf: { '@id': `${toAbsolute(siteUrl, localeHref('/', locale))}#website` },
  };
}

export function articleJsonLd(post: BlogPost, siteUrl: string, locale: Locale = 'en') {
  const articleUrl = toAbsolute(siteUrl, localeHref(`/blog/${post.slug}`, locale));

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${articleUrl}#article`,
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverImage ? toAbsolute(siteUrl, post.coverImage) : undefined,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: post.authorName },
    url: articleUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    isPartOf: { '@id': `${toAbsolute(siteUrl, localeHref('/', locale))}#website` },
    publisher: { '@id': toAbsolute(siteUrl, '/#organization') },
    inLanguage: locale,
  };
}

export function faqPageJsonLd(faqs: readonly Pick<Faq, 'question' | 'answer'>[], locale: Locale = 'en') {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function certificateItemListJsonLd(
  certificates: readonly Certificate[],
  siteUrl: string,
  organizationName: string,
  locale: Locale = 'en',
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: locale === 'es' ? 'Certificados y documentos de conformidad' : 'Certificates and conformity documents',
    inLanguage: locale,
    itemListElement: certificates.map((certificate, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'CreativeWork',
        name: certificate.name,
        identifier: certificate.certNumber ?? undefined,
        image: toAbsolute(siteUrl, certificate.imageUrl),
        datePublished: certificate.issueDate ?? undefined,
        expires: certificate.expiryDate ?? undefined,
        publisher: certificate.issuingAuthority
          ? { '@type': 'Organization', name: certificate.issuingAuthority }
          : undefined,
        sourceOrganization: { '@type': 'Organization', name: organizationName },
        about: certificate.applicableProductType || (certificate.applicableModels?.length ?? 0) > 0
          ? [certificate.applicableProductType, ...(certificate.applicableModels ?? [])].filter(Boolean)
          : undefined,
      },
    })),
  };
}
