import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import type { Locale } from '@/lib/i18n/locales';
import { localeHref } from '@/lib/i18n/paths';

export function BlogProjectCta({ locale = 'en' }: { locale?: Locale }) {
  const isSpanish = locale === 'es';

  return (
    <section className="border-y border-[#d7e4f2] bg-[#edf4fb]">
      <Container className="grid items-center gap-7 py-10 lg:grid-cols-[1fr_auto] lg:gap-12">
        <div className="border-l-4 border-water-500 pl-7">
          <h2 className="text-2xl font-semibold tracking-[-0.025em] text-navy-950 sm:text-3xl">
            {isSpanish ? 'Convierta sus ideas en un proyecto de acceso inteligente' : 'Turn Your Smart Access Ideas Into a Project'}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-navy-800/75 sm:text-base">
            {isSpanish
              ? 'Cuéntenos el tipo de puerta, los métodos de acceso, el mercado y las necesidades de personalización de su proyecto.'
              : 'Share your door type, access methods, target market and customization needs with our team.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Button href={localeHref('/contact', locale)} className="min-w-40 rounded-none">
            {isSpanish ? 'Solicitar cotización' : 'Request a Quote'}
          </Button>
          <Button href={localeHref('/products', locale)} variant="outline" className="min-w-40 rounded-none">
            {isSpanish ? 'Ver productos' : 'View Products'}
          </Button>
        </div>
      </Container>
    </section>
  );
}
