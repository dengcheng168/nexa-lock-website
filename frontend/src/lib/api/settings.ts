import { cache } from 'react';
import { apiFetch } from './client';
import { resolveMediaUrl } from '@/lib/utils/media';
import type { PublicSiteSettings } from '@/types/settings';

/**
 * Docker 构建时前端与后端处于隔离的构建网络中，可能暂时连不上后端（见部署文档说明）。
 * 这里给出兜底默认值，保证 `next build` 静态生成阶段不会因为后端不可达而整体失败——
 * 页面会先用占位内容完成预渲染，容器启动后由 ISR（revalidate）在首次真实请求时刷新为最新内容。
 */
const FALLBACK_SETTINGS: PublicSiteSettings = {
  companyName: 'Placeholder Smart Lock Technology Co., Ltd.',
  brandName: 'NEXA LOCK',
  companyLogoUrl: null,
  faviconUrl: null,
  companyAddress: null,
  companyMapImage: null,
  companyMapMobileImage: null,
  companyEmail: null,
  companyPhone: null,
  whatsappNumber: null,
  whatsappLink: null,
  socialLinks: [],
  turnstileEnabled: false,
  turnstileSiteKey: null,
  defaultSeoTitle: null,
  defaultSeoDescription: null,
  defaultOgImage: null,
  googleSiteVerification: null,
  heroHeadline: 'Smart Access. Built Around You.',
  heroSubheadline: 'Connected smart locks for homes, apartments and hospitality projects — engineered for secure, effortless entry.',
  heroButton1Text: 'Start a Project',
  heroButton1Link: '/contact',
  heroButton2Text: 'Explore Smart Locks',
  heroButton2Link: '/products',
  heroDesktopImage: '/images/smart-lock/hero-smart-lock.png',
  heroMobileImage: '/images/smart-lock/hero-smart-lock.png',
  homepageVideoUrl: null,
  coreAdvantages: [],
  footerText: null,
  footerColumns: null,
  footerCompanyIntro: null,
  metaPixelId: null,
  tiktokPixelId: null,
  googlePixelId: null,
  googleAdsId: null,
  siteBaseUrl: null,
};

function resolveSettingsMedia(settings: PublicSiteSettings): PublicSiteSettings {
  return {
    ...settings,
    companyLogoUrl: settings.companyLogoUrl ? resolveMediaUrl(settings.companyLogoUrl) : settings.companyLogoUrl,
    faviconUrl: settings.faviconUrl ? resolveMediaUrl(settings.faviconUrl) : settings.faviconUrl,
    heroDesktopImage: settings.heroDesktopImage ? resolveMediaUrl(settings.heroDesktopImage) : settings.heroDesktopImage,
    heroMobileImage: settings.heroMobileImage ? resolveMediaUrl(settings.heroMobileImage) : settings.heroMobileImage,
    defaultOgImage: settings.defaultOgImage ? resolveMediaUrl(settings.defaultOgImage) : settings.defaultOgImage,
    companyMapImage: settings.companyMapImage ? resolveMediaUrl(settings.companyMapImage) : settings.companyMapImage,
    companyMapMobileImage: settings.companyMapMobileImage
      ? resolveMediaUrl(settings.companyMapMobileImage)
      : settings.companyMapMobileImage,
  };
}

export const getPublicSettings = cache(async (): Promise<PublicSiteSettings> => {
  try {
    const { data } = await apiFetch<PublicSiteSettings>(
      '/settings/public',
      process.env.NODE_ENV === 'development'
        ? { revalidate: 1, tags: ['settings'] }
        : { revalidate: 300, tags: ['settings'] },
    );
    return resolveSettingsMedia(data);
  } catch {
    return FALLBACK_SETTINGS;
  }
});
