'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { ProductImage } from '@/types/product';
import { toThumbnailUrl } from '@/lib/media/thumbnail';
import { getYoutubeEmbedUrl } from '@/lib/utils/youtube';
import { resolveMediaUrl } from '@/lib/utils/media';

function imageAlt(alt: string | undefined, productName: string) {
  return alt?.trim() || productName;
}

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M3 10l5-5 5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ZoomIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.75" />
      <path d="M13.5 13.5 18 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M9 6.5v5M6.5 9h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ProductGallery({
  mainImage,
  videoUrl,
  images,
  name,
}: {
  mainImage: string;
  videoUrl?: string | null;
  images: ProductImage[];
  name: string;
}) {
  const allImages: ProductImage[] = [{ url: mainImage, alt: name }, ...images];
  const youtubeEmbedUrl = getYoutubeEmbedUrl(videoUrl);
  const slides = videoUrl
    ? [{ type: 'video' as const, url: videoUrl }, ...allImages.map((image) => ({ type: 'image' as const, image }))]
    : allImages.map((image) => ({ type: 'image' as const, image }));
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const hasMultiple = slides.length > 1;
  const thumbListRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function goTo(delta: number) {
    setActive((prev) => (prev + delta + slides.length) % slides.length);
  }

  useEffect(() => {
    thumbRefs.current[active]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [active]);

  // Lightbox 打开时：ESC 关闭（桌面），锁住 body 滚动避免背景内容跟着滚动
  useEffect(() => {
    if (!lightboxOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen]);

  const thumbButtonClasses = (i: number) =>
    `relative aspect-square w-full shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
      active === i ? 'border-water-500' : 'border-grey-200 hover:border-grey-300'
    }`;

  const current = slides[active] ?? slides[0]!;
  const currentImage = current.type === 'image' ? current.image : null;
  const navButtons = hasMultiple ? (
    <>
      <button
        type="button"
        onClick={() => goTo(-1)}
        aria-label="Previous image"
        className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-navy-950 shadow transition-colors hover:bg-white"
      >
        &lsaquo;
      </button>
      <button
        type="button"
        onClick={() => goTo(1)}
        aria-label="Next image"
        className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-navy-950 shadow transition-colors hover:bg-white"
      >
        &rsaquo;
      </button>
    </>
  ) : null;

  // 主图展示区：固定使用 1:1 视觉比例（产品图片系统统一标准），由宽度反推高度而不是反过来——
  // 这样容器的尺寸完全由父级可用宽度决定，不会像"固定高度 + JS 算宽度"的旧实现那样，把自己的
  // intrinsic 宽度带到 Grid/Flex 祖先上，撑宽整个页面。非正方形的历史图片靠 object-contain
  // 完整显示（留白，不裁切），不会被拉伸变形。
  const stageClasses =
    'relative aspect-square w-full max-w-full min-w-0 overflow-hidden rounded-lg border border-grey-200 bg-white';
  // 视频按常见原始画幅展示，而不是塞进产品图的 1:1 容器。object-contain 保证横屏
  // 16:9 与竖屏 9:16 素材都完整可见；不裁切、不拉伸，剩余区域统一使用黑色衬底。
  const videoStageClasses =
    'relative aspect-video w-full max-w-full min-w-0 overflow-hidden rounded-lg border border-grey-200 !bg-black';

  return (
    <div className="min-w-0 lg:flex lg:items-start lg:gap-4">
      {hasMultiple && (
        <div className="hidden lg:flex lg:w-[84px] lg:shrink-0 lg:flex-col lg:items-center lg:gap-2">
          <button
            type="button"
            onClick={() => goTo(-1)}
            aria-label="Previous image"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-grey-300 text-grey-500 transition-colors hover:border-water-500 hover:text-water-600"
          >
            <ChevronUpIcon />
          </button>
          <div ref={thumbListRef} className="flex max-h-[420px] w-full flex-col gap-2.5 overflow-y-auto">
            {slides.map((slide, i) => (
              <button
                key={`${slide.type === 'video' ? slide.url : slide.image.url}-${i}`}
                type="button"
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                onClick={() => setActive(i)}
                aria-label={slide.type === 'video' ? `${name} video` : `${name} image ${i + 1}`}
                aria-current={active === i ? 'true' : undefined}
                className={thumbButtonClasses(i)}
              >
                {slide.type === 'video' ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-navy-950 text-white">
                    <span className="ml-0.5 text-xl">&#9654;</span>
                  </span>
                ) : (
                  <Image src={toThumbnailUrl(slide.image.url)} alt={imageAlt(slide.image.alt, name)} fill sizes="84px" className="object-cover" />
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(1)}
            aria-label="Next image"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-grey-300 text-grey-500 transition-colors hover:border-water-500 hover:text-water-600"
          >
            <ChevronDownIcon />
          </button>
        </div>
      )}

      <div className="min-w-0 lg:flex-1">
        {current.type === 'video' ? (
          <div className={videoStageClasses}>
            {youtubeEmbedUrl ? (
              <iframe
                src={`${youtubeEmbedUrl}?rel=0`}
                title={`${name} video`}
                className="absolute inset-0 h-full w-full bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video
                src={resolveMediaUrl(current.url)}
                className="absolute inset-0 h-full w-full bg-black object-contain"
                controls
                playsInline
                preload="metadata"
              />
            )}
            {navButtons}
          </div>
        ) : currentImage?.mobileUrl ? (
          <>
            {/*
              该图配置了手机端专用版本（mobileUrl）：两套 <Image> 都会被渲染，用 sm 断点
              切换显示/隐藏（而不是用 JS 判断视口宽度），避免 hydration 时序问题；未配置
              mobileUrl 的图片（占绝大多数）走下面的单一分支，不受影响、不多渲染一张图。
              两个断点共用同一个静态 aspect-square 容器规格，不再各自维护动态宽高比。
            */}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={`${name} — tap to view full image`}
              className={`${stageClasses} block cursor-zoom-in sm:hidden`}
            >
              <Image src={currentImage.mobileUrl} alt={imageAlt(currentImage.alt, name)} fill sizes="100vw" className="object-contain" priority />
              <span className="pointer-events-none absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-navy-950 shadow">
                <ZoomIcon />
              </span>
              {navButtons}
            </button>
            <div className={`${stageClasses} hidden sm:block`}>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label={`${name} — click to view full image`}
                className="absolute inset-0 cursor-zoom-in"
              >
                <Image
                  src={currentImage.url}
                  alt={imageAlt(currentImage.alt, name)}
                  fill
                  sizes="(min-width: 1024px) 35vw, 100vw"
                  className="object-contain"
                  priority
                />
                <span className="pointer-events-none absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-navy-950 shadow">
                  <ZoomIcon />
                </span>
              </button>
              {navButtons}
            </div>
          </>
        ) : (
          <div className={stageClasses}>
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={`${name} — click to view full image`}
              className="absolute inset-0 cursor-zoom-in"
            >
              <Image
                src={currentImage?.url ?? mainImage}
                alt={imageAlt(currentImage?.alt, name)}
                fill
                sizes="(min-width: 1024px) 35vw, 100vw"
                className="object-contain"
                priority
              />
              <span className="pointer-events-none absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-navy-950 shadow">
                <ZoomIcon />
              </span>
            </button>
            {navButtons}
          </div>
        )}

        {hasMultiple && (
          <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 lg:hidden" aria-label="Product thumbnails">
            {slides.map((slide, i) => (
              <button
                key={`${slide.type === 'video' ? slide.url : slide.image.url}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                aria-label={slide.type === 'video' ? `${name} video` : `${name} image ${i + 1}`}
                aria-current={active === i ? 'true' : undefined}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                  active === i ? 'border-water-500' : 'border-grey-200 hover:border-grey-300'
                }`}
              >
                {slide.type === 'video' ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-navy-950 text-white">&#9654;</span>
                ) : (
                  <Image src={toThumbnailUrl(slide.image.url)} alt={imageAlt(slide.image.alt, name)} fill sizes="64px" className="object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && currentImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} full image`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          <div
            className="relative h-full max-h-[90vh] w-full max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentImage.url}
              alt={imageAlt(currentImage.alt, name)}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
