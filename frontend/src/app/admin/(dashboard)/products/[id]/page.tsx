import { notFound } from 'next/navigation';
import { adminFetch } from '@/lib/api/admin-client';
import { ProductForm } from '../ProductForm';
import { updateProductAction, updateProductTranslationAction } from '@/lib/actions/admin/products';
import { fetchTranslation } from '@/lib/actions/admin/translations-shared';

interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  sku: string | null;
  categoryId: number;
  shortDescription: string | null;
  description: string;
  mainImage: string;
  videoUrl: string | null;
  galleryImages: { url: string; alt?: string; mobileUrl?: string }[];
  specs: { label: string; value: string }[];
  features: (string | { title: string; description?: string })[];
  applications: { title: string; description?: string }[];
  packagingInfo: string | null;
  moq: string | null;
  oemOdmSupport: boolean;
  specSheetUrl: string | null;
  status: string;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: categories }, productResult] = await Promise.all([
    adminFetch<{ id: number; name: string }[]>('/product-categories?pageSize=100'),
    adminFetch<ProductDetail>(`/products/${id}`).catch(() => null),
  ]);

  if (!productResult) notFound();
  const product = productResult.data;

  const boundAction = updateProductAction.bind(null, Number(id));
  const boundTranslationAction = updateProductTranslationAction.bind(null, Number(id), 'es', product.slug);
  const translation = await fetchTranslation<{
    name: string | null;
    shortDescription: string | null;
    description: string | null;
    specs: { label: string; value: string }[] | null;
    features: (string | { title: string; description?: string })[] | null;
    applications: { title: string; description?: string }[] | null;
    packagingInfo: string | null;
    moq: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string | null;
  }>(`/products/${id}/translations/es`).catch(() => null);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy-950">编辑产品</h1>
      <div className="mt-6">
        <ProductForm
          action={boundAction}
          categories={categories}
          initialValues={product}
          translationAction={boundTranslationAction}
          translation={translation}
        />
      </div>
    </div>
  );
}
