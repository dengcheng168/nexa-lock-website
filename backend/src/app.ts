import Fastify, { LogController } from 'fastify';
import { logger } from './lib/logger.js';
import { API_PREFIX, ADMIN_API_PREFIX } from './config/constants.js';
import sensiblePlugin from './plugins/sensible.js';
import corsPlugin from './plugins/cors.js';
import errorHandlerPlugin from './plugins/error-handler.js';
import requestLoggerPlugin from './middleware/request-logger.js';
import prismaPlugin from './plugins/prisma.js';
import rateLimitPlugin from './plugins/rate-limit.js';
import authPlugin from './plugins/auth.js';
import multipartPlugin from './plugins/multipart.js';
import staticUploadsPlugin from './plugins/static-uploads.js';
import healthRoutes from './modules/health/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import { publicCategoryRoutes, adminCategoryRoutes } from './modules/product-categories/categories.routes.js';
import { publicProductRoutes, adminProductRoutes } from './modules/products/products.routes.js';
import { publicBlogCategoryRoutes, adminBlogCategoryRoutes } from './modules/blog-categories/blog-categories.routes.js';
import { publicBlogTagRoutes, adminBlogTagRoutes } from './modules/blog-tags/blog-tags.routes.js';
import { publicBlogRoutes, adminBlogRoutes } from './modules/blog/blog.routes.js';
import { publicCertificateRoutes, adminCertificateRoutes } from './modules/certificates/certificates.routes.js';
import { publicFactoryGalleryRoutes, adminFactoryGalleryRoutes } from './modules/factory-gallery/factory-gallery.routes.js';
import { publicFaqRoutes, adminFaqRoutes } from './modules/faqs/faqs.routes.js';
import { adminMediaRoutes } from './modules/media/media.routes.js';
import { publicPageRoutes, adminPageRoutes } from './modules/pages/pages.routes.js';
import { publicNavigationRoutes, adminNavigationRoutes } from './modules/navigation/navigation.routes.js';
import { publicSettingsRoutes, adminSettingsRoutes } from './modules/settings/settings.routes.js';
import { adminRedirectRoutes, publicRedirectRoutes } from './modules/redirects/redirects.routes.js';
import { publicInquiryRoutes, adminInquiryRoutes } from './modules/inquiries/inquiries.routes.js';
import { publicSearchRoutes } from './modules/search/search.routes.js';
import { publicTranslationRoutes, adminTranslationRoutes } from './modules/translations/translations.routes.js';
import { adminAccountRoutes } from './modules/account/account.routes.js';
import { adminSystemRoutes } from './modules/system/system.routes.js';
import { adminAuditRoutes } from './modules/audit/audit.routes.js';
import { adminUserRoutes } from './modules/admin-users/admin-users.routes.js';
import { publicPageViewRoutes, adminPageViewRoutes } from './modules/page-views/page-views.routes.js';
import { publicMetaEventRoutes } from './modules/meta-events/meta-events.routes.js';
import { env } from './config/env.js';

export async function buildApp() {
  const app = Fastify({
    loggerInstance: logger,
    // 只信任配置里明确列出的反向代理地址段来读 X-Forwarded-For，不是无条件信任所有请求头
    // （见 config/env.ts 的 TRUST_PROXY 说明）——否则攻击者可以直接伪造这个头绕过按 IP 的限流/锁定。
    trustProxy: env.TRUST_PROXY,
    // 关闭 Fastify 内置的每请求默认日志（incoming request / request completed 两行），
    // 改用 middleware/request-logger.ts 输出的单行结构化日志。
    logController: new LogController({ disableRequestLogging: true }),
    // Fastify 默认单个路由参数（如 /blog/:slug）最长 100 字符，实际博客 slug 是标题自动生成的，
    // 超过 100 字符时请求会被直接拒绝（FST_ERR_MAX_PARAM_LENGTH，414），导致该文章对访客和搜索引擎
    // 都变成404——即使它明明存在于数据库、也出现在 sitemap.xml 里。放宽到 200，覆盖长标题场景。
    // 用 routerOptions 嵌套写法而不是顶层 maxParamLength：后者在 Fastify 5 已标记 FSTDEP022 弃用。
    routerOptions: {
      maxParamLength: 200,
    },
  });

  await app.register(sensiblePlugin);
  await app.register(corsPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(requestLoggerPlugin);
  await app.register(prismaPlugin);
  await app.register(rateLimitPlugin);
  await app.register(authPlugin);
  await app.register(multipartPlugin);
  await app.register(staticUploadsPlugin);

  await app.register(healthRoutes, { prefix: API_PREFIX });
  await app.register(authRoutes, { prefix: `${API_PREFIX}/auth` });

  await app.register(publicCategoryRoutes, { prefix: API_PREFIX });
  await app.register(publicProductRoutes, { prefix: API_PREFIX });
  await app.register(publicBlogCategoryRoutes, { prefix: API_PREFIX });
  await app.register(publicBlogTagRoutes, { prefix: API_PREFIX });
  await app.register(publicBlogRoutes, { prefix: API_PREFIX });
  await app.register(publicCertificateRoutes, { prefix: API_PREFIX });
  await app.register(publicFactoryGalleryRoutes, { prefix: API_PREFIX });
  await app.register(publicFaqRoutes, { prefix: API_PREFIX });
  await app.register(publicPageRoutes, { prefix: API_PREFIX });
  await app.register(publicNavigationRoutes, { prefix: API_PREFIX });
  await app.register(publicSettingsRoutes, { prefix: API_PREFIX });
  await app.register(publicInquiryRoutes, { prefix: API_PREFIX });
  await app.register(publicSearchRoutes, { prefix: API_PREFIX });
  await app.register(publicRedirectRoutes, { prefix: API_PREFIX });
  await app.register(publicTranslationRoutes, { prefix: API_PREFIX });
  await app.register(publicPageViewRoutes, { prefix: API_PREFIX });
  await app.register(publicMetaEventRoutes, { prefix: API_PREFIX });

  await app.register(adminCategoryRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminProductRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminBlogCategoryRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminBlogTagRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminBlogRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminCertificateRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminFactoryGalleryRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminFaqRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminMediaRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminPageRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminNavigationRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminSettingsRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminRedirectRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminInquiryRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminAccountRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminSystemRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminAuditRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminUserRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminTranslationRoutes, { prefix: ADMIN_API_PREFIX });
  await app.register(adminPageViewRoutes, { prefix: ADMIN_API_PREFIX });

  return app;
}

