'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { updateTag } from 'next/cache';
import { adminFetch } from '@/lib/api/admin-client';
import { ApiError } from '@/lib/api/client';
import type { AdminFormState } from './categories';
import { saveTranslation, localeCacheTags, translationStatusFromForm } from './translations-shared';
import type { TranslationFormState } from './translations-shared';
import type { Locale } from '@/lib/i18n/locales';
import { textOrUndefined } from './form-utils';

/** 每行 "标签: 值" 格式，解析成 [{label, value}] */
function parseSpecs(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      return idx === -1 ? { label: line, value: '' } : { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
    });
}

/** 每行一个特点 */
function parseFeatures(text: string) {
  return text.split('\n').map((l) => l.trim()).filter(Boolean);
}

/** 每行 "标题: 描述" 格式，解析成 [{title, description}] */
function parseApplications(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      return idx === -1 ? { title: line } : { title: line.slice(0, idx).trim(), description: line.slice(idx + 1).trim() };
    });
}

function parseGalleryImages(value: string) {
  try {
    return JSON.parse(value || '[]');
  } catch {
    return [];
  }
}

function buildPayload(formData: FormData) {
  return {
    name: formData.get('name'),
    sku: textOrUndefined(formData, 'sku'),
    categoryId: Number(formData.get('categoryId')),
    shortDescription: textOrUndefined(formData, 'shortDescription'),
    description: formData.get('description'),
    mainImage: formData.get('mainImage'),
    videoUrl: textOrUndefined(formData, 'videoUrl'),
    galleryImages: parseGalleryImages(String(formData.get('galleryImages') ?? '[]')),
    specs: parseSpecs(String(formData.get('specsText') ?? '')),
    features: parseFeatures(String(formData.get('featuresText') ?? '')),
    applications: parseApplications(String(formData.get('applicationsText') ?? '')),
    packagingInfo: textOrUndefined(formData, 'packagingInfo'),
    moq: textOrUndefined(formData, 'moq'),
    oemOdmSupport: formData.get('oemOdmSupport') === 'on',
    specSheetUrl: textOrUndefined(formData, 'specSheetUrl'),
    status: formData.get('status'),
    featured: formData.get('featured') === 'on',
    seoTitle: textOrUndefined(formData, 'seoTitle'),
    seoDescription: textOrUndefined(formData, 'seoDescription'),
    seoKeywords: textOrUndefined(formData, 'seoKeywords'),
  };
}

/** 保存成功后统一刷新：后台列表页路由缓存 + 前台公开站点的 fetch 缓存标签（见 lib/api/products.ts 的 tags） */
function revalidateProductCaches(slug?: string) {
  revalidatePath('/admin/products');
  updateTag('products');
  if (slug) updateTag(`product:${slug}`);
}

export async function createProductAction(_prevState: AdminFormState, formData: FormData): Promise<AdminFormState> {
  try {
    const { data } = await adminFetch<{ slug: string }>('/products', { method: 'POST', body: JSON.stringify(buildPayload(formData)) });
    revalidateProductCaches(data.slug);
  } catch (err) {
    return { message: err instanceof ApiError ? err.message : '创建失败' };
  }
  redirect('/admin/products');
}

export async function updateProductAction(id: number, _prevState: AdminFormState, formData: FormData): Promise<AdminFormState> {
  try {
    const { data } = await adminFetch<{ slug: string }>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(buildPayload(formData)) });
    revalidateProductCaches(data.slug);
  } catch (err) {
    return { message: err instanceof ApiError ? err.message : '保存失败' };
  }
  return { success: true, message: '已保存' };
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const id = formData.get('id');
  await adminFetch(`/products/${id}`, { method: 'DELETE' });
  revalidatePath('/admin/products');
  updateTag('products');
}

/**
 * 供产品列表"发布/下架"按钮直接调用（不经过 <form action>），
 * 复用后端已有的 PATCH /admin/products/:id/status，不新增接口。
 */
export async function setProductStatusAction(id: number, status: 'DRAFT' | 'PUBLISHED'): Promise<AdminFormState> {
  try {
    const { data } = await adminFetch<{ slug: string }>(`/products/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    revalidateProductCaches(data.slug);
  } catch (err) {
    return { success: false, message: err instanceof ApiError ? err.message : '操作失败' };
  }
  return { success: true, message: status === 'PUBLISHED' ? '已发布' : '已下架' };
}

/**
 * 供产品列表"排序"列的输入框直接调用，复用后端已有的批量重排接口
 * POST /admin/products/reorder（只传一条记录，等价于单条更新 sortOrder）。
 */
export async function setProductSortOrderAction(id: number, sortOrder: number): Promise<AdminFormState> {
  try {
    await adminFetch('/products/reorder', { method: 'POST', body: JSON.stringify({ items: [{ id, sortOrder }] }) });
  } catch (err) {
    return { success: false, message: err instanceof ApiError ? err.message : '排序更新失败' };
  }
  revalidateProductCaches();
  return { success: true, message: '排序已更新' };
}

function buildTranslationPayload(formData: FormData) {
  return {
    name: textOrUndefined(formData, 'name'),
    shortDescription: textOrUndefined(formData, 'shortDescription'),
    description: textOrUndefined(formData, 'description'),
    specs: formData.get('specsText') ? parseSpecs(String(formData.get('specsText'))) : undefined,
    features: formData.get('featuresText') ? parseFeatures(String(formData.get('featuresText'))) : undefined,
    applications: formData.get('applicationsText') ? parseApplications(String(formData.get('applicationsText'))) : undefined,
    packagingInfo: textOrUndefined(formData, 'packagingInfo'),
    moq: textOrUndefined(formData, 'moq'),
    seoTitle: textOrUndefined(formData, 'seoTitle'),
    seoDescription: textOrUndefined(formData, 'seoDescription'),
    seoKeywords: textOrUndefined(formData, 'seoKeywords'),
    translationStatus: translationStatusFromForm(formData),
  };
}

export async function updateProductTranslationAction(
  id: number,
  locale: Locale,
  slug: string | undefined,
  _prevState: TranslationFormState,
  formData: FormData,
): Promise<TranslationFormState> {
  const tags = [...localeCacheTags('products', locale), ...(slug ? localeCacheTags(`product:${slug}`, locale) : [])];
  return saveTranslation(`/products/${id}/translations/${locale}`, buildTranslationPayload(formData), tags);
}
