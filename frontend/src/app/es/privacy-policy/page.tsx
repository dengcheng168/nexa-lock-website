import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getPageBySlug } from '@/lib/api/content';
import { t } from '@/lib/i18n/site-strings';
import { getDefaultSocialImages } from '@/lib/seo/base-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [page, images] = await Promise.all([getPageBySlug('privacy-policy', 'es'), getDefaultSocialImages()]);
  return {
    title: page?.seoTitle ?? page?.title ?? t('es', 'privacyPolicyPageTitle'),
    description: page?.seoDescription || 'Consulta la política de privacidad del sitio web de Koigatech y de las consultas de contacto.',
    alternates: {
      canonical: '/es/privacy-policy',
      languages: { en: '/privacy-policy', es: '/es/privacy-policy', 'x-default': '/privacy-policy' },
    },
    openGraph: { type: 'website', url: '/es/privacy-policy', images },
  };
}

export default async function SpanishPrivacyPolicyPage() {
  const page = await getPageBySlug('privacy-policy', 'es');

  return (
    <Container className="py-12">
      <Breadcrumbs items={[{ label: t('es', 'breadcrumbHome'), href: '/es' }, { label: t('es', 'breadcrumbPrivacyPolicy') }]} locale="es" />
      <h1 className="mt-4 text-3xl font-semibold text-navy-950">{page?.title ?? t('es', 'privacyPolicyPageTitle')}</h1>
      {page?.bodyHtml && (
        <div
          className="prose prose-sm mt-6 max-w-3xl text-grey-700"
          dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
        />
      )}
    </Container>
  );
}
