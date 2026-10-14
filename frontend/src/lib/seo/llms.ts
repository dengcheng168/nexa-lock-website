import type { BlogPost } from '@/types/blog';
import type { Faq } from '@/types/content';
import type { Product, ProductCategory } from '@/types/product';
import type { PublicSiteSettings } from '@/types/settings';

type LlmSiteInput = {
  siteUrl: string;
  settings: PublicSiteSettings;
  categories?: readonly ProductCategory[];
};

type LocalizedPublicContent = {
  categories: readonly ProductCategory[];
  products: readonly Product[];
  posts: readonly BlogPost[];
  faqs: readonly Faq[];
};

type LlmFullInput = LlmSiteInput & {
  en: LocalizedPublicContent;
  es: LocalizedPublicContent;
};

type AgentCatalogInput = LlmFullInput;

function latestContentUpdate(...collections: ReadonlyArray<ReadonlyArray<{ updatedAt?: string | null }>>): string | undefined {
  const timestamps = collections
    .flatMap((items) => items.map((item) => item.updatedAt))
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => right.getTime() - left.getTime());
  return timestamps[0]?.toISOString();
}

function absoluteUrl(siteUrl: string, path: string): string {
  return new URL(path, `${siteUrl.replace(/\/$/, '')}/`).toString();
}

