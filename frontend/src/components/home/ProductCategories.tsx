import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { t } from '@/lib/i18n/site-strings';
import type { Locale } from '@/lib/i18n/locales';
import { localeHref } from '@/lib/i18n/paths';
import type { ProductCategory } from '@/types/product';
import { toThumbnailUrl } from '@/lib/media/thumbnail';
import { ArrowUpRight } from 'lucide-react';

const categoryFallbacks = [
  '/images/smart-lock/category-residential.png',
  '/images/smart-lock/category-hospitality.png',
  '/images/smart-lock/category-glass.png',
];

export function ProductCategories({ categories, locale = 'en' }: { categories: ProductCategory[]; locale?: Locale }) {
  if (categories.length === 0) return null;
  const displayedCategories = categories.slice(0, 3);

  return (
    <section className="overflow-hidden bg-white py-24">
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <SectionHeading eyebrow={t(locale, 'sectionProductCategoriesEyebrow')} title={t(locale, 'sectionProductCategoriesTitle')} align="center" />
          <p className="mt-5 max-w-xl text-sm leading-6 text-grey-500">Choose by door environment first. We will then confirm dimensions, lock body and access methods.</p>
        </div>
        <div className="mt-12 grid gap-8 pb-8 md:grid-cols-3 lg:gap-10">
          {displayedCategories.map((category, index) => (
            <Link
              key={category.id}
              href={localeHref(`/products/category/${category.slug}`, locale)}
              className={`group relative block ${index === 1 ? 'md:translate-y-10' : ''}`}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-grey-100">
                <Image
                  src={category.image ? toThumbnailUrl(category.image) : categoryFallbacks[index]}
                  alt={category.name}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-navy-950/35 to-transparent" />
                <span className="absolute left-5 top-5 border border-white/60 bg-white/85 px-3 py-1.5 text-xs font-semibold tracking-[0.14em] text-navy-950 backdrop-blur-sm">0{index + 1}</span>
              </div>
              <div className="relative z-10 -mt-12 ml-5 flex min-h-36 items-center justify-between gap-4 border border-navy-950/[0.07] bg-white p-6 shadow-[0_18px_45px_rgba(7,32,61,0.11)] sm:ml-7 sm:p-7">
                <div>
                  <h3 className="text-xl font-semibold leading-tight tracking-[-0.025em] text-navy-950">{category.name}</h3>
                  <p className="mt-3 text-sm text-grey-500">Find the right lock format</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-water-500/30 text-water-600 transition-colors group-hover:border-water-500 group-hover:bg-water-500 group-hover:text-white">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
