import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types/product';
import type { Locale } from '@/lib/i18n/locales';
import { localeHref } from '@/lib/i18n/paths';
import { toThumbnailUrl } from '@/lib/media/thumbnail';

export function ProductCard({ product, locale = 'en' }: { product: Product; locale?: Locale }) {
  return (
    <Link
      href={localeHref(`/products/${product.slug}`, locale)}
      className="group flex flex-col overflow-hidden rounded-xl border border-grey-200 bg-white transition-[border-color,transform] hover:-translate-y-1 hover:border-water-500"
    >
      <div className="relative aspect-square w-full min-w-0 overflow-hidden bg-grey-50">
        <Image
          src={toThumbnailUrl(product.mainImage)}
          alt={product.galleryImages[0]?.alt?.trim() || product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col border-t border-grey-100 p-5">
        {product.category && (
          <span className="block truncate text-xs font-medium text-water-600">
            {product.category.name}
          </span>
        )}
        <h3 className="mt-1 line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-snug text-navy-950">{product.name}</h3>
        {product.shortDescription && (
          <p className="mt-2 line-clamp-2 text-sm text-grey-500">{product.shortDescription}</p>
        )}
      </div>
    </Link>
  );
}
