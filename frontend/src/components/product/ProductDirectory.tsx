import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locales';
import { localeHref } from '@/lib/i18n/paths';
import { groupProductsForDirectory } from '@/lib/utils/product-directory';
import type { Product, ProductCategory } from '@/types/product';

export function ProductDirectory({
  products,
  categories,
  locale = 'en',
}: {
  products: Product[];
  categories: ProductCategory[];
  locale?: Locale;
}) {
  if (!products.length) return null;

  const groups = groupProductsForDirectory(products, categories);
  const isSpanish = locale === 'es';

  return (
    <section className="mt-14 border-t border-grey-200 pt-10" aria-labelledby="product-directory-title">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-water-600">
          {isSpanish ? 'Directorio de productos' : 'Product directory'}
        </p>
        <h2 id="product-directory-title" className="mt-2 text-2xl font-semibold text-navy-950">
          {isSpanish ? 'Explore todos los modelos por categoría' : 'Explore every model by category'}
        </h2>
        <p className="mt-3 text-sm leading-6 text-grey-600">
          {isSpanish
            ? 'Utilice este índice para comparar rápidamente nuestra gama completa de purificadores de agua y equipos OEM/ODM.'
            : 'Use this index to quickly compare our complete range of water purifiers and OEM/ODM equipment.'}
        </p>
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {groups.map(({ category, products: categoryProducts }) => (
          <div key={category?.id ?? 'other'} className="rounded-lg border border-grey-200 bg-grey-50 p-5">
            {category ? (
              <h3 className="text-base font-semibold text-navy-950">
                <Link
                  href={localeHref(`/products/category/${category.slug}`, locale)}
                  className="hover:text-water-600 hover:underline"
                >
                  {category.name}
                </Link>
              </h3>
            ) : (
              <h3 className="text-base font-semibold text-navy-950">
                {isSpanish ? 'Otros productos' : 'Other products'}
              </h3>
            )}
            <ul className="mt-3 space-y-2">
              {categoryProducts.map((product) => (
                <li key={product.id}>
                  <Link
                    href={localeHref(`/products/${product.slug}`, locale)}
                    className="text-sm leading-5 text-grey-700 hover:text-water-600 hover:underline"
                  >
                    {product.name}
                    {product.sku && !product.name.toLowerCase().includes(product.sku.toLowerCase())
                      ? ` (${product.sku})`
                      : ''}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
