import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InquiryForm } from '@/components/forms/InquiryForm';
import { PageHeroBanner } from '@/components/site/PageHeroBanner';
import { getPageBySlug } from '@/lib/api/content';
import { getPublicSettings } from '@/lib/api/settings';
import { getDefaultSocialImages } from '@/lib/seo/base-metadata';
import { Clock3, Mail, MessageCircle, Phone, ShieldCheck } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const [page, images] = await Promise.all([getPageBySlug('contact'), getDefaultSocialImages()]);
  return {
    title: page?.seoTitle ?? page?.title ?? 'Contact Us',
    description: page?.seoDescription ?? undefined,
    alternates: { canonical: '/contact', languages: { en: '/contact', es: '/es/contact', 'x-default': '/contact' } },
    openGraph: { type: 'website', url: '/contact', images },
  };
}

export default async function ContactPage() {
  const [page, settings] = await Promise.all([getPageBySlug('contact'), getPublicSettings()]);
  const hasHero = Boolean(page?.heroImage || page?.heroImageMobile);
  const hasMeaningfulBody = Boolean(page?.bodyHtml && !/placeholder/i.test(page.bodyHtml));

  return (
    <>
      {hasHero && (
        <PageHeroBanner image={page?.heroImage} imageMobile={page?.heroImageMobile} title={page?.title ?? 'Contact Us'}>
          {page?.bodyHtml && (
            <div
              className="prose prose-sm prose-invert mt-4 max-w-2xl text-grey-100/90"
              dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
            />
          )}
          <a
            href="#inquiry-form"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-water-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-water-600"
          >
            Get a Free Quote
          </a>
        </PageHeroBanner>
      )}

      {!hasHero && (
        <section className="relative overflow-hidden bg-navy-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_42%,rgba(44,161,219,.32),transparent_24%),radial-gradient(circle_at_86%_70%,rgba(255,255,255,.12),transparent_18%),linear-gradient(112deg,#061b36_0%,#0a2f56_56%,#0b4772_100%)]" />
          <div className="absolute -right-16 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border border-white/15 sm:right-[8%] sm:h-96 sm:w-96" />
          <div className="absolute -right-2 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full border border-white/10 sm:right-[13%] sm:h-64 sm:w-64" />
          <Container className="relative py-10 sm:py-14 lg:py-16">
            <div className="text-sm text-grey-300"><Link href="/" className="hover:text-white">Home</Link><span className="mx-2">/</span>Contact</div>
            <div className="mt-7 max-w-2xl">
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-[58px]">
                Let&apos;s define your water purification project.
              </h1>
              {hasMeaningfulBody ? (
                <div className="prose prose-sm prose-invert mt-5 max-w-xl text-grey-200" dangerouslySetInnerHTML={{ __html: page?.bodyHtml ?? '' }} />
              ) : (
                <p className="mt-5 max-w-xl text-base leading-7 text-grey-200 sm:text-lg">
                  Tell us about your water source, target capacity and order quantity. Our OEM/ODM team will turn your requirements into a practical product proposal.
                </p>
              )}
            </div>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/15 pt-5 text-sm text-grey-200">
              <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-water-300" />Reply within one business day</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-water-300" />Project details kept confidential</span>
            </div>
          </Container>
        </section>
      )}

      <Container className={`${hasHero ? 'py-8 sm:py-12' : 'relative -mt-px py-0 pb-12 sm:pb-16'}`}>
        {hasHero && <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />}

        <div className={`${hasHero ? 'mt-8' : ''} grid overflow-hidden border border-grey-200 bg-white shadow-[0_22px_60px_rgba(6,27,54,0.12)] lg:grid-cols-[0.7fr_1.3fr]`}>
          <aside className="bg-[#f2f6fb] px-6 py-8 sm:px-9 lg:px-10 lg:py-12">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-navy-950">Talk to the project team</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-grey-600">
              Product selection, samples, finishes, firmware options and OEM branding—all handled by one team.
            </p>

            <div className="mt-8 divide-y divide-grey-200 border-y border-grey-200">
              {settings.companyEmail && (
                <a href={`mailto:${settings.companyEmail}`} className="group flex items-center gap-4 py-5">
                  <span className="flex h-10 w-10 items-center justify-center bg-navy-950 text-white"><Mail className="h-[18px] w-[18px]" /></span>
                  <span><span className="block text-xs text-grey-500">Email</span><span className="mt-0.5 block font-medium text-navy-950 group-hover:text-water-600">{settings.companyEmail}</span></span>
                </a>
              )}
              {settings.companyPhone && (
                <a href={`tel:${settings.companyPhone}`} className="group flex items-center gap-4 py-5">
                  <span className="flex h-10 w-10 items-center justify-center bg-navy-950 text-white"><Phone className="h-[18px] w-[18px]" /></span>
                  <span><span className="block text-xs text-grey-500">Phone</span><span className="mt-0.5 block font-medium text-navy-950 group-hover:text-water-600">{settings.companyPhone}</span></span>
                </a>
              )}
              {settings.whatsappNumber && (
                <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`} className="group flex items-center gap-4 py-5">
                  <span className="flex h-10 w-10 items-center justify-center bg-navy-950 text-white"><MessageCircle className="h-[18px] w-[18px]" /></span>
                  <span><span className="block text-xs text-grey-500">WhatsApp</span><span className="mt-0.5 block font-medium text-navy-950 group-hover:text-water-600">{settings.whatsappNumber}</span></span>
                </a>
              )}
            </div>

            <div className="mt-8 text-sm leading-6 text-grey-600">
              <p className="font-semibold text-navy-950">Helpful details to include</p>
              <p className="mt-2">Water source, required capacity, filtration stages, target market, certifications, quantity and logo requirements.</p>
            </div>
          </aside>

          <div id="inquiry-form" className="scroll-mt-24 px-6 py-8 sm:px-9 lg:px-12 lg:py-12">
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-grey-200 pb-6 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-navy-950">Request a project quote</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-grey-500">Share the essentials. We&apos;ll follow up with suitable models, MOQ and next steps.</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-water-700">No obligation</span>
            </div>
            <InquiryForm sourcePage="/contact" turnstileEnabled={settings.turnstileEnabled} turnstileSiteKey={settings.turnstileSiteKey} appearance="contact" />
          </div>
        </div>

        {settings.companyAddress && (
          <div className="mt-10 border-t border-grey-200 pt-6 text-sm">
            <div className="font-semibold text-navy-950">Address</div>
            <div className="mt-1 text-grey-500">{settings.companyAddress}</div>
            <div
              className={`relative mt-3 w-full overflow-hidden rounded-lg bg-grey-100 ${
                settings.companyMapMobileImage
                  ? 'aspect-[5/6] sm:aspect-auto sm:h-[450px]'
                  : 'h-[350px] sm:h-[450px]'
              }`}
            >
              {(settings.companyMapMobileImage || settings.companyMapImage) && (
                <Image
                  src={settings.companyMapMobileImage || settings.companyMapImage!}
                  alt="Factory address map"
                  fill
                  sizes="100vw"
                  className="object-contain sm:hidden"
                />
              )}
              {settings.companyMapImage && (
                <Image
                  src={settings.companyMapImage}
                  alt="Factory address map"
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="hidden object-cover sm:block"
                />
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.companyAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium text-navy-950 shadow hover:bg-grey-50"
              >
                Open in Maps ↗
              </a>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
