import { test } from 'node:test';
import assert from 'node:assert/strict';
import { productJsonLd, productCollectionJsonLd, collectionPageJsonLd, articleJsonLd, faqPageJsonLd, websiteJsonLd, breadcrumbListJsonLd, organizationJsonLd, certificateItemListJsonLd, aboutPageJsonLd, webPageJsonLd } from './jsonld';
import type { Product } from '@/types/product';
import type { BlogPost } from '@/types/blog';
import type { Faq } from '@/types/content';
import type { PublicSiteSettings } from '@/types/settings';

const product: Product = {
  id: 1,
  name: 'RO-500',
  slug: 'ro-500',
  sku: 'RO-500',
  categoryId: 1,
  shortDescription: 'A compact RO system.',
  description: 'Full description.',
  mainImage: '/uploads/ro-500.webp',
  galleryImages: [],
  specs: [],
  features: [],
  applications: [],
  packagingInfo: null,
  moq: null,
  oemOdmSupport: true,
  specSheetUrl: null,
  status: 'PUBLISHED',
  featured: false,
  sortOrder: 1,
  seoTitle: null,
  seoDescription: null,
  seoKeywords: null,
  ogImage: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const post: BlogPost = {
  id: 1,
  title: 'Water Filtration 101',
  slug: 'water-filtration-101',
  excerpt: 'An intro.',
  body: 'Body text.',
  coverImage: null,
  categoryId: 1,
  authorName: 'Li-Men',
  status: 'PUBLISHED',
  publishedAt: '2026-01-01T00:00:00.000Z',
  seoTitle: null,
  seoDescription: null,
  tags: [],
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const faqs: Faq[] = [{ id: 1, question: 'What is RO?', answer: 'Reverse osmosis.', category: null }];

test('productCollectionJsonLd exposes the visible catalog as a localized ItemList', () => {
  const result = productCollectionJsonLd([product], 'https://koigatetech.com', 'es');

  assert.equal(result['@type'], 'CollectionPage');
  assert.equal(result.url, 'https://koigatetech.com/es/products');
  assert.equal(result.inLanguage, 'es');
  assert.equal(result.mainEntity.numberOfItems, 1);
  assert.deepEqual(result.mainEntity.itemListElement, [{
    '@type': 'ListItem',
    position: 1,
    name: 'RO-500',
    url: 'https://koigatetech.com/es/products/ro-500',
  }]);
});

test('collectionPageJsonLd connects a category with its visible product items', () => {
  const result = collectionPageJsonLd({
    name: 'RO Systems',
    description: 'Reverse osmosis systems.',
    url: 'https://koigatetech.com/products/category/ro-systems',
    itemCount: 2,
    items: [
      { name: 'RO-500', url: 'https://koigatetech.com/products/ro-500' },
      { name: 'RO-800', url: 'https://koigatetech.com/products/ro-800' },
    ],
    breadcrumbs: [
      { name: 'Home', url: 'https://koigatetech.com' },
      { name: 'RO Systems', url: 'https://koigatetech.com/products/category/ro-systems' },
    ],
  });

  const collection = result['@graph'][0]!;
  const mainEntity = 'mainEntity' in collection ? collection.mainEntity : undefined;
  assert.ok(mainEntity);
  assert.equal(mainEntity.numberOfItems, 2);
  assert.deepEqual(mainEntity.itemListElement, [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'RO-500',
      url: 'https://koigatetech.com/products/ro-500',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'RO-800',
      url: 'https://koigatetech.com/products/ro-800',
    },
  ]);
});

const settings: PublicSiteSettings = {
  companyName: 'Li-Men',
  brandName: 'Li-Men',
  companyLogoUrl: null,
  faviconUrl: null,
  companyAddress: null,
  companyMapImage: null,
  companyMapMobileImage: null,
  companyEmail: null,
  companyPhone: null,
  whatsappNumber: null,
  whatsappLink: null,
  socialLinks: [],
  turnstileEnabled: false,
  turnstileSiteKey: null,
  defaultSeoTitle: null,
  defaultSeoDescription: null,
  defaultOgImage: null,
  googleSiteVerification: null,
  heroHeadline: '',
  heroSubheadline: '',
  heroButton1Text: '',
  heroButton1Link: '',
  heroButton2Text: '',
  heroButton2Link: '',
  heroDesktopImage: null,
  heroMobileImage: null,
  homepageVideoUrl: null,
  coreAdvantages: [],
  footerText: null,
  footerColumns: null,
  footerCompanyIntro: null,
  metaPixelId: null,
  tiktokPixelId: null,
  googlePixelId: null,
  googleAdsId: null,
  siteBaseUrl: null,
};

const SITE_URL = 'http://localhost:3000';
const PROD_SITE_URL = 'https://koigatetech.com';

test('productJsonLd: defaults inLanguage to "en" and links to the English URL', () => {
  const result = productJsonLd(product, SITE_URL);
  assert.equal(result.inLanguage, 'en');
  assert.equal(result.url, 'http://localhost:3000/products/ro-500');
});

test('productJsonLd: locale="es" sets inLanguage and links to the /es URL', () => {
  const result = productJsonLd(product, SITE_URL, 'es');
  assert.equal(result.inLanguage, 'es');
  assert.equal(result.url, 'http://localhost:3000/es/products/ro-500');
});

test('productJsonLd: uses the runtime site URL passed in, not a hardcoded value', () => {
  const result = productJsonLd(product, PROD_SITE_URL);
  assert.equal(result.url, 'https://koigatetech.com/products/ro-500');
});

test('productJsonLd: describes a B2B quote-request page without entering Product rich results', () => {
  const result = productJsonLd({
    ...product,
    galleryImages: [
      { url: '/uploads/ro-detail.webp', alt: 'RO detail' },
      { url: '/uploads/ro-500.webp', alt: 'Duplicate main image' },
    ],
  }, PROD_SITE_URL);
  assert.equal(result['@type'], 'WebPage');
  assert.equal(result['@id'], 'https://koigatetech.com/products/ro-500#webpage');
  assert.deepEqual(result.primaryImageOfPage, {
    '@type': 'ImageObject',
    url: 'https://koigatetech.com/uploads/ro-500.webp',
  });
  assert.deepEqual(result.isPartOf, { '@id': 'https://koigatetech.com/#website' });
  assert.deepEqual(result.about, { '@id': 'https://koigatetech.com/#organization' });
});

test('productJsonLd: does not claim an offer or rating that is absent from the page', () => {
  const result = productJsonLd({
    ...product,
    category: {
      id: 2,
      name: 'Under Sink RO Systems',
      slug: 'under-sink-ro-systems',
      description: null,
      image: null,
      sortOrder: 0,
      published: true,
      seoTitle: null,
      seoDescription: null,
      updatedAt: '2026-08-29T00:00:00.000Z',
    },
  }, SITE_URL);

  assert.equal('offers' in result, false);
  assert.equal('review' in result, false);
  assert.equal('aggregateRating' in result, false);
});

test('productJsonLd: does not expose Product-only specification properties', () => {
  const result = productJsonLd({
    ...product,
    specs: [
      { label: 'Rated flow', value: '500 GPD' },
      { label: 'Voltage', value: '220 V' },
      { label: ' ', value: 'ignored' },
    ],
  }, PROD_SITE_URL);

  assert.equal('additionalProperty' in result, false);
});

test('certificateItemListJsonLd omits unverified scope and exposes verified scope only when present', () => {
  const result = certificateItemListJsonLd([
    {
      id: 1, name: 'Test document', certType: null, certNumber: 'CERT-1', issuingAuthority: 'Test issuer',
      issueDate: '2026-01-01T00:00:00.000Z', expiryDate: null, imageUrl: '/uploads/cert.webp', pdfUrl: null,
      description: null, applicableProductType: null, applicableModels: [],
    },
  ], PROD_SITE_URL, 'Zhongshan Li-Men Technology Co., Ltd.');
  const item = result.itemListElement[0]!.item;
  assert.equal(item.identifier, 'CERT-1');
  assert.equal(item.about, undefined);
  assert.deepEqual(item.sourceOrganization, { '@type': 'Organization', name: 'Zhongshan Li-Men Technology Co., Ltd.' });
});

test('articleJsonLd: locale="es" sets inLanguage and links to the /es blog URL', () => {
  const result = articleJsonLd(post, SITE_URL, 'es');
  assert.equal(result.inLanguage, 'es');
  assert.equal(result.url, 'http://localhost:3000/es/blog/water-filtration-101');
});

test('articleJsonLd: defaults to English when locale omitted', () => {
  const result = articleJsonLd(post, SITE_URL);
  assert.equal(result.inLanguage, 'en');
  assert.equal(result.url, 'http://localhost:3000/blog/water-filtration-101');
});

test('articleJsonLd: uses the runtime site URL passed in, not a hardcoded value', () => {
  const result = articleJsonLd(post, PROD_SITE_URL);
  assert.equal(result.url, 'https://koigatetech.com/blog/water-filtration-101');
  assert.equal(result.dateModified, post.updatedAt);
  assert.deepEqual(result.mainEntityOfPage, {
    '@type': 'WebPage',
    '@id': 'https://koigatetech.com/blog/water-filtration-101',
  });
});

test('faqPageJsonLd: inLanguage matches the passed locale', () => {
  assert.equal(faqPageJsonLd(faqs, 'es').inLanguage, 'es');
  assert.equal(faqPageJsonLd(faqs, 'en').inLanguage, 'en');
  assert.equal(faqPageJsonLd(faqs).inLanguage, 'en');
});

test('faqPageJsonLd: maps each faq to a Question/Answer pair', () => {
  const result = faqPageJsonLd(faqs, 'en');
  assert.equal(result.mainEntity.length, 1);
  assert.equal(result.mainEntity[0]!.name, 'What is RO?');
  assert.equal(result.mainEntity[0]!.acceptedAnswer.text, 'Reverse osmosis.');
});

test('websiteJsonLd: url points at the localized homepage', () => {
  assert.equal(websiteJsonLd(settings, SITE_URL, 'es').url, 'http://localhost:3000/es');
  assert.equal(websiteJsonLd(settings, SITE_URL, 'en').url, 'http://localhost:3000');
});

test('websiteJsonLd: uses the runtime site URL passed in, not a hardcoded value', () => {
  assert.equal(websiteJsonLd(settings, PROD_SITE_URL, 'en').url, 'https://koigatetech.com');
});

test('organizationJsonLd: homepage URL matches the bare-origin canonical', () => {
  assert.equal(organizationJsonLd(settings, PROD_SITE_URL).url, 'https://koigatetech.com');
});

test('aboutPageJsonLd: links localized about pages to the canonical organization entity', () => {
  const result = aboutPageJsonLd(settings, PROD_SITE_URL, 'es');
  assert.equal(result.url, 'https://koigatetech.com/es/about');
  assert.equal(result.inLanguage, 'es');
  assert.deepEqual(result.about, { '@id': 'https://koigatetech.com/#organization' });
  assert.deepEqual(result.isPartOf, { '@id': 'https://koigatetech.com/es#website' });
});

test('faqPageJsonLd: accepts visible page questions without requiring database-only fields', () => {
  const result = faqPageJsonLd([
    { question: 'What is the MOQ?', answer: 'MOQ depends on the selected model and project.' },
  ], 'en');

  assert.equal(result.mainEntity[0]!.name, 'What is the MOQ?');
  assert.equal(result.mainEntity[0]!.acceptedAnswer.text, 'MOQ depends on the selected model and project.');
});

test('organizationJsonLd: preserves an already absolute logo URL', () => {
  const result = organizationJsonLd(
    { ...settings, companyLogoUrl: 'https://koigatetech.com/uploads/logo.webp' },
    PROD_SITE_URL,
  );
  assert.equal(result.logo, 'https://koigatetech.com/uploads/logo.webp');
});

test('organizationJsonLd: exposes a stable entity id and only enabled absolute social profiles', () => {
  const result = organizationJsonLd(
    {
      ...settings,
      socialLinks: [
        { platform: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/company/li-men', enabled: true },
        { platform: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@limen', enabled: false },
        { platform: 'instagram', label: 'Instagram', url: '/instagram', enabled: true },
      ],
    },
    PROD_SITE_URL,
  );

  assert.equal(result['@id'], 'https://koigatetech.com/#organization');
  assert.deepEqual(result.sameAs, ['https://www.linkedin.com/company/li-men']);
});

test('organizationJsonLd: exposes factual B2B identity and sales contact details', () => {
  const result = organizationJsonLd(
    {
      ...settings,
      companyAddress: 'No. 72 Yufeng Road, Zhongshan City, Guangdong Province, China',
      companyEmail: 'sales@example.com',
      companyPhone: '+86 123 4567 8901',
      defaultSeoDescription: 'B2B water purifier manufacturer supporting OEM and ODM projects.',
    },
    PROD_SITE_URL,
  );

  assert.equal(result.description, 'B2B water purifier manufacturer supporting OEM and ODM projects.');
  assert.deepEqual(result.address, {
    '@type': 'PostalAddress',
    streetAddress: 'No. 72 Yufeng Road, Zhongshan City, Guangdong Province, China',
    addressCountry: 'CN',
  });
  assert.deepEqual(result.contactPoint, {
    '@type': 'ContactPoint',
    contactType: 'sales',
    email: 'sales@example.com',
    telephone: '+86 123 4567 8901',
    availableLanguage: ['English', 'Spanish'],
  });
});

test('breadcrumbListJsonLd: resolves each item href against the runtime site URL', () => {
  const result = breadcrumbListJsonLd([{ label: 'Home', href: '/' }, { label: 'Products', href: '/products' }], PROD_SITE_URL);
  assert.equal(result.itemListElement[0]!.item, 'https://koigatetech.com/');
  assert.equal(result.itemListElement[1]!.item, 'https://koigatetech.com/products');
});

test('webPageJsonLd: keeps the live static-page compatibility export', () => {
  const result = webPageJsonLd({
    type: 'ContactPage',
    name: 'Contact Li-Men',
    description: 'Request a quotation.',
    url: 'https://koigatetech.com/contact',
    breadcrumbs: [
      { name: 'Home', url: 'https://koigatetech.com' },
      { name: 'Contact', url: 'https://koigatetech.com/contact' },
    ],
  });
  assert.equal(result['@graph'][0]!['@type'], 'ContactPage');
  const breadcrumbGraph = result['@graph'][1];
  assert.equal(
    'itemListElement' in breadcrumbGraph && breadcrumbGraph.itemListElement
      ? breadcrumbGraph.itemListElement.length
      : 0,
    2,
  );
});

test('productJsonLd: never produces a double slash between the domain and the path', () => {
  const result = productJsonLd(product, PROD_SITE_URL);
  assert.equal(result.url.includes('//', 'https://'.length), false);
});

test('changing only the site URL leaves the pathname/slug/locale segment of the generated URL untouched', () => {
  const before = productJsonLd(product, SITE_URL, 'es');
  const after = productJsonLd(product, PROD_SITE_URL, 'es');
  const pathOf = (url: string) => url.replace(/^https?:\/\/[^/]+/, '');
  assert.equal(pathOf(before.url), pathOf(after.url));
  assert.equal(pathOf(after.url), '/es/products/ro-500');
});
