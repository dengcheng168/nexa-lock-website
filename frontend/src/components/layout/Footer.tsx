import type { SVGProps } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getPublicSettings } from '@/lib/api/settings';
import { getNavigation } from '@/lib/api/navigation';
import { listVisibleProductCategories } from '@/lib/api/products';
import { getTranslationMap } from '@/lib/api/translations';
import { localizeNavigation } from '@/lib/i18n/content-overlay';
import { t } from '@/lib/i18n/site-strings';
import type { Locale } from '@/lib/i18n/locales';
import { localeHref } from '@/lib/i18n/paths';
import { Container } from '@/components/ui/Container';
import { getWhatsappHref } from '@/lib/utils/whatsapp';
import { SOCIAL_ICONS } from './SocialIcons';
import { BackToTopButton } from './BackToTopButton';
import { MobileWhatsAppButton } from './MobileWhatsAppButton';
import { MobileEmailButton } from './MobileEmailButton';
import { toThumbnailUrl } from '@/lib/media/thumbnail';

type IconProps = SVGProps<SVGSVGElement>;

function PhoneIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function MailIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function MapPinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export async function Footer({ locale = 'en' }: { locale?: Locale } = {}) {
  const [settings, rawNavItems, categories, translations] = await Promise.all([
    getPublicSettings(),
    getNavigation(),
    listVisibleProductCategories(locale),
    locale === 'en' ? Promise.resolve({}) : getTranslationMap(locale),
  ]);
  const localizedNavItems = locale === 'en' ? rawNavItems : localizeNavigation(rawNavItems, translations);
  const navItems = localizedNavItems.map((item) => ({ ...item, url: localeHref(item.url, locale) }));
  const year = new Date().getFullYear();
  const activeSocialLinks = settings.socialLinks.filter((link) => link.enabled && link.url);
  const whatsappHref = getWhatsappHref(settings);
  const brandLabel = settings.brandName || settings.companyName || 'NEXA LOCK';
  const copyrightText = settings.footerText && !/placeholder/i.test(settings.footerText)
    ? settings.footerText
    : `© ${year} ${brandLabel}. ${t(locale, 'footerRightsReserved')}`;

  return (
    <footer className="mt-auto border-t-4 border-[#69c4ef] bg-[linear-gradient(118deg,#124e75_0%,#176b98_56%,#1f7eaa_100%)] text-white">
      <Container className="grid gap-10 py-11 sm:grid-cols-2 lg:grid-cols-[1.15fr_0.85fr_1.15fr_1fr] lg:gap-12">
        <div className="max-w-sm">
          {settings.companyLogoUrl ? (
            <span className="relative block h-9 w-40">
              <Image
                src={toThumbnailUrl(settings.companyLogoUrl)}
                alt={settings.brandName || settings.companyName || 'NEXA LOCK'}
                fill
                sizes="160px"
                className="object-contain object-left"
              />
            </span>
          ) : (
            <div className="text-xl font-semibold tracking-[-0.02em] text-white">{settings.brandName || settings.companyName || 'NEXA LOCK'}</div>
          )}
          {settings.footerCompanyIntro && (
            <p className="mt-3 text-sm leading-relaxed text-white/78">{settings.footerCompanyIntro}</p>
          )}
          {!settings.footerCompanyIntro && (
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/75">Smart lock solutions for residential, hospitality and specialty-door projects.</p>
          )}

          {activeSocialLinks.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {activeSocialLinks.map((link) => {
                const Icon = SOCIAL_ICONS[link.platform];
                return (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-[#145678]"
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : <span className="text-xs">{link.label[0]}</span>}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-white">{t(locale, 'footerQuickNav')}</div>
          <ul className="mt-4 space-y-2.5">
            {navItems.slice(0, 6).map((item) => (
              <li key={item.id}>
                <Link href={item.url} target={item.openInNewTab ? '_blank' : undefined} className="flex items-center gap-2 text-sm text-white/78 hover:text-white">
                  <span aria-hidden="true" className="text-[#89d7fa]">›</span>{item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-white">{t(locale, 'footerCategories')}</div>
          <ul className="mt-4 space-y-2.5">
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={localeHref(`/products/category/${category.slug}`, locale)} className="flex items-start gap-2 text-sm leading-5 text-white/78 hover:text-white">
                  <span aria-hidden="true" className="mt-px text-[#89d7fa]">›</span>{category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-white">{t(locale, 'footerContactUs')}</div>
          <ul className="mt-4 space-y-4">
            {settings.companyPhone && (
              <li className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/15 bg-white/10 text-[#a5e3ff]"><PhoneIcon className="h-4 w-4" /></span>
                <div>
                  <div className="text-xs text-white/60">{t(locale, 'footerPhone')}</div>
                  <a href={`tel:${settings.companyPhone}`} className="text-sm font-semibold text-white hover:text-[#bce9ff]">
                    {settings.companyPhone}
                  </a>
                </div>
              </li>
            )}
            {settings.companyEmail && (
              <li className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/15 bg-white/10 text-[#a5e3ff]"><MailIcon className="h-4 w-4" /></span>
                <div>
                  <div className="text-xs text-white/60">{t(locale, 'footerEmail')}</div>
                  <a href={`mailto:${settings.companyEmail}`} className="text-sm font-semibold text-white hover:text-[#bce9ff]">
                    {settings.companyEmail}
                  </a>
                </div>
              </li>
            )}
            {settings.companyAddress && !/placeholder/i.test(settings.companyAddress) && (
              <li className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/15 bg-white/10 text-[#a5e3ff]"><MapPinIcon className="h-4 w-4" /></span>
                <div>
                  <div className="text-xs text-white/60">{t(locale, 'footerAddress')}</div>
                  <div className="text-sm font-semibold text-white">{settings.companyAddress}</div>
                </div>
              </li>
            )}
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/15 bg-[#0e466c]/28 py-4">
        <Container className="flex flex-col items-center justify-between gap-3 text-xs text-white/62 sm:flex-row">
          <p>{copyrightText}</p>
          <div className="flex items-center gap-4">
            <Link href={localeHref('/privacy-policy', locale)} className="hover:text-white">
              {t(locale, 'footerPrivacyPolicy')}
            </Link>
            <Link href={localeHref('/terms-of-use', locale)} className="hover:text-white">
              {t(locale, 'footerTermsOfUse')}
            </Link>
            <Link href={localeHref('/contact', locale)} className="hover:text-white">
              {t(locale, 'footerContactUs')}
            </Link>
          </div>
        </Container>
      </div>

      <BackToTopButton />
      <MobileWhatsAppButton href={whatsappHref} />
      <MobileEmailButton email={settings.companyEmail} />
    </footer>
  );
}
