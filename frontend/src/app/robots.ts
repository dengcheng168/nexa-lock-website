import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo/site';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl();
  const privatePaths = ['/admin', '/auth', '/api', '/search', '/es/search'];
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privatePaths,
      },
      {
        // Explicitly state the policy for search/citation and user-triggered AI
        // agents. GPTBot is deliberately not coupled to these search controls.
        userAgent: [
          'OAI-SearchBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'anthropic-ai',
          'Google-Extended',
          'bingbot',
        ],
        allow: '/',
        disallow: privatePaths,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
