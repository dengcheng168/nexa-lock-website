export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverImage: string | null;
  categoryId: number;
  category?: BlogCategory;
  authorName: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  tags: BlogTag[];
  updatedAt: string;
  /** Translation timestamp for the requested locale; falls back to updatedAt. */
  localizedUpdatedAt?: string;
  /** False only when a requested non-English locale has no published translation. */
  hasLocaleTranslation?: boolean;
}
