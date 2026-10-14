import { PrismaClient } from '@prisma/client';
import { toJsonString } from '../src/lib/json.js';

const prisma = new PrismaClient();

async function main() {
  console.log('开始写入演示数据...');

  // ---- 产品分类 ----
  const categories = await Promise.all(
    [
      {
        name: 'Residential Smart Locks',
        slug: 'residential-smart-locks',
        description: 'Fingerprint, PIN, card and app-enabled locks for apartments and private homes.',
        sortOrder: 1,
      },
      {
        name: 'Hospitality & Apartment Locks',
        slug: 'hospitality-apartment-locks',
        description: 'Connected access hardware for hotels, rentals and managed residential properties.',
        sortOrder: 2,
      },
      {
        name: 'Glass & Specialty Door Locks',
        slug: 'glass-specialty-door-locks',
        description: 'Purpose-built smart locks for glass, narrow-frame and other specialty doors.',
        sortOrder: 3,
      },
    ].map((c) => prisma.productCategory.upsert({ where: { slug: c.slug }, update: {}, create: c })),
  );

  // ---- 演示产品（6个）----
  const productDefs = [
    {
      name: 'A1 Slim Fingerprint Smart Lock',
      slug: 'a1-slim-fingerprint-smart-lock',
      sku: 'SL-A1',
      categoryId: categories[0].id,
      shortDescription: 'A slim fingerprint and PIN lock for modern residential doors, ready for OEM branding.',
      description:
        '<p>A compact smart lock platform designed for residential projects. Supports fingerprint, PIN, card and mechanical-key access, with finish, logo and packaging options for OEM/ODM partners.</p>',
      mainImage: '/images/placeholders/product-placeholder.svg',
      galleryImages: toJsonString([{ url: '/images/placeholders/product-placeholder.svg', alt: 'RO-500 product photo' }]),
      specs: toJsonString([
        { label: 'Access Methods', value: 'Fingerprint / PIN / Card / Key' },
        { label: 'Door Thickness', value: '35–60 mm' },
        { label: 'Power', value: '4 × AA batteries' },
      ]),
      features: toJsonString(['Fast fingerprint recognition', 'Anti-peep PIN entry', 'Low-battery alert', 'OEM/ODM ready']),
      applications: toJsonString([{ title: 'Residential Entry', description: 'Keyless access for apartments and private homes.' }]),
      packagingInfo: 'Standard export carton, 1 set per box; custom packaging available for OEM orders.',
      moq: '100 units',
      featured: true,
      sortOrder: 1,
      status: 'PUBLISHED',
    },
    {
      name: 'A2 Wi-Fi Video Smart Lock',
      slug: 'a2-wifi-video-smart-lock',
      sku: 'SL-A2',
      categoryId: categories[0].id,
      shortDescription: 'Smart entry lock with camera, doorbell and remote app management.',
      description: '<p>An integrated smart entry platform for family homes and premium apartments, combining local access credentials with visitor viewing and remote management.</p>',
      mainImage: '/images/placeholders/product-placeholder.svg',
      galleryImages: toJsonString([{ url: '/images/placeholders/product-placeholder.svg', alt: 'RO-800 product photo' }]),
      specs: toJsonString([
        { label: 'Connectivity', value: 'Wi-Fi / Bluetooth' },
        { label: 'Access Methods', value: 'Fingerprint / PIN / Card / App / Key' },
      ]),
      features: toJsonString(['Integrated doorbell camera', 'Remote temporary PINs', 'Access activity records']),
      applications: toJsonString([{ title: 'Connected Homes', description: 'Managed front-door access for families and visitors.' }]),
      packagingInfo: 'Export carton, 1 unit per box.',
      moq: '100 units',
      featured: true,
      sortOrder: 2,
      status: 'PUBLISHED',
    },
    {
      name: 'H1 Hotel RFID Lock',
      slug: 'h1-hotel-rfid-lock',
      sku: 'SL-H1',
      categoryId: categories[1].id,
      shortDescription: 'RFID hotel lock designed for room-management and hospitality projects.',
      description: '<p>A durable hotel-room lock platform for new-build and renovation projects, designed to coordinate with common hospitality access workflows.</p>',
      mainImage: '/images/placeholders/product-placeholder.svg',
      galleryImages: toJsonString([{ url: '/images/placeholders/product-placeholder.svg', alt: 'CF-2000 product photo' }]),
      specs: toJsonString([
        { label: 'Credential', value: 'RFID card / Mechanical key' },
        { label: 'Material', value: 'Zinc alloy / Stainless steel' },
      ]),
      features: toJsonString(['Room-card access', 'Low-battery warning', 'Emergency mechanical override']),
      applications: toJsonString([{ title: 'Hotels', description: 'Guest-room access for hotels and serviced apartments.' }]),
      packagingInfo: 'Export carton with installation accessories.',
      moq: '100 units',
      featured: true,
      sortOrder: 1,
      status: 'PUBLISHED',
    },
    {
      name: 'M1 Managed Apartment Smart Lock',
      slug: 'm1-managed-apartment-smart-lock',
      sku: 'SL-M1',
      categoryId: categories[1].id,
      shortDescription: 'Connected lock for rental apartments and multi-family property operations.',
      description: '<p>A connected access platform for managed properties, supporting time-bound credentials and centralized operating workflows when paired with the selected management solution.</p>',
      mainImage: '/images/placeholders/product-placeholder.svg',
      galleryImages: toJsonString([{ url: '/images/placeholders/product-placeholder.svg', alt: 'CF-5000 product photo' }]),
      specs: toJsonString([
        { label: 'Connectivity', value: 'Bluetooth / Gateway option' },
        { label: 'Access Methods', value: 'PIN / Card / App / Key' },
      ]),
      features: toJsonString(['Time-bound credentials', 'Access activity records', 'Gateway-ready connectivity']),
      applications: toJsonString([{ title: 'Managed Apartments', description: 'Flexible access for tenants, staff and maintenance teams.' }]),
      packagingInfo: 'Export carton with installation accessories.',
      moq: '100 units',
      featured: false,
      sortOrder: 2,
      status: 'PUBLISHED',
    },
    {
      name: 'G1 Glass Door Smart Lock',
      slug: 'g1-glass-door-smart-lock',
      sku: 'SL-G1',
      categoryId: categories[2].id,
      shortDescription: 'Clamp-mounted smart lock for compatible frameless glass doors.',
      description: '<p>A compact access solution for compatible glass-door installations in offices, meeting rooms and modern commercial interiors.</p>',
      mainImage: '/images/placeholders/product-placeholder.svg',
      galleryImages: toJsonString([{ url: '/images/placeholders/product-placeholder.svg', alt: 'WH-100 product photo' }]),
      specs: toJsonString([
        { label: 'Door Type', value: 'Compatible frameless glass doors' },
        { label: 'Access Methods', value: 'Fingerprint / PIN / Card / App' },
      ]),
      features: toJsonString(['No-frame installation format', 'Multiple credentials', 'Indoor access control']),
      applications: toJsonString([{ title: 'Offices', description: 'Smart access for glass meeting-room and office doors.' }]),
      packagingInfo: 'Export carton.',
      moq: '200 units',
      featured: false,
      sortOrder: 1,
      status: 'PUBLISHED',
    },
    {
      name: 'N1 Narrow-Frame Smart Lock',
      slug: 'n1-narrow-frame-smart-lock',
      sku: 'SL-N1',
      categoryId: categories[2].id,
      shortDescription: 'Slim smart lock designed for compatible aluminum-frame doors.',
      description: '<p>A narrow-body access solution for compatible aluminum and slim-profile door systems in residential and light-commercial projects.</p>',
      mainImage: '/images/placeholders/product-placeholder.svg',
      galleryImages: toJsonString([{ url: '/images/placeholders/product-placeholder.svg', alt: 'WH-200 product photo' }]),
      specs: toJsonString([
        { label: 'Front Panel Width', value: 'Narrow-profile format' },
        { label: 'Access Methods', value: 'Fingerprint / PIN / Card / Key' },
      ]),
      features: toJsonString(['Slim installation profile', 'Multiple credentials', 'Low-battery alert']),
      applications: toJsonString([{ title: 'Narrow-Frame Doors', description: 'Smart access for compatible aluminum-frame entries.' }]),
      packagingInfo: 'Export carton.',
      moq: '200 units',
      featured: false,
      sortOrder: 2,
      status: 'PUBLISHED',
    },
  ];

  for (const p of productDefs) {
    await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }

  // ---- 博客分类 + 博客文章（3篇）----
  const blogCategory = await prisma.blogCategory.upsert({
    where: { slug: 'company-news' },
    update: {},
    create: { name: 'Company News', slug: 'company-news', sortOrder: 1 },
  });

  const blogPosts = [
    {
      title: 'How to Choose the Right Smart Lock OEM Partner',
      slug: 'how-to-choose-the-right-smart-lock-oem-partner',
      excerpt: 'Key factors distributors should evaluate before selecting a smart lock OEM/ODM manufacturer.',
      body: '<p>Placeholder article body. Replace with real content covering factory audits, certification checks, and sample evaluation.</p>',
      categoryId: blogCategory.id,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    {
      title: 'Smart Lock Access Methods Explained',
      slug: 'smart-lock-access-methods-explained',
      excerpt: 'A practical overview of fingerprint, PIN, card, app and mechanical-key access.',
      body: '<p>Placeholder article body. Replace with verified technical content about supported credentials, installation and management workflows.</p>',
      categoryId: blogCategory.id,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    {
      title: 'Factory Update: New Production Line Launched',
      slug: 'factory-update-new-production-line-launched',
      excerpt: 'Placeholder company news post announcing a new production line.',
      body: '<p>Placeholder article body. Replace with real factory news content.</p>',
      categoryId: blogCategory.id,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  ];

  for (const post of blogPosts) {
    await prisma.blogPost.upsert({ where: { slug: post.slug }, update: {}, create: post });
  }

  // ---- FAQ（4条）----
  const faqs = [
    { question: 'Do you support OEM and ODM services?', answer: 'Yes, we support full OEM/ODM customization including logo, packaging, and appearance.', sortOrder: 1 },
    { question: 'What is your minimum order quantity (MOQ)?', answer: 'MOQ varies by product, please see individual product pages or contact us for details.', sortOrder: 2 },
    { question: 'Which door types are compatible?', answer: 'Compatibility depends on the door material, thickness, backset and lock-body dimensions. Share your door details so our team can confirm fit before ordering.', sortOrder: 3 },
    { question: 'What is your typical lead time?', answer: 'Lead time depends on order volume and customization requirements; please contact us for an accurate quote.', sortOrder: 4 },
  ];
  for (const f of faqs) {
    const existing = await prisma.faq.findFirst({ where: { question: f.question } });
    if (!existing) await prisma.faq.create({ data: f });
  }

  // ---- 认证证书占位（3个，明确标注为示例）----
  const certificates = [
    { name: 'CE Certificate (Sample Placeholder)', certType: 'CE', imageUrl: '/images/placeholders/product-placeholder.svg', description: 'Placeholder only — replace with your real certificate before launch.', sortOrder: 1 },
    { name: 'RoHS Certificate (Sample Placeholder)', certType: 'RoHS', imageUrl: '/images/placeholders/product-placeholder.svg', description: 'Placeholder only — replace with your real certificate before launch.', sortOrder: 2 },
    { name: 'ISO 9001 Certificate (Sample Placeholder)', certType: 'ISO', imageUrl: '/images/placeholders/product-placeholder.svg', description: 'Placeholder only — replace with your real certificate before launch.', sortOrder: 3 },
  ];
  for (const c of certificates) {
    const existing = await prisma.certificate.findFirst({ where: { name: c.name } });
    if (!existing) await prisma.certificate.create({ data: c });
  }

  // ---- 导航菜单 ----
  const navItems = [
    { label: 'Home', url: '/', sortOrder: 1 },
    { label: 'Products', url: '/products', sortOrder: 2 },
    { label: 'Certificates', url: '/certificates', sortOrder: 3 },
    { label: 'About Us', url: '/about', sortOrder: 4 },
    { label: 'Blog', url: '/blog', sortOrder: 5 },
    { label: 'Contact', url: '/contact', sortOrder: 6 },
  ];
  for (const n of navItems) {
    const existing = await prisma.navigationItem.findFirst({ where: { label: n.label, url: n.url } });
    if (!existing) await prisma.navigationItem.create({ data: n });
  }

  // ---- 页面文案（About / Privacy / Terms / Contact）----
  const pages = [
    {
      slug: 'about',
      title: 'About Us',
      bodyHtml: '<p>Placeholder About Us content. Replace with real company history, mission, and values.</p>',
    },
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      bodyHtml: '<p>Placeholder privacy policy content. Replace with your real, legally reviewed privacy policy before launch.</p>',
    },
    {
      slug: 'terms-of-use',
      title: 'Terms of Use',
      bodyHtml: '<p>Placeholder terms of use content. Replace with your real, legally reviewed terms before launch.</p>',
    },
    {
      slug: 'contact',
      title: 'Contact Us',
      bodyHtml: '<p>Placeholder contact page introduction text.</p>',
    },
    // certificates/blog/products 原本没有对应的 Page 行（这几个页面的标题/简介一直是写死在
    // page.tsx 里的），这里只补一条空壳记录，好让后台"页面文案"能管理它们的顶部背景图；
    // 标题/正文仍然维持写死，不在这里改动，避免影响这些页面已经在用的既有文案
    { slug: 'certificates', title: 'Certificates' },
    { slug: 'blog', title: 'Blog' },
    { slug: 'products', title: 'Products' },
  ];
  for (const p of pages) {
    await prisma.page.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }

  // ---- 首页/全局设置（单例行）----
  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyName: 'Placeholder Smart Lock Technology Co., Ltd.',
      brandName: 'NEXA LOCK',
      companyEmail: 'sales@example.com',
      companyPhone: '+86 000 0000 0000',
      companyAddress: 'Placeholder Industrial Zone, Placeholder City, China',
      whatsappNumber: '+86 000 0000 0000',
      coreAdvantages: toJsonString([
        { title: 'Flexible Access', description: 'Configure fingerprint, PIN, card, app and mechanical-key access around the requirements of each product and project.' },
        { title: 'Door-Fit Engineering', description: 'We coordinate lock-body, backset, door thickness and material requirements before sampling and production.' },
        { title: 'OEM/ODM Delivery', description: 'Hardware finishes, firmware options, logos, packaging and export preparation can be coordinated for confirmed projects.' },
      ]),
      heroHeadline: 'Smart Access. Built Around You.',
      heroSubheadline: 'Connected smart locks for homes, apartments and hospitality projects — engineered for secure, effortless entry.',
      heroButton1Text: 'Start a Project',
      heroButton2Text: 'Explore Smart Locks',
      heroDesktopImage: '/images/smart-lock/hero-smart-lock.png',
      heroMobileImage: '/images/smart-lock/hero-smart-lock.png',
      // 预置常见社媒平台，链接留空、默认关闭，管理员在后台填好链接后勾选启用即可
      socialLinks: toJsonString([
        { platform: 'facebook', label: 'Facebook', url: '', enabled: false },
        { platform: 'x', label: 'X (Twitter)', url: '', enabled: false },
        { platform: 'linkedin', label: 'LinkedIn', url: '', enabled: false },
        { platform: 'instagram', label: 'Instagram', url: '', enabled: false },
        { platform: 'youtube', label: 'YouTube', url: '', enabled: false },
        { platform: 'tiktok', label: 'TikTok', url: '', enabled: false },
        { platform: 'whatsapp', label: 'WhatsApp', url: '', enabled: false },
      ]),
    },
  });

  console.log('演示数据写入完成。');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
