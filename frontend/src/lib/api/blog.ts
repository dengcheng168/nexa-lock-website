import { apiFetch, ApiError, type ApiMeta } from './client';
import { resolveMediaUrl } from '@/lib/utils/media';
import type { BlogPost, BlogCategory, BlogTag } from '@/types/blog';
import type { Locale } from '@/lib/i18n/locales';
import { resolveLocalizedEntity, localeQueryParam, localizedTag } from '@/lib/i18n/localize';

export interface BlogListParams {
  category?: string;
  tag?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

type WithTranslation<T> = T & { translation?: Partial<T> | null };

const POST_TRANSLATABLE_FIELDS: (keyof BlogPost)[] = ['title', 'excerpt', 'body', 'seoTitle', 'seoDescription'];
const CATEGORY_TRANSLATABLE_FIELDS: (keyof BlogCategory)[] = ['name', 'description'];

export function localizePost(post: WithTranslation<BlogPost>): BlogPost {
  const { translation, ...base } = post;
  return {
    ...resolveLocalizedEntity(base as BlogPost, translation, POST_TRANSLATABLE_FIELDS),
    localizedUpdatedAt: translation?.updatedAt ?? base.updatedAt,
  };
}

function localizeCategory(category: WithTranslation<BlogCategory>): BlogCategory {
  const { translation, ...base } = category;
  return resolveLocalizedEntity(base as BlogCategory, translation, CATEGORY_TRANSLATABLE_FIELDS);
}

export function resolveBlogMedia(post: BlogPost): BlogPost {
  return { ...post, coverImage: post.coverImage ? resolveMediaUrl(post.coverImage) : post.coverImage };
}

export async function listBlogPosts(
  params: BlogListParams = {},
  locale: Locale = 'en',
): Promise<{ items: BlogPost[]; meta?: ApiMeta }> {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  if (params.tag) search.set('tag', params.tag);
  if (params.q) search.set('q', params.q);
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  const localeParam = localeQueryParam(locale);
  if (localeParam) search.set('locale', localeParam);

  const qs = search.toString();
  try {
    const { data, meta } = await apiFetch<WithTranslation<BlogPost>[]>(`/blog${qs ? `?${qs}` : ''}`, {
      revalidate: 60,
      tags: ['blog', ...localizedTag('blog', locale)],
    });
    return {
      items: data.map((p) => resolveBlogMedia({
        ...localizePost(p),
        hasLocaleTranslation: locale === 'en' || Boolean(p.translation),
      })),
      meta,
    };
  } catch {
    // 构建期后端不可达时的兜底：见 lib/api/settings.ts 顶部注释
    return { items: [] };
  }
}

export async function getBlogPostBySlug(
  slug: string,
  locale: Locale = 'en',
): Promise<{ post: BlogPost; related: BlogPost[] } | null> {
  const localeParam = localeQueryParam(locale);
  try {
    const { data } = await apiFetch<{ post: WithTranslation<BlogPost>; related: WithTranslation<BlogPost>[] }>(
      `/blog/${slug}${localeParam ? `?locale=${localeParam}` : ''}`,
      {
        revalidate: 60,
        tags: ['blog', `blog:${slug}`, ...localizedTag(`blog:${slug}`, locale)],
      },
    );
    return {
      post: resolveBlogMedia(localizePost(data.post)),
      related: data.related.map((r) => resolveBlogMedia(localizePost(r))),
    };
  } catch (error) {
    // Only a confirmed missing post is a 404. Rate limiting or an upstream
    // outage must propagate so Next.js never emits a false noindex page.
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function listBlogCategories(locale: Locale = 'en'): Promise<BlogCategory[]> {
  const localeParam = localeQueryParam(locale);
  try {
    const { data } = await apiFetch<WithTranslation<BlogCategory>[]>(
      `/blog-categories${localeParam ? `?locale=${localeParam}` : ''}`,
      { revalidate: 300, tags: ['blog-categories', ...localizedTag('blog-categories', locale)] },
    );
    return data.map(localizeCategory);
  } catch {
    return [];
  }
}

export async function listBlogTags(): Promise<BlogTag[]> {
  try {
    const { data } = await apiFetch<BlogTag[]>('/blog-tags', { revalidate: 300, tags: ['blog-tags'] });
    return data;
  } catch {
    return [];
  }
}
