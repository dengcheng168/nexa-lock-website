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
import { ProductInfoCard } from '@/components/product/ProductInfoCard';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { ProductPrevNextNav } from '@/components/product/ProductPrevNextNav';
import { ProductEvidenceLinks } from '@/components/product/ProductEvidenceLinks';
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
  const result = await getProductBySlug(productSlug, 'es');
  if (!result) return {};

  const { product } = result;
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
    keywords: product.seoKeywords ?? undefined,
    alternates: {
      canonical: `/es/products/${productSlug}`,
      languages: {
        en: `/products/${productSlug}`,
        es: `/es/products/${productSlug}`,
        'x-default': `/products/${productSlug}`,
      },
    },
    openGraph: {
      url: `/es/products/${productSlug}`,
      locale: 'es',
      alternateLocale: 'en',
      images: product.ogImage ? [product.ogImage] : [product.mainImage],
    },
  };
}

export default async function SpanishProductDetailPage({
  params,
}: {
  params: Promise<{ productSlug: string }>;
}) {
  const { productSlug } = await params;
  const [result, settings, siteUrl, allProducts] = await Promise.all([
    getProductBySlug(productSlug, 'es'),
    getPublicSettings(),
    getSiteUrl(),
    listAllProducts('es'),
  ]);

  if (!result) notFound();
  const { product, related } = result;

  const { prev: prevProduct, next: nextProduct } = getAdjacentProducts(product, allProducts);

  const whatsappHref = getWhatsappHref(
    settings,
    `Hola, estoy interesado en ${product.name}${product.sku ? ` (${product.sku})` : ''}. Envíeme el MOQ, el precio, el plazo de entrega y las opciones de OEM.`,
  );

  const purchaseInfoItems: PurchaseInfoItem[] = [
    ...(product.moq ? [{ label: t('es', 'moqLabel'), value: product.moq }] : []),
    ...(product.packagingInfo ? [{ label: t('es', 'packagingLabel'), value: product.packagingInfo }] : []),
    ...(product.oemOdmSupport ? [{ label: t('es', 'oemOdmLabel'), value: t('es', 'oemOdmSupported') }] : []),
  ];

  const hasDescription = Boolean(product.description);

  return (
    <Container className="max-w-[1400px] py-8 lg:py-10">
      <JsonLd data={productJsonLd(product, siteUrl, 'es')} />
      <JsonLd
        data={breadcrumbListJsonLd(
          [
            { label: t('es', 'breadcrumbHome'), href: '/es' },
            { label: t('es', 'breadcrumbProducts'), href: '/es/products' },
            ...(product.category
              ? [{ label: product.category.name, href: `/es/products/category/${product.category.slug}` }]
              : []),
            { label: product.name, href: `/es/products/${product.slug}` },
          ],
          siteUrl,
        )}
      />

      <Breadcrumbs
        className="text-xs"
        items={[
          { label: t('es', 'breadcrumbHome'), href: '/es' },
          { label: t('es', 'breadcrumbProducts'), href: '/es/products' },
          ...(product.category
            ? [{ label: product.category.name, href: `/es/products/category/${product.category.slug}` }]
            : []),
          { label: product.name },
        ]}
        locale="es"
      />

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[1.02fr_minmax(430px,0.98fr)] lg:gap-10">
        <ProductGallery
          mainImage={product.mainImage}
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
          {product.sku && (
            <p className="mt-1.5 text-sm text-grey-500">
              {t('es', 'skuLabel')}: {product.sku}
            </p>
          )}

          {product.shortDescription && (
            <p className="mt-4 line-clamp-4 max-w-[640px] text-[15px] leading-[1.75] text-grey-700">
              {product.shortDescription}
            </p>
          )}
          {hasDescription && (
            <a href="#description" className="mt-1 inline-block text-sm font-medium text-water-600 hover:text-water-500">
              {t('es', 'readMoreDescription')}
            </a>
          )}

          <ProductPurchaseInfo items={purchaseInfoItems} />

          <div
            id="quote"
            className="mt-5 grid max-w-[500px] grid-cols-1 gap-3 sm:grid-cols-[minmax(150px,0.9fr)_minmax(210px,1.1fr)]"
          >
            <Button href="#inquiry" variant="primary" className="min-h-[52px] w-full">
              {t('es', 'headerCta')}
            </Button>
            {whatsappHref && (
              <Button href={whatsappHref} target="_blank" variant="outline" className="min-h-[52px] w-full gap-2">
                <WhatsAppIcon className="h-5 w-5 shrink-0" />
                {t('es', 'contactViaWhatsapp')}
              </Button>
            )}
          </div>

          <ProductHighlights features={product.features} />
        </div>
      </div>

      {product.specs.length > 0 && (
        <section className="mt-10 border-t border-grey-200 pt-6 lg:mt-11 lg:pt-7">
          <div className="text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-water-600">Información del Producto</p>
            <h2 className="mt-1 text-2xl font-semibold text-navy-950 sm:text-[26px]">{t('es', 'specifications')}</h2>
          </div>
          {product.specSheetUrl && (
            <div className="mt-3 text-center">
              <a
                href={product.specSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-water-600 hover:text-water-500"
              >
                {t('es', 'downloadSpecSheet')} &darr;
              </a>
            </div>
          )}
          <div className="mt-5">
            <ProductSpecTable specs={product.specs} />
          </div>
        </section>
      )}

      {product.features.length > 0 && (
        <section className="mt-12 border-t border-grey-200 pt-8 lg:mt-14 lg:pt-9">
          <SectionHeading title={t('es', 'productFeatures')} />
          <div className="mt-7 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {product.features.map((feature, i) => {
              const label = typeof feature === 'string' ? feature : feature.title;
              const description = typeof feature === 'string' ? undefined : feature.description;
              return (
                <div
                  key={`${label}-${i}`}
                  className="flex min-h-[86px] items-start gap-3 rounded-md border border-grey-200 bg-white p-4 shadow-sm"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-water-100 text-sm font-bold text-water-600"
                  >
                    &#10003;
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold leading-snug text-navy-950">{label}</p>
                    {description && <p className="mt-1 text-[13px] leading-relaxed text-grey-500">{description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {product.applications.length > 0 && (
        <section className="mt-12 border-t border-grey-200 pt-8 lg:mt-14 lg:pt-9">
          <SectionHeading title={t('es', 'applicationScenarios')} />
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {product.applications.map((app) => (
              <ProductInfoCard key={app.title} title={app.title} description={app.description} />
            ))}
          </div>
        </section>
      )}

      {hasDescription && (
        <section id="description" className="mt-12 scroll-mt-24 border-t border-grey-200 pt-8 lg:mt-14 lg:pt-9">
          <SectionHeading title={t('es', 'productDescription')} />
          <div
            className="prose prose-sm mt-6 max-w-none text-grey-700"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </section>
      )}

      <ProductEvidenceLinks locale="es" />

      <RelatedProducts products={related} locale="es" />

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
        locale="es"
      />

      <section id="inquiry" className="mt-14 scroll-mt-24 pt-2 lg:mt-16">
        <SectionHeading title={t('es', 'sectionInquiryTitle')} />
        <div className="mx-auto mt-8 max-w-[1000px]">
          <InquiryForm sourcePage={`/es/products/${product.slug}`} defaultProductName={product.name} locale="es" turnstileEnabled={settings.turnstileEnabled} turnstileSiteKey={settings.turnstileSiteKey} />
        </div>
      </section>
    </Container>
  );
}
