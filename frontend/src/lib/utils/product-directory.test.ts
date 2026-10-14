import assert from 'node:assert/strict';
import test from 'node:test';
import type { Product, ProductCategory } from '@/types/product';
import { groupProductsForDirectory } from './product-directory';

const category = (id: number, name: string): ProductCategory =>
  ({ id, name, slug: name.toLowerCase(), sortOrder: id } as ProductCategory);

const product = (id: number, categoryId: number, name: string): Product =>
  ({ id, categoryId, name, slug: name.toLowerCase(), sortOrder: id } as Product);

test('groups every product in category order and keeps products with missing categories', () => {
  const categories = [category(2, 'Second'), category(1, 'First')];
  const products = [product(1, 1, 'One'), product(2, 2, 'Two'), product(3, 99, 'Orphan')];

  const groups = groupProductsForDirectory(products, categories);

  assert.deepEqual(
    groups.map((group) => ({ category: group.category?.name ?? null, products: group.products.map((item) => item.name) })),
    [
      { category: 'Second', products: ['Two'] },
      { category: 'First', products: ['One'] },
      { category: null, products: ['Orphan'] },
    ],
  );
  assert.equal(groups.flatMap((group) => group.products).length, products.length);
});
