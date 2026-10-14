import { ResponsiveHeroImage } from '@/components/site/ResponsiveHeroImage';
import { Button } from '@/components/ui/Button';
import type { PublicSiteSettings } from '@/types/settings';
import type { Locale } from '@/lib/i18n/locales';
import { localeHref } from '@/lib/i18n/paths';

export function HeroBanner({ settings, locale = 'en' }: { settings: PublicSiteSettings; locale?: Locale }) {
  // 移动端没单独传图时兜底用桌面图（保持原有行为），反过来同理——两个字段都是可选的，
  // 不能因为其中一个没配就在对应设备上整个 hero 区域变成空白导航蓝底
  const desktopSrc = settings.heroDesktopImage ?? settings.heroMobileImage;
  const mobileSrc = settings.heroMobileImage ?? settings.heroDesktopImage;

  return (
    <section className="relative isolate flex min-h-[560px] items-center overflow-hidden bg-navy-950 lg:min-h-[620px]">
      <ResponsiveHeroImage
        desktop={desktopSrc}
        mobile={mobileSrc}
        className="object-[68%_center] sm:object-center"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 py-24 sm:px-10 lg:px-12 xl:px-16">
        <div className="max-w-2xl animate-fade-up">
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.045em] text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.65)] sm:text-6xl xl:text-7xl">{settings.heroHeadline}</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.75)]">{settings.heroSubheadline}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button href={localeHref(settings.heroButton1Link, locale)} variant="primary">{settings.heroButton1Text}</Button>
              <Button href={localeHref(settings.heroButton2Link, locale)} variant="outline" className="!border-white/50 !text-white hover:!bg-white hover:!text-navy-950">{settings.heroButton2Text}</Button>
            </div>
        </div>
      </div>
    </section>
  );
}
