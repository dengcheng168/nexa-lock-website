import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductSpecTable } from '@/components/product/ProductSpecTable';
import { ProductPurchaseInfo, type PurchaseInfoItem } from '@/components/product/ProductPurchaseInfo';
import { ProductHighlights } from '@/components/product/ProductHighlights';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { ProductPrevNextNav } from '@/components/product/ProductPrevNextNav';
import { InquiryForm } from '@/components/forms/InquiryForm';
import { JsonLd } from '@/components/seo/JsonLd';
import { SOCIAL_ICONS } from '@/components/layout/SocialIcons';
import { getProductBySlug, listAllProducts } from '@/lib/api/products';
import { getPublicSettings } from '@/lib/api/settings';
import { productJsonLd, breadcrumbListJsonLd } from '@/lib/seo/jsonld';
import { getSiteUrl } from '@/lib/seo/site';
import { getWhatsappHref } from '@/lib/utils/whatsapp';
import { getAdjacentProducts } from '@/lib/utils/product-navigation';
import { t } from '@/lib/i18n/site-strings';

const WhatsAppIcon = SOCIAL_ICONS.whatsapp;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}): Promise<Metadata> {
  const { productSlug } = await params;
  const result = await getProductBySlug(productSlug);
  if (!result) return {};

  const { product } = result;
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
    keywords: product.seoKeywords ?? undefined,
    alternates: {
      canonical: `/products/${productSlug}`,
      languages: {
        en: `/products/${productSlug}`,
        es: `/es/products/${productSlug}`,
        'x-default': `/products/${productSlug}`,
      },
    },
    openGraph: {
      url: `/products/${productSlug}`,
      locale: 'en',
      alternateLocale: 'es',
      images: product.ogImage ? [product.ogImage] : [product.mainImage],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}) {
  const { productSlug } = await params;
  const [result, settings, siteUrl, allProducts] = await Promise.all([
    getProductBySlug(productSlug),
    getPublicSettings(),
    getSiteUrl(),
    listAllProducts(),
  ]);

  if (!result) notFound();
  const { product, related } = result;

  const { prev: prevProduct, next: nextProduct } = getAdjacentProducts(product, allProducts);

  const whatsappHref = getWhatsappHref(
    settings,
    `Hello, I am interested in ${product.name}${product.sku ? ` (${product.sku})` : ''}. Please send me the MOQ, price, lead time and OEM options.`,
  );

  const purchaseInfoItems: PurchaseInfoItem[] = [
    ...(product.moq ? [{ label: 'MOQ', value: product.moq }] : []),
    ...(product.packagingInfo ? [{ label: 'Packaging', value: product.packagingInfo }] : []),
    ...(product.oemOdmSupport ? [{ label: 'OEM / ODM', value: 'Available' }] : []),
  ];

  const hasDescription = Boolean(product.description);

  return (
    <Container className="max-w-[1400px] py-8 lg:py-10">
      <JsonLd data={productJsonLd(product, siteUrl, 'en')} />
      <JsonLd
        data={breadcrumbListJsonLd(
          [
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            ...(product.category
              ? [{ label: product.category.name, href: `/products/category/${product.category.slug}` }]
              : []),
            { label: product.name, href: `/products/${product.slug}` },
          ],
          siteUrl,
        )}
      />

      <Breadcrumbs
        className="text-xs"
        items={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          ...(product.category ? [{ label: product.category.name, href: `/products/category/${product.category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[1.02fr_minmax(430px,0.98fr)] lg:gap-10">
        <ProductGallery
          mainImage={product.mainImage}
          videoUrl={product.videoUrl}
          images={product.galleryImages}
          name={product.name}
        />

        <div className="min-w-0">
          <h1 className="text-[clamp(28px,2.4vw,38px)] font-semibold leading-[1.15] text-navy-950">
            {product.name}{product.sku && !product.name.toLowerCase().includes(product.sku.toLowerCase()) ? ` | ${product.sku}` : ''}
          </h1>
          {product.category && (
            <p className="mt-1.5 text-[20px] font-bold leading-snug text-navy-800 sm:text-[22px]">
              {product.category.name}
            </p>
          )}
          {product.sku && <p className="mt-1.5 text-sm text-grey-500">SKU: {product.sku}</p>}

          {product.shortDescription && (
            <p className="mt-4 line-clamp-4 max-w-[640px] text-[15px] leading-[1.75] text-grey-700">
              {product.shortDescription}
            </p>
          )}
          {hasDescription && (
            <a href="#description" className="mt-1 inline-block text-sm font-medium text-water-600 hover:text-water-500">
              Read full description
            </a>
          )}

          <ProductPurchaseInfo items={purchaseInfoItems} />

          <div
            id="quote"
            className="mt-5 grid max-w-[500px] grid-cols-1 gap-3 sm:grid-cols-[minmax(150px,0.9fr)_minmax(210px,1.1fr)]"
          >
            <Button href="#inquiry" variant="primary" className="min-h-[52px] w-full">
              Get a Quote
            </Button>
            {whatsappHref && (
              <Button href={whatsappHref} target="_blank" variant="outline" className="min-h-[52px] w-full gap-2">
                <WhatsAppIcon className="h-5 w-5 shrink-0" />
                Contact via WhatsApp
              </Button>
            )}
          </div>

          <ProductHighlights features={product.features} />
        </div>
      </div>

      {product.specs.length > 0 && (
        <section className="mt-10 border-t border-grey-200 pt-6 lg:mt-11 lg:pt-7">
          <div className="text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-water-600">Product Information</p>
            <h2 className="mt-1 text-2xl font-semibold text-navy-950 sm:text-[26px]">Specifications</h2>
          </div>
          {product.specSheetUrl && (
            <div className="mt-3 text-center">
              <a
                href={product.specSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-water-600 hover:text-water-500"
              >
                {t('en', 'downloadSpecSheet')} &darr;
              </a>
            </div>
          )}
          <div className="mt-5">
            <ProductSpecTable specs={product.specs} />
          </div>
        </section>
      )}

      {(hasDescription || product.features.length > 0) && (
        <section id="description" className="mt-14 scroll-mt-24 bg-grey-50 px-6 py-9 sm:px-9 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:px-12 lg:py-11">
          <div>
            <p className="text-xs font-semibold text-water-600">Product details</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-navy-950">Product Overview</h2>
            {hasDescription && (
              <div
                className="prose prose-sm mt-5 max-w-none text-grey-700"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}
          </div>
          {product.features.length > 0 && (
            <div className="mt-8 border-t border-grey-200 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-10">
              {product.features.map((feature, i) => {
                const label = typeof feature === 'string' ? feature : feature.title;
                const description = typeof feature === 'string' ? undefined : feature.description;
                return (
                  <div key={`${label}-${i}`} className="flex gap-4 border-b border-grey-200 py-4 last:border-b-0">
                    <span aria-hidden="true" className="mt-0.5 text-sm font-bold text-water-600">&#10003;</span>
                    <div>
                      <p className="text-[15px] font-semibold text-navy-950">{label}</p>
                      {description && <p className="mt-1 text-sm leading-6 text-grey-500">{description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <RelatedProducts products={related} />

      <ProductPrevNextNav
        prev={
          prevProduct
            ? { slug: prevProduct.slug, name: prevProduct.name, sku: prevProduct.sku, image: prevProduct.mainImage }
            : null
        }
        next={
          nextProduct
            ? { slug: nextProduct.slug, name: nextProduct.name, sku: nextProduct.sku, image: nextProduct.mainImage }
            : null
        }
      />

      <section id="inquiry" className="mt-14 scroll-mt-24 pt-2 lg:mt-16">
        <SectionHeading title="Request a Quote" />
        <div className="mx-auto mt-8 max-w-[1000px]">
          <InquiryForm sourcePage={`/products/${product.slug}`} defaultProductName={product.name} turnstileEnabled={settings.turnstileEnabled} turnstileSiteKey={settings.turnstileSiteKey} />
        </div>
      </section>
    </Container>
  );
}
