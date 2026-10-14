import { getPublicSettings } from '@/lib/api/settings';
import { listProductCategories } from '@/lib/api/products';
import { buildLlmsTxt } from '@/lib/seo/llms';
import { createMachineReadableResponse } from '@/lib/seo/machine-response';
import { getSiteUrl } from '@/lib/seo/site';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const [settings, siteUrl, categories] = await Promise.all([
    getPublicSettings(),
    getSiteUrl(),
    listProductCategories('en'),
  ]);
  return createMachineReadableResponse(request, buildLlmsTxt({ settings, siteUrl, categories }), {
    contentLanguage: 'en',
    contentType: 'text/plain; charset=utf-8',
  });
}
