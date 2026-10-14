import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FaqAccordion } from '@/components/faq/FaqAccordion';
import { JsonLd } from '@/components/seo/JsonLd';
import { listFaqs } from '@/lib/api/content';
import { faqPageJsonLd } from '@/lib/seo/jsonld';
import { getDefaultSocialImages } from '@/lib/seo/base-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const images = await getDefaultSocialImages();
  return {
    title: 'Smart Lock OEM & ODM Frequently Asked Questions',
    description: 'Find answers about smart lock compatibility, OEM/ODM customization, minimum orders, quality control, certifications and lead times.',
    alternates: { canonical: '/faq', languages: { en: '/faq', es: '/es/faq', 'x-default': '/faq' } },
    openGraph: { type: 'website', url: '/faq', images },
  };
}

export default async function FaqPage() {
  const faqs = await listFaqs();

  return (
    <Container className="py-12">
      <JsonLd data={faqPageJsonLd(faqs)} />
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'FAQ' }]} />
      <h1 className="mt-4 text-3xl font-semibold text-navy-950">Frequently Asked Questions</h1>

      <div className="mt-10 max-w-3xl">
        <FaqAccordion faqs={faqs} />
      </div>
    </Container>
  );
}
