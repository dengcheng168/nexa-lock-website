import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 生成独立运行时（.next/standalone），Docker 镜像只需复制这个目录 + 静态资源即可运行，
  // 不需要把完整 node_modules 打进最终镜像，显著减小生产镜像体积，适合小内存 VPS。
  output: 'standalone',
  async rewrites() {
    const backendBase = process.env.INTERNAL_API_BASE_URL ?? 'http://127.0.0.1:4000';
    return [
      // Codespaces and local previews expose only the frontend port. Keep browser requests,
      // admin actions and uploaded media on that same public origin, then proxy internally.
      { source: '/api/:path*', destination: `${backendBase}/api/:path*` },
      { source: '/uploads/:path*', destination: `${backendBase}/uploads/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Link',
            value: '</llms.txt>; rel="alternate"; type="text/plain", </llms-full.txt>; rel="alternate"; type="text/plain", </catalog.json>; rel="alternate"; type="application/json"',
          },
        ],
      },
    ];
  },
  experimental: {
    // 生产服务器内存较小；限制构建 worker，避免 Docker build 在类型检查/静态生成阶段
    // 并行拉起过多进程触发 OOM。仅影响构建并发，不影响运行时请求并发或页面输出。
    cpus: 1,
    // app/ 顶层不再有共享的 layout.tsx（改成 (site)/es/admin/登录页各自独立的根 layout，
    // 是为了让 <html lang> 能在服务端首次响应里就正确输出 en/es，见 lib/seo/base-metadata.ts），
    // 这种"多根 layout"结构下 Next.js 没法从多棵路由树里拼出一个统一的全局 404，
    // 必须显式开这个 flag 配合 app/global-not-found.tsx 使用。
    globalNotFound: true,
  },
  async redirects() {
    return [
      // OEM/ODM、工厂与质控内容已经集中在 About 页面。旧独立页永久跳转到
      // 对应语言的 About，避免重复主题继续进入 sitemap 或分散搜索权重。
      { source: '/oem-odm', destination: '/about', permanent: true },
      { source: '/factory', destination: '/about', permanent: true },
      { source: '/es/oem-odm', destination: '/es/about', permanent: true },
      { source: '/es/factory', destination: '/es/about', permanent: true },
      // The legacy commercial category currently renders the replacement page with
      // a different canonical. Redirecting the old slug removes the duplicate URL
      // and aligns users, crawlers, and the canonical destination in one hop.
      {
        source: '/products/category/commercial-water-purification-systems',
        destination: '/products/category/commercial-ro-water-purification-systems',
        permanent: true,
      },
      {
        source: '/es/products/category/commercial-water-purification-systems',
        destination: '/es/products/category/commercial-ro-water-purification-systems',
        permanent: true,
      },
      // These legacy category archive URLs have no standalone archive content.
      // Send users and crawlers to the equivalent language blog landing page
      // instead of serving an indexable 200 response that resembles a soft 404.
      {
        source: '/blog/category/company-news',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/es/blog/category/company-news',
        destination: '/es/blog',
        permanent: true,
      },
      // Retired K-series product URLs now have owner-confirmed, model-equivalent
      // replacements. Keep each move language-preserving and one hop so users and
      // crawlers reach the current product rather than a truthful-but-stale 404.
      // K01 was historically mislabeled as 600G; its verified capacity is 100G.
      {
        source: '/products/qw-ro-100g-k01',
        destination: '/products/100g-countertop-ro-water-purifier-with-instant-heating-c01',
        permanent: true,
      },
      {
        source: '/products/qw-ro-600g-k01',
        destination: '/products/100g-countertop-ro-water-purifier-with-instant-heating-c01',
        permanent: true,
      },
      {
        source: '/es/products/qw-ro-100g-k01',
        destination: '/es/products/100g-countertop-ro-water-purifier-with-instant-heating-c01',
        permanent: true,
      },
      {
        source: '/es/products/qw-ro-600g-k01',
        destination: '/es/products/100g-countertop-ro-water-purifier-with-instant-heating-c01',
        permanent: true,
      },
      {
        source: '/products/qw-ro-100g-k02',
        destination: '/products/100g-under-sink-ro-water-purifier-with-pressure-tank',
        permanent: true,
      },
      {
        source: '/es/products/qw-ro-100g-k02',
        destination: '/es/products/100g-under-sink-ro-water-purifier-with-pressure-tank',
        permanent: true,
      },
      {
        source: '/products/qw-ro-600g-k03',
        destination: '/products/600g-tankless-under-sink-ro-water-purifier',
        permanent: true,
      },
      {
        source: '/es/products/qw-ro-600g-k03',
        destination: '/es/products/600g-tankless-under-sink-ro-water-purifier',
        permanent: true,
      },
    ];
  },
  images: {
    // 关闭 Next.js 内置的图片优化代理（/_next/image）。
    //
    // 原因：生产环境是多容器部署，/uploads/** 由 Nginx（同源反代）和 backend 容器提供，
    // frontend 容器自己的文件系统里并没有这些文件。Next.js 图片优化器对"本地相对路径"
    // （不带协议/host 的 src，例如 /uploads/webp/xxx.webp）的处理方式是把它当成本应用自己
    // 能提供的资源去请求，而不是转发给同源的 Nginx，所以在 frontend 容器里找不到文件，
    // 返回 400，图片显示不出来（直接访问 /uploads/... 本身是 200，问题只出在优化代理这一步）。
    //
    // 而且后台上传时后端已经用 sharp 生成了 webp + 缩略图两种尺寸，本来就不需要 Next.js
    // 再优化一遍，所以直接关闭最简单可靠，不用为每个 <Image> 单独加 unoptimized。
    unoptimized: true,
  },
};

export default nextConfig;
