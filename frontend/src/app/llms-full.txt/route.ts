import { listBlogPosts } from '@/lib/api/blog';
import { listFaqs } from '@/lib/api/content';
import { listAllProducts, listProductCategories } from '@/lib/api/products';
import { getPublicSettings } from '@/lib/api/settings';
import { buildLlmsFullTxt } from '@/lib/seo/llms';
import { createMachineReadableResponse } from '@/lib/seo/machine-response';
import { getSiteUrl } from '@/lib/seo/site';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const [settings, siteUrl, enProducts, esProducts, enCategories, esCategories, enPosts, esPosts, enFaqs, esFaqs] = await Promise.all([
    getPublicSettings(),
    getSiteUrl(),
    listAllProducts('en'),
    listAllProducts('es'),
    listProductCategories('en'),
    listProductCategories('es'),
    listBlogPosts({ pageSize: 100 }, 'en'),
    listBlogPosts({ pageSize: 100 }, 'es'),
    listFaqs('en'),
    listFaqs('es'),
  ]);

  return createMachineReadableResponse(request, buildLlmsFullTxt({
    settings,
    siteUrl,
    en: { categories: enCategories, products: enProducts, posts: enPosts.items, faqs: enFaqs },
    es: { categories: esCategories, products: esProducts, posts: esPosts.items, faqs: esFaqs },
  }), {
    contentLanguage: 'en, es',
    contentType: 'text/plain; charset=utf-8',
  });
}
