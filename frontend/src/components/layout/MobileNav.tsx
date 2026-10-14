'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { t } from '@/lib/i18n/site-strings';
import type { Locale } from '@/lib/i18n/locales';
import { localeHref } from '@/lib/i18n/paths';
import type { NavigationItem } from '@/types/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';

export function MobileNav({ items, locale = 'en' }: { items: NavigationItem[]; locale?: Locale }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? t(locale, 'closeMenuLabel') : t(locale, 'openMenuLabel')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-md text-navy-950 hover:bg-grey-100"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-[88px] z-40 border-t border-grey-200 bg-white shadow-lg animate-fade-in">
          <nav className="flex flex-col px-4 py-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                target={item.openInNewTab ? '_blank' : undefined}
                onClick={() => setOpen(false)}
                className="border-b border-grey-100 py-3 text-sm font-medium text-navy-900 last:border-none"
              >
                {item.label}
              </Link>
            ))}
            <div className="border-b border-grey-100 py-3">
              <LanguageSwitcher locale={locale} variant="light" />
            </div>
            <Button href={localeHref('/contact', locale)} onClick={() => setOpen(false)} className="mt-3">
              {t(locale, 'headerCta')}
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}
