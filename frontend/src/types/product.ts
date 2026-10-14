export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  published: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
  /** Translation timestamp for the requested locale; falls back to updatedAt. */
  localizedUpdatedAt?: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductImage {
  url: string;
  alt?: string;
  /** 该图的手机端专用版本（可选）；留空时手机端回退显示 url */
  mobileUrl?: string;
}

export interface ProductApplication {
  title: string;
  description?: string;
  image?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string | null;
  categoryId: number;
  category?: ProductCategory;
  shortDescription: string | null;
  description: string;
  mainImage: string;
  videoUrl?: string | null;
  galleryImages: ProductImage[];
  specs: ProductSpec[];
  features: (string | { title: string; description?: string })[];
  applications: ProductApplication[];
  packagingInfo: string | null;
  moq: string | null;
  oemOdmSupport: boolean;
  specSheetUrl: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  featured: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogImage: string | null;
  updatedAt: string;
  /** Translation timestamp for the requested locale; falls back to updatedAt. */
  localizedUpdatedAt?: string;
}
