import assert from 'node:assert/strict';
import test from 'node:test';
import type { BlogPost } from '@/types/blog';
import type { Product, ProductCategory } from '@/types/product';
import type { PublicSiteSettings } from '@/types/settings';
import { buildAgentCatalog, buildLlmsFullTxt, buildLlmsTxt } from './llms';

const settings = {
  companyName: 'Li-Men Water Treatment Equipment Co., Ltd.',
  brandName: 'Li-Men',
  defaultSeoDescription: 'B2B water purifier manufacturer.',
  footerCompanyIntro: null,
  heroSubheadline: 'Water purification solutions.',
  companyAddress: 'Zhongshan, Guangdong, China',
  socialLinks: [{ platform: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/company/example', enabled: true }],
} as PublicSiteSettings;

const category = {
  id: 1,
  name: 'RO Systems',
  slug: 'ro-systems',
  description: '<p>Reverse osmosis platforms.</p>',
} as ProductCategory;

const product = {
  id: 1,
  name: 'Commercial RO 400',
  slug: 'commercial-ro-400',
  sku: 'RO-400',
  categoryId: 1,
  shortDescription: '<p>Commercial reverse osmosis system.</p>',
  description: '<p>Commercial reverse osmosis system.</p>',
  mainImage: '/uploads/ro-400.webp',
  galleryImages: [],
  seoDescription: null,
  seoKeywords: 'private internal keyword list',
  oemOdmSupport: true,
  moq: '10 units',
  specs: [{ label: 'Flow rate', value: '400 GPD' }],
  features: [],
  applications: [],
  packagingInfo: null,
  specSheetUrl: null,
  status: 'PUBLISHED',
  featured: false,
  sortOrder: 1,
  seoTitle: null,
  ogImage: null,
  updatedAt: '2026-01-02T00:00:00.000Z',
} as Product;

const post = {
  id: 1,
  title: 'How to source a water purifier',
  slug: 'source-water-purifier',
  excerpt: '<p>A practical buyer guide.</p>',
  body: '<p>A practical buyer guide.</p>',
  seoDescription: null,
  authorName: 'Li-Men',
  publishedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
} as BlogPost;

test('llms.txt publishes stable discovery links and quote context', () => {
  const output = buildLlmsTxt({ siteUrl: 'https://example.com', settings, categories: [category] });
  assert.match(output, /^# Li-Men/m);
  assert.match(output, /https:\/\/example\.com\/products/);
  assert.match(output, /not a checkout store/);
  assert.match(output, /https:\/\/example\.com\/llms-full\.txt/);
  assert.match(output, /https:\/\/example\.com\/catalog\.json/);
  assert.match(output, /\[RO Systems\]\(https:\/\/example\.com\/products\/category\/ro-systems\)/);
  assert.doesNotMatch(output, /<p>/);
});

test('llms-full.txt exposes public facts without hidden SEO fields or HTML', () => {
  const output = buildLlmsFullTxt({
    siteUrl: 'https://example.com',
    settings,
    en: { categories: [category], products: [product], posts: [post], faqs: [] },
    es: { categories: [], products: [], posts: [], faqs: [] },
  });

  assert.match(output, /Commercial RO 400/);
  assert.match(output, /SKU: RO-400/);
  assert.match(output, /Flow rate: 400 GPD/);
  assert.match(output, /Content last updated: 2026-01-02T00:00:00.000Z/);
  assert.match(output, /https:\/\/example\.com\/blog\/source-water-purifier/);
  assert.doesNotMatch(output, /<p>/);
  assert.doesNotMatch(output, /private internal keyword list/);
});

test('agent catalog exposes verified public product facts without SEO-only fields', () => {
  const output = buildAgentCatalog({
    siteUrl: 'https://example.com',
    settings,
    en: { categories: [category], products: [product], posts: [], faqs: [] },
    es: { categories: [], products: [], posts: [], faqs: [] },
  });

  assert.equal(output.schemaVersion, '1.1');
  assert.equal(output.contentUpdatedAt, '2026-01-02T00:00:00.000Z');
  assert.equal(output.provider.brand, 'Li-Men');
  assert.equal(output.provider.legalName, 'Li-Men Water Treatment Equipment Co., Ltd.');
  assert.equal(output.provider.address, 'Zhongshan, Guangdong, China');
  assert.deepEqual(output.provider.sameAs, ['https://www.linkedin.com/company/example']);
  assert.equal(output.locales.en.productCount, 1);
  assert.equal(output.locales.en.categoryCount, 1);
  assert.equal(output.locales.en.products[0].canonicalUrl, 'https://example.com/products/commercial-ro-400');
  assert.equal(output.locales.en.products[0].alternateLanguageUrl, 'https://example.com/es/products/commercial-ro-400');
  assert.equal(output.locales.en.products[0].procurement.commercialModel, 'quotation');
  assert.equal(output.locales.en.products[0].specifications[0].value, '400 GPD');
  assert.doesNotMatch(JSON.stringify(output), /private internal keyword list/);
});
