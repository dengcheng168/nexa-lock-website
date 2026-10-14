import { listAllProducts, listProductCategories } from '@/lib/api/products';
import { getPublicSettings } from '@/lib/api/settings';
import { buildAgentCatalog } from '@/lib/seo/llms';
import { createMachineReadableResponse } from '@/lib/seo/machine-response';
import { getSiteUrl } from '@/lib/seo/site';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const [settings, siteUrl, enProducts, esProducts, enCategories, esCategories] = await Promise.all([
    getPublicSettings(),
    getSiteUrl(),
    listAllProducts('en'),
    listAllProducts('es'),
    listProductCategories('en'),
    listProductCategories('es'),
  ]);

  const catalog = buildAgentCatalog({
    settings,
    siteUrl,
    en: { categories: enCategories, products: enProducts, posts: [], faqs: [] },
    es: { categories: esCategories, products: esProducts, posts: [], faqs: [] },
  });

  return createMachineReadableResponse(request, JSON.stringify(catalog), {
    contentLanguage: 'en, es',
    contentType: 'application/json; charset=utf-8',
  });
}
