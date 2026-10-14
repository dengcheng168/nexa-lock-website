/** A single picture lets the browser select the correct device image before
 * downloading. CSS-hidden eager images would download both versions.
 */
export function ResponsiveHeroImage({
  desktop,
  mobile,
  className = '',
}: {
  desktop?: string | null;
  mobile?: string | null;
  className?: string;
}) {
  const fallback = desktop || mobile;
  if (!fallback) return null;
  return <>
    {/* React 19 hoists preload links into <head>. Separate media queries keep
        browsers from downloading both art-directed hero files. */}
    {mobile && <link rel="preload" as="image" href={mobile} media="(max-width: 639px)" fetchPriority="high" />}
    <link rel="preload" as="image" href={fallback} media={mobile ? '(min-width: 640px)' : undefined} fetchPriority="high" />
    <picture>
      {mobile && <source media="(max-width: 639px)" srcSet={mobile} />}
      <img
        src={fallback}
        alt=""
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
      />
    </picture>
  </>;
}
