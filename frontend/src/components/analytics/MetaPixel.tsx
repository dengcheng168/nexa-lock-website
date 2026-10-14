import Script from 'next/script';
import { buildMetaPixelBootstrap } from '@/lib/analytics/meta-pixel-bootstrap';

/** Meta 官方推荐的标准像素代码（JS + noscript 兜底），仅在配置了 metaPixelId 时才会被渲染 */
export function MetaPixel({ pixelId }: { pixelId: string }) {
  return (
    <>
      {/*
       * This is intentionally afterInteractive instead of lazyOnload. With an
       * inline Next Script, lazyOnload can leave the script element in the DOM
       * after load without executing its contents. That leaves window.fbq
       * undefined and irretrievably drops the first PageView/ProductDetailView.
       */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {buildMetaPixelBootstrap(pixelId)}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- Meta 官方像素代码要求的 noscript 兜底，不是页面内容图片 */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
