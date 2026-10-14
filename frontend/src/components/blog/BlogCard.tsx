import Image from 'next/image';
import Link from 'next/link';
import type { BlogPost } from '@/types/blog';
import type { Locale } from '@/lib/i18n/locales';
import { localeHref } from '@/lib/i18n/paths';

function formatDate(dateStr: string | null, locale: Locale) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function BlogCard({ post, locale = 'en' }: { post: BlogPost; locale?: Locale }) {
  const hrefLocale = locale === 'es' && post.hasLocaleTranslation === false ? 'en' : locale;
  const fallbackImages = [
    '/images/smart-lock/category-residential.png',
    '/images/smart-lock/category-hospitality.png',
    '/images/smart-lock/category-glass.png',
  ];
  const coverImage = post.coverImage || fallbackImages[Math.abs(post.id) % fallbackImages.length];
  return (
    <Link
      href={localeHref(`/blog/${post.slug}`, hrefLocale)}
      className="group flex flex-col overflow-hidden border border-grey-200 bg-white transition-colors hover:border-water-500"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-navy-950">
        <Image
          src={coverImage}
          alt={post.coverImage ? post.title : ''}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {!post.coverImage && <span className="absolute inset-0 bg-navy-950/10" />}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {post.category && (
          <span className="block truncate text-xs font-medium uppercase tracking-wide text-water-600">{post.category.name}</span>
        )}
        <h3 className="mt-1 line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-snug text-navy-950">{post.title}</h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 text-sm text-grey-500">{post.excerpt}</p>}
        <div className="mt-auto flex items-center justify-between pt-5 text-xs text-grey-500">
          <span>{formatDate(post.publishedAt, locale)}</span>
          <span className="text-base text-water-600" aria-hidden="true">↗</span>
        </div>
      </div>
    </Link>
  );
}
