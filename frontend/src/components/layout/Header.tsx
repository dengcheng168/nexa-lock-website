import Link from 'next/link';
import Image from 'next/image';
import { getNavigation } from '@/lib/api/navigation';
import { getPublicSettings } from '@/lib/api/settings';
import { getTranslationMap } from '@/lib/api/translations';
import { localizeNavigation } from '@/lib/i18n/content-overlay';
import { t } from '@/lib/i18n/site-strings';
import type { Locale } from '@/lib/i18n/locales';
import { localeHref } from '@/lib/i18n/paths';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { MobileNav } from './MobileNav';
import { LanguageSwitcher } from './LanguageSwitcher';
import { toThumbnailUrl } from '@/lib/media/thumbnail';
import { ArrowUpRight, Fingerprint } from 'lucide-react';

export async function Header({ locale = 'en' }: { locale?: Locale } = {}) {
  const [items, settings, translations] = await Promise.all([
    getNavigation(),
    getPublicSettings(),
    locale === 'en' ? Promise.resolve({}) : getTranslationMap(locale),
  ]);
  const localizedItems = locale === 'en' ? items : localizeNavigation(items, translations);
  // 导航项的 url 是后台存的英文站内路径（如 "/products"），西语状态下统一加 /es 前缀，
  // 确保从 /es 页面点导航依然停留在西语站，而不是悄悄跳回英文页面。
  const navItems = localizedItems.map((item) => ({ ...item, url: localeHref(item.url, locale) }));
  const homeHref = localeHref('/', locale);

  return (
    <header className="sticky top-0 z-50 border-b border-navy-950/10 bg-white/95 shadow-[0_8px_30px_rgba(8,34,65,0.06)] backdrop-blur-xl">
      <Container className="relative flex h-[88px] items-center justify-between">
        <Link href={homeHref} className="group flex items-center gap-3.5 text-navy-950">
          {settings.companyLogoUrl ? (
            <span className="relative block h-9 w-40">
              <Image
                src={toThumbnailUrl(settings.companyLogoUrl)}
                alt={settings.brandName || settings.companyName || 'NEXA LOCK'}
                fill
                sizes="160px"
                className="object-contain object-left"
                priority
              />
            </span>
          ) : (
            <>
              <span className="flex h-11 w-11 items-center justify-center bg-navy-950 text-white shadow-[0_8px_20px_rgba(8,34,65,0.18)] transition-colors group-hover:bg-water-600">
                <Fingerprint className="h-6 w-6" strokeWidth={1.7} />
              </span>
              <span className="flex flex-col">
                <span className="text-lg font-bold leading-none tracking-[-0.025em]">{settings.brandName || settings.companyName || 'NEXA LOCK'}</span>
                <span className="mt-1.5 text-[10px] font-semibold tracking-[0.16em] text-water-600">Smart access systems</span>
              </span>
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-navy-950/[0.06] bg-[#f3f7fb] p-1.5 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              target={item.openInNewTab ? '_blank' : undefined}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-grey-700 transition-colors hover:bg-white hover:text-navy-950 hover:shadow-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:ml-6 lg:flex">
          <LanguageSwitcher locale={locale} variant="light" />
          <Button href={localeHref('/contact', locale)} className="group !gap-2 !px-5 !py-3 shadow-[0_8px_20px_rgba(47,128,237,0.22)]">
            {t(locale, 'headerCta')}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Button>
        </div>

        <MobileNav items={navItems} locale={locale} />
      </Container>
    </header>
  );
}
