import { z } from 'zod';
import { SUPPORTED_LOCALES } from '../translations/translations.schema.js';

const specItemSchema = z.object({ label: z.string(), value: z.string() });
const imageItemSchema = z.object({ url: z.string(), alt: z.string().optional(), mobileUrl: z.string().optional() });
const applicationItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, '产品名称不能为空'),
  slug: z.string().min(1).optional(),
  sku: z.string().optional(),
  categoryId: z.number().int(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  mainImage: z.string().min(1, '请上传主图'),
  videoUrl: z.string().optional(),
  galleryImages: z.array(imageItemSchema).default([]),
  specs: z.array(specItemSchema).default([]),
  features: z.array(z.union([z.string(), z.object({ title: z.string(), description: z.string().optional() })])).default([]),
  applications: z.array(applicationItemSchema).default([]),
  packagingInfo: z.string().optional(),
  moq: z.string().optional(),
  oemOdmSupport: z.boolean().optional(),
  specSheetUrl: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  ogImage: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const reorderSchema = z.object({
  items: z.array(z.object({ id: z.number().int(), sortOrder: z.number().int() })),
});

export const bulkStatusSchema = z.object({
  ids: z.array(z.number().int()).min(1),
  status: z.enum(['DRAFT', 'PUBLISHED']),
});

export const productListQuerySchema = z.object({
  category: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  q: z.string().optional(),
  locale: z.enum(SUPPORTED_LOCALES).optional(),
});

export const productDetailQuerySchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES).optional(),
});

/** 西语翻译覆盖——只允许改文字字段，不允许改 SKU/图片/关联/数值，这些继续共用英文主记录 */
export const upsertProductTranslationSchema = z.object({
  name: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  specs: z.array(specItemSchema).optional(),
  features: z.array(z.union([z.string(), z.object({ title: z.string(), description: z.string().optional() })])).optional(),
  applications: z.array(applicationItemSchema).optional(),
  packagingInfo: z.string().optional(),
  moq: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  translationStatus: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpsertProductTranslationInput = z.infer<typeof upsertProductTranslationSchema>;
