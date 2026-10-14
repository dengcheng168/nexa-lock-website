import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { PageHeroBanner } from '@/components/site/PageHeroBanner';
import { CertificateCard } from '@/components/site/CertificateCard';
import { listCertificates, getPageBySlug } from '@/lib/api/content';
import { t } from '@/lib/i18n/site-strings';
import { getCertificateDisplayMeta, dedupeByRule } from '@/lib/certificates/display-config';
import { JsonLd } from '@/components/seo/JsonLd';
import { certificateItemListJsonLd } from '@/lib/seo/jsonld';
import { getPublicSettings } from '@/lib/api/settings';
import { getSiteUrl } from '@/lib/seo/site';
import { getDefaultSocialImages } from '@/lib/seo/base-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [page, images] = await Promise.all([getPageBySlug('certificates'), getDefaultSocialImages()]);
  return {
    title: page?.seoTitle ?? page?.title ?? 'Certificates',
    description: page?.seoDescription ?? 'Quality and compliance documents for our smart lock products.',
    alternates: {
      canonical: '/certificates',
      languages: { en: '/certificates', es: '/es/certificates', 'x-default': '/certificates' },
    },
    openGraph: { type: 'website', url: '/certificates', images },
  };
}

export default async function CertificatesPage() {
  const [allCertificates, page, settings, siteUrl] = await Promise.all([
    listCertificates(), getPageBySlug('certificates'), getPublicSettings(), getSiteUrl(),
  ]);
  const hasHero = Boolean(page?.heroImage || page?.heroImageMobile);

  // listCertificates() 只返回 published=true 的记录；这里再按证书业务字段（证书编号/
  // 签发机构+名称组合，见 lib/certificates/display-config.ts）去重，防止同一份证书被
  // 后台意外同时发布两条时重复展示
  const certificates = dedupeByRule(allCertificates);
  // displaySection（若填写）只决定证书出现在哪个标题下面；muted/徽章配色继续看 group
  // 本身，保证被网站所有者手动挪去 Approvals 标题下展示的过期证书仍然带着"已过期"的
  // 灰化样式和过期日期，不会被误当成当前有效认证
  const sectionOf = (c: (typeof certificates)[number]) => {
    const meta = getCertificateDisplayMeta(c);
    return meta.displaySection ?? meta.group;
  };
  const approvals = certificates.filter((c) => sectionOf(c) === 'approvals');
  const compliance = certificates.filter((c) => sectionOf(c) === 'compliance');
  const historical = certificates.filter((c) => sectionOf(c) === 'historical');
  const unclassified = certificates.filter((c) => sectionOf(c) === 'unclassified');

  return (
    <>
      <JsonLd data={certificateItemListJsonLd(certificates, siteUrl, settings.companyName, 'en')} />
      {hasHero && (
        <PageHeroBanner
          image={page?.heroImage}
          imageMobile={page?.heroImageMobile}
          eyebrow={t('en', 'certPageEyebrow')}
          title={page?.title ?? 'Certificates'}
        >
          {page?.bodyHtml && (
            <div
              className="prose prose-sm prose-invert mt-4 max-w-2xl text-grey-100/90"
              dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
            />
          )}
        </PageHeroBanner>
      )}

      <Container className="py-12">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Certificates' }]} />
        {!hasHero && (
          <>
            <h1 className="mt-4 text-3xl font-semibold text-navy-950">{page?.title ?? 'Certificates'}</h1>
            {page?.bodyHtml && (
              <div
                className="prose prose-sm mt-4 max-w-2xl text-grey-500"
                dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
              />
            )}
          </>
        )}

        <div className="mt-8 rounded-lg border border-water-100 bg-water-50 p-4 text-sm text-navy-950">
          {t('en', 'certScopeNotice')}
        </div>

        {approvals.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-navy-950">{t('en', 'certGroupApprovalsTitle')}</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {approvals.map((cert) => (
                <CertificateCard
                  key={cert.id}
                  certificate={cert}
                  locale="en"
                  muted={getCertificateDisplayMeta(cert).group === 'historical'}
                />
              ))}
            </div>
          </section>
        )}

        {compliance.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-navy-950">{t('en', 'certGroupComplianceTitle')}</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {compliance.map((cert) => (
                <CertificateCard key={cert.id} certificate={cert} locale="en" />
              ))}
            </div>
          </section>
        )}

        {historical.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-grey-500">{t('en', 'certGroupHistoricalTitle')}</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {historical.map((cert) => (
                <CertificateCard key={cert.id} certificate={cert} locale="en" muted />
              ))}
            </div>
          </section>
        )}

        {unclassified.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-navy-950">{t('en', 'certGroupUnclassifiedTitle')}</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {unclassified.map((cert) => (
                <CertificateCard key={cert.id} certificate={cert} locale="en" />
              ))}
            </div>
          </section>
        )}
      </Container>

      <section className="border-t border-grey-200 bg-[#f2f6fb] py-10 sm:py-12">
        <Container className="grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-12">
          <div className="border-l-4 border-water-500 pl-6 sm:pl-8">
            <h2 className="text-2xl font-semibold text-navy-950 sm:text-3xl">
              {t('en', 'certCtaTitle')}
            </h2>
            <p className="mt-3 max-w-3xl text-grey-600">{t('en', 'certCtaDescription')}</p>
          </div>
          <div className="pl-7 sm:pl-9 lg:pl-0">
            <Button href="/contact" variant="primary">
              {t('en', 'certCtaButton')}
            </Button>
          </div>
        </Container>
      </section>

    </>
  );
}
