import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getPageBySlug } from '@/lib/api/content';
import { getDefaultSocialImages } from '@/lib/seo/base-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [page, images] = await Promise.all([getPageBySlug('terms-of-use'), getDefaultSocialImages()]);
  return {
    title: page?.seoTitle ?? page?.title ?? 'Terms of Use',
    description: page?.seoDescription || 'Read the terms of use for the Koigatech website.',
    alternates: {
      canonical: '/terms-of-use',
      languages: { en: '/terms-of-use', es: '/es/terms-of-use', 'x-default': '/terms-of-use' },
    },
    openGraph: { type: 'website', url: '/terms-of-use', images },
  };
}

export default async function TermsOfUsePage() {
  const page = await getPageBySlug('terms-of-use');

  return (
    <Container className="py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Terms of Use' }]} />
      <h1 className="mt-4 text-3xl font-semibold text-navy-950">{page?.title ?? 'Terms of Use'}</h1>
      {page?.bodyHtml && (
        <div
          className="prose prose-sm mt-6 max-w-3xl text-grey-700"
          dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
        />
      )}
    </Container>
  );
}
