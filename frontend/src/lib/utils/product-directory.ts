import type { Product, ProductCategory } from '@/types/product';

export interface ProductDirectoryGroup {
  category: ProductCategory | null;
  products: Product[];
}

/**
 * Build a stable, category-first directory without dropping products whose
 * category data is temporarily unavailable.
 */
export function groupProductsForDirectory(
  products: Product[],
  categories: ProductCategory[],
): ProductDirectoryGroup[] {
  const productsByCategory = new Map<number, Product[]>();

  for (const product of products) {
    const group = productsByCategory.get(product.categoryId) ?? [];
    group.push(product);
    productsByCategory.set(product.categoryId, group);
  }

  const groups: ProductDirectoryGroup[] = categories.flatMap((category) => {
    const categoryProducts = productsByCategory.get(category.id);
    if (!categoryProducts?.length) return [];
    productsByCategory.delete(category.id);
    return [{ category, products: categoryProducts }];
  });

  const uncategorized = [...productsByCategory.values()].flat();
  if (uncategorized.length) groups.push({ category: null, products: uncategorized });

  return groups;
}