function plainText(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function safeLine(value: string | null | undefined, fallback = ''): string {
  return plainText(value).replace(/[\r\n]+/g, ' ').replace(/^#+\s*/, '') || fallback;
}

export function buildLlmsTxt({ siteUrl, settings, categories = [] }: LlmSiteInput): string {
  const brand = safeLine(settings.brandName || settings.companyName, 'Li-Men');
  const description = safeLine(
    settings.defaultSeoDescription || settings.footerCompanyIntro || settings.heroSubheadline,
    'B2B water purifier manufacturer supporting OEM and ODM projects.',
  );

  return [
    `# ${brand}`,
    '',
    `> ${description}`,
    '',
    `${brand} serves overseas brands, distributors, wholesalers, and commercial water-treatment projects. Product pricing, minimum order quantity, lead time, certification scope, and customization are confirmed for each quotation; the public website is not a checkout store.`,
    '',
    '## Primary pages',
    '',
    `- [Home](${absoluteUrl(siteUrl, '/')})`,
    `- [Product catalog](${absoluteUrl(siteUrl, '/products')})`,
    `- [Manufacturing and OEM/ODM overview](${absoluteUrl(siteUrl, '/about')})`,
    `- [Certificates](${absoluteUrl(siteUrl, '/certificates')})`,
    `- [Industry articles](${absoluteUrl(siteUrl, '/blog')})`,
    `- [Frequently asked questions](${absoluteUrl(siteUrl, '/faq')})`,
    `- [Request a quotation](${absoluteUrl(siteUrl, '/contact')})`,
    '',
    '## Product categories',
    '',
    ...categories.map((category) => {
      const summary = safeLine(category.description || category.seoDescription);
      return `- [${safeLine(category.name, category.slug)}](${absoluteUrl(siteUrl, `/products/category/${category.slug}`)})${summary ? ` — ${summary}` : ''}`;
    }),
    ...(categories.length === 0 ? [`- [Browse the current product categories](${absoluteUrl(siteUrl, '/products')})`] : []),
    '',
    '## Language versions',
    '',
    `- [English](${absoluteUrl(siteUrl, '/')})`,
    `- [Español](${absoluteUrl(siteUrl, '/es')})`,
    '',
    '## Expanded machine-readable overview',
    '',
    `- [Full product and article index](${absoluteUrl(siteUrl, '/llms-full.txt')})`,
    `- [Structured bilingual product catalog](${absoluteUrl(siteUrl, '/catalog.json')})`,
    '',
  ].join('\n');
}

export function buildLlmsFullTxt({
  siteUrl,
  settings,
  en,
  es,
}: LlmFullInput): string {
  const brand = safeLine(settings.brandName || settings.companyName, 'Li-Men');
  const contentUpdatedAt = latestContentUpdate(
    en.categories, en.products, en.posts,
    es.categories, es.products, es.posts,
  );
  const lines = [
    `# ${brand}: public product and knowledge index`,
    '',
    `Canonical website: ${absoluteUrl(siteUrl, '/')}`,
    'Audience: overseas brands, distributors, wholesalers, and commercial project buyers.',
    'Commercial model: B2B enquiry and quotation. Prices, MOQ, lead times, certification scope, and customization depend on the selected product and project requirements.',
    'Languages: English and Spanish. Use the canonical page links below as the source of truth.',
    ...(contentUpdatedAt ? [`Content last updated: ${contentUpdatedAt}`] : []),
    `Contact: ${absoluteUrl(siteUrl, '/contact')}`,
    `Structured product catalog: ${absoluteUrl(siteUrl, '/catalog.json')}`,
    ...(settings.companyAddress ? [`Company address: ${safeLine(settings.companyAddress)}`] : []),
    ...(settings.companyEmail ? [`Company email: ${safeLine(settings.companyEmail)}`] : []),
    ...(settings.companyPhone ? [`Company telephone: ${safeLine(settings.companyPhone)}`] : []),
    '',
  ];

  const appendLocale = (label: string, prefix: '' | '/es', content: LocalizedPublicContent) => {
    lines.push(`## ${label} product categories`, '');
    if (content.categories.length === 0) lines.push('- See the live product catalog for current categories.');
    for (const category of content.categories) {
      const description = safeLine(category.description);
      lines.push(`- [${safeLine(category.name, category.slug)}](${absoluteUrl(siteUrl, `${prefix}/products/category/${category.slug}`)})${description ? ` — ${description}` : ''}`);
    }

    lines.push('', `## ${label} products`, '');
    if (content.products.length === 0) lines.push('- See the live product catalog for the current range.');
    for (const product of content.products) {
      const details = [
        product.sku ? `SKU: ${safeLine(product.sku)}` : null,
        product.oemOdmSupport ? 'OEM/ODM: supported' : null,
        product.moq ? `MOQ: ${safeLine(product.moq)}` : null,
      ].filter(Boolean);
      const summary = safeLine(product.description || product.shortDescription || product.seoDescription);
      const features = product.features.map((feature) => typeof feature === 'string'
        ? safeLine(feature)
        : `${safeLine(feature.title)}${feature.description ? ` — ${safeLine(feature.description)}` : ''}`,
      ).filter(Boolean);
      lines.push(
        `### ${safeLine(product.name, product.slug)}`,
        `- Canonical: ${absoluteUrl(siteUrl, `${prefix}/products/${product.slug}`)}`,
        ...(summary ? [`- Summary: ${summary}`] : []),
        ...(details.length > 0 ? [`- Procurement: ${details.join('; ')}`] : []),
        ...product.specs.map((spec) => `- Specification — ${safeLine(spec.label)}: ${safeLine(spec.value)}`),
        ...features.map((feature) => `- Feature: ${feature}`),
        '- Confirm current specifications and commercial terms directly before procurement.',
        '',
      );
    }

    lines.push(`## ${label} articles`, '');
    if (content.posts.length === 0) lines.push('- See the live blog for current articles.');
    for (const post of content.posts) {
      const body = safeLine(post.body || post.excerpt || post.seoDescription);
      lines.push(
        `### ${safeLine(post.title, post.slug)}`,
        `- Canonical: ${absoluteUrl(siteUrl, `${prefix}/blog/${post.slug}`)}`,
        ...(post.publishedAt ? [`- Published: ${post.publishedAt}`] : []),
        `- Updated: ${post.updatedAt}`,
        `- Author: ${safeLine(post.authorName)}`,
        ...(body ? [`- Content: ${body}`] : []),
        '',
      );
    }

    lines.push(`## ${label} frequently asked questions`, '');
    if (content.faqs.length === 0) lines.push('- See the live FAQ page for current answers.');
    for (const faq of content.faqs) {
      lines.push(`### ${safeLine(faq.question)}`, '', safeLine(faq.answer), '');
    }
  };

  appendLocale('English', '', en);
  appendLocale('Spanish', '/es', es);

  lines.push('## Contact and verification', '',
    `- [Request a quotation](${absoluteUrl(siteUrl, '/contact')})`,
    `- [Certificate records published by the company](${absoluteUrl(siteUrl, '/certificates')})`,
    '- Confirm time-sensitive specifications, certification applicability, pricing, MOQ, and delivery terms directly with the company before procurement.',
    '',
  );

  return lines.join('\n');
}

export function buildAgentCatalog({ siteUrl, settings, en, es }: AgentCatalogInput) {
  const brand = safeLine(settings.brandName || settings.companyName, 'Li-Men');
  const companyName = safeLine(settings.companyName, brand);
  const sameAs = settings.socialLinks
    .filter((link) => link.enabled && /^https?:\/\//i.test(link.url))
    .map((link) => link.url);

  const localize = (locale: 'en' | 'es', content: LocalizedPublicContent) => {
    const prefix = locale === 'es' ? '/es' : '';
    return {
      language: locale,
      catalogUrl: absoluteUrl(siteUrl, `${prefix}/products`),
      categoryCount: content.categories.length,
      productCount: content.products.length,
      categories: content.categories.map((category) => ({
        name: safeLine(category.name, category.slug),
        slug: category.slug,
        canonicalUrl: absoluteUrl(siteUrl, `${prefix}/products/category/${category.slug}`),
        alternateLanguageUrl: absoluteUrl(siteUrl, `${locale === 'es' ? '' : '/es'}/products/category/${category.slug}`),
        description: safeLine(category.description || category.seoDescription) || undefined,
        updatedAt: category.updatedAt,
      })),
      products: content.products.map((product) => ({
        name: safeLine(product.name, product.slug),
        slug: product.slug,
        canonicalUrl: absoluteUrl(siteUrl, `${prefix}/products/${product.slug}`),
        alternateLanguageUrl: absoluteUrl(siteUrl, `${locale === 'es' ? '' : '/es'}/products/${product.slug}`),
        category: product.category
          ? {
              name: safeLine(product.category.name, product.category.slug),
              slug: product.category.slug,
            }
          : undefined,
        sku: product.sku ? safeLine(product.sku) : undefined,
        summary: safeLine(product.description || product.shortDescription || product.seoDescription) || undefined,
        specifications: product.specs.map((spec) => ({
          name: safeLine(spec.label),
          value: safeLine(spec.value),
        })),
        features: product.features.map((feature) => typeof feature === 'string'
          ? { name: safeLine(feature) }
          : {
              name: safeLine(feature.title),
              description: feature.description ? safeLine(feature.description) : undefined,
            }),
        applications: product.applications.map((application) => ({
          name: safeLine(application.title),
          description: application.description ? safeLine(application.description) : undefined,
        })),
        procurement: {
          commercialModel: 'quotation',
          oemOdmSupport: product.oemOdmSupport,
          minimumOrderQuantity: product.moq ? safeLine(product.moq) : undefined,
          packaging: product.packagingInfo ? safeLine(product.packagingInfo) : undefined,
          verificationRequired: true,
        },
        specificationSheetUrl: product.specSheetUrl
          ? absoluteUrl(siteUrl, product.specSheetUrl)
          : undefined,
        updatedAt: product.updatedAt,
      })),
    };
  };

  return {
    schemaVersion: '1.1',
    canonicalWebsite: absoluteUrl(siteUrl, '/'),
    generatedFrom: 'public website content',
    contentUpdatedAt: latestContentUpdate(en.categories, en.products, es.categories, es.products),
    provider: {
      name: companyName,
      legalName: companyName,
      brand,
      type: 'B2B water purifier manufacturer',
      website: absoluteUrl(siteUrl, '/'),
      contactUrl: absoluteUrl(siteUrl, '/contact'),
      email: settings.companyEmail ? safeLine(settings.companyEmail) : undefined,
      telephone: settings.companyPhone ? safeLine(settings.companyPhone) : undefined,
      address: settings.companyAddress ? safeLine(settings.companyAddress) : undefined,
      sameAs: sameAs.length > 0 ? sameAs : undefined,
    },
    commercialPolicy: {
      salesModel: 'B2B enquiry and quotation',
      publicCheckout: false,
      note: 'Confirm specifications, certification applicability, pricing, MOQ, lead time, packaging and customization directly before procurement.',
    },
    locales: {
      en: localize('en', en),
      es: localize('es', es),
    },
  };
}
