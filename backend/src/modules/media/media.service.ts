import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { PrismaClient } from '@prisma/client';
import ffmpegPath from 'ffmpeg-static';
import { ALLOWED_UPLOAD_MIME_TYPES, RASTER_IMAGE_MIME_TYPES } from '../../config/constants.js';
import { toSkipTake, buildPaginationMeta, type PaginationQuery } from '../../lib/pagination.js';
import {
  UPLOAD_ROOT,
  ORIGINALS_DIR,
  WEBP_DIR,
  THUMBNAILS_DIR,
  ensureUploadDirs,
  generateSafeFilename,
  toPublicUrl,
} from '../../lib/upload-paths.js';
import { processRasterImage } from './image-processing.js';

export class UnsupportedFileTypeError extends Error {}
export class MediaInUseError extends Error {}

const execFileAsync = promisify(execFile);
// ffmpeg-static 在 NodeNext 下的运行值是路径字符串，但其 CommonJS 包声明会被 TS 解析成模块对象。
const ffmpegBinary = ffmpegPath as unknown as string | null;

async function normalizeVideoForWeb(input: SaveUploadInput): Promise<SaveUploadInput> {
  if (input.mimeType !== 'video/quicktime') return input;
  if (!ffmpegBinary) throw new Error('视频转换组件不可用');

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'koigate-video-'));
  const sourcePath = path.join(tempDir, 'source.mov');
  const outputPath = path.join(tempDir, 'output.mp4');
  try {
    await fs.writeFile(sourcePath, input.buffer);
    await execFileAsync(
      ffmpegBinary,
      [
        '-y', '-i', sourcePath,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
        '-c:a', 'aac', '-b:a', '128k',
        outputPath,
      ],
      { windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
    );
    return {
      ...input,
      buffer: await fs.readFile(outputPath),
      originalName: input.originalName.replace(/\.mov$/i, '.mp4'),
      mimeType: 'video/mp4',
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

export interface SaveUploadInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  uploadedById?: number;
  altText?: string;
}

export async function saveUpload(prisma: PrismaClient, input: SaveUploadInput) {
  const normalizedInput = await normalizeVideoForWeb(input);
  const extension = ALLOWED_UPLOAD_MIME_TYPES[normalizedInput.mimeType];
  if (!extension) {
    throw new UnsupportedFileTypeError(`不支持的文件类型：${normalizedInput.mimeType}`);
  }

  await ensureUploadDirs();

  const filename = generateSafeFilename(extension);
  await fs.writeFile(path.join(ORIGINALS_DIR, filename), normalizedInput.buffer);

  let webpUrl: string | null = null;
  let thumbnailUrl: string | null = null;
  let width: number | null = null;
  let height: number | null = null;

  if (RASTER_IMAGE_MIME_TYPES.has(normalizedInput.mimeType)) {
    const processed = await processRasterImage(normalizedInput.buffer);
    width = processed.width;
    height = processed.height;

    if (processed.webpBuffer) {
      const webpFilename = filename.replace(extension, '.webp');
      await fs.writeFile(path.join(WEBP_DIR, webpFilename), processed.webpBuffer);
      webpUrl = toPublicUrl('webp', webpFilename);
    }

    if (processed.thumbnailBuffer) {
      const thumbFilename = filename.replace(extension, '.webp');
      await fs.writeFile(path.join(THUMBNAILS_DIR, thumbFilename), processed.thumbnailBuffer);
      thumbnailUrl = toPublicUrl('thumbnails', thumbFilename);
    }
  }

  return prisma.media.create({
    data: {
      filename,
      originalName: normalizedInput.originalName,
      url: toPublicUrl('originals', filename),
      webpUrl,
      thumbnailUrl,
      mimeType: normalizedInput.mimeType,
      size: normalizedInput.buffer.byteLength,
      width,
      height,
      altText: input.altText,
      uploadedById: input.uploadedById,
    },
  });
}

export async function listAdminMedia(
  prisma: PrismaClient,
  query: PaginationQuery,
  filters: { mimeType?: string },
) {
  const where = filters.mimeType ? { mimeType: filters.mimeType } : {};
  const [items, total] = await Promise.all([
    prisma.media.findMany({ where, orderBy: { createdAt: 'desc' }, ...toSkipTake(query) }),
    prisma.media.count({ where }),
  ]);

  // 只在当前这一页（默认最多 100 条）逐个查引用，跟 listUnusedMedia 用同一套 N+1 取舍逻辑，
  // 复用同一个 findMediaUsage，不会出现"列表说使用中，点删除却真的删掉了"这种前后矛盾
  const itemsWithUsage = await Promise.all(
    items.map(async (item) => {
      const usages = await findMediaUsage(prisma, item);
      return { ...item, inUse: usages.length > 0, usageCount: usages.length };
    }),
  );

  return { items: itemsWithUsage, meta: buildPaginationMeta(query, total) };
}

export function getMediaById(prisma: PrismaClient, id: number) {
  return prisma.media.findUnique({ where: { id } });
}

export function updateMediaAltText(prisma: PrismaClient, id: number, altText: string) {
  return prisma.media.update({ where: { id }, data: { altText } });
}

export interface MediaUrls {
  url: string;
  webpUrl: string | null;
  thumbnailUrl: string | null;
}

/**
 * 删除前检查该媒体文件是否仍被产品/文章/证书/页面/首页设置等引用。
 * 采用字符串匹配而非正式的关联表——在当前内容规模下足够简单可靠。
 *
 * 必须同时匹配 url/webpUrl/thumbnailUrl 三个字段——栅格图片上传后前端 ImageUploader 存的是
 * webpUrl（见 saveUpload 的返回值和 frontend ImageUploader.tsx 的 `webpUrl || url` 逻辑），
 * 只拿原始文件路径去比对的话，几乎所有转过 webp 的图片都会被判定成"从未被引用"，哪怕它正在
 * 首页/产品页上用着——这里之前只传了 url 一个字段，是一个会导致误删正在使用的图片的真实 bug。
 */
export async function findMediaUsage(prisma: PrismaClient, media: MediaUrls) {
  const urls = [media.url, media.webpUrl, media.thumbnailUrl].filter((u): u is string => !!u);
  const usages: { type: string; id: number; name: string }[] = [];

  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      OR: [
        { mainImage: { in: urls } },
        { videoUrl: { in: urls } },
        { ogImage: { in: urls } },
        { specSheetUrl: { in: urls } },
        // 富文本正文/相册/应用场景区块里手动插入或选择的图片也算在用，否则"未使用媒体"
        // 会误判成可以安全删除，实际删了会导致正文/相册/应用场景出现失效图片
        ...urls.flatMap((u) => [
          { galleryImages: { contains: u } },
          { description: { contains: u } },
          { applications: { contains: u } },
        ]),
      ],
    },
    select: { id: true, name: true },
  });
  usages.push(...products.map((p) => ({ type: 'product', id: p.id, name: p.name })));

  // 西班牙语译文里的正文/应用场景/结构化区块同样可能内嵌图片，只在译文里出现、英文原文没有
  // 的图片如果不查这三张翻译表，会被误判为"未使用"从而被误删——查询要 join 回父表判断
  // deletedAt: null（Page 没有 deletedAt，PageTranslation 不需要这层过滤）。
  const productTranslations = await prisma.productTranslation.findMany({
    where: {
      product: { deletedAt: null },
      OR: urls.flatMap((u) => [{ description: { contains: u } }, { applications: { contains: u } }]),
    },
    select: { productId: true, product: { select: { name: true } } },
  });
  usages.push(
    ...productTranslations.map((t) => ({ type: 'product', id: t.productId, name: `${t.product.name}（西班牙语译文）` })),
  );

  // Product/ProductCategory/BlogPost/Certificate 都是软删除（deletedAt 字段打时间戳，
  // 不会真的从表里移除记录）——这里必须显式过滤掉已软删除的记录，否则"已删除"的证书/产品
  // 只要图片字段还留着旧 URL，就会被永远判定为"在用"，导致对应媒体文件再也删不掉
  // （Page/Faq 没有 deletedAt 字段，是硬删除，不需要也不能加这个过滤条件）。
  const categories = await prisma.productCategory.findMany({
    where: { deletedAt: null, image: { in: urls } },
    select: { id: true, name: true },
  });
  usages.push(...categories.map((c) => ({ type: 'product-category', id: c.id, name: c.name })));

  const posts = await prisma.blogPost.findMany({
    where: { deletedAt: null, OR: [{ coverImage: { in: urls } }, ...urls.map((u) => ({ body: { contains: u } }))] },
    select: { id: true, title: true },
  });
  usages.push(...posts.map((p) => ({ type: 'blog-post', id: p.id, name: p.title })));

  const postTranslations = await prisma.blogPostTranslation.findMany({
    where: { post: { deletedAt: null }, OR: urls.map((u) => ({ body: { contains: u } })) },
    select: { postId: true, post: { select: { title: true } } },
  });
  usages.push(...postTranslations.map((t) => ({ type: 'blog-post', id: t.postId, name: `${t.post.title}（西班牙语译文）` })));

  const certs = await prisma.certificate.findMany({
    where: { deletedAt: null, OR: [{ imageUrl: { in: urls } }, { pdfUrl: { in: urls } }] },
    select: { id: true, name: true },
  });
  usages.push(...certs.map((c) => ({ type: 'certificate', id: c.id, name: c.name })));

  const galleryItems = await prisma.factoryGalleryItem.findMany({
    where: { deletedAt: null, imageUrl: { in: urls } },
    select: { id: true, title: true },
  });
  usages.push(...galleryItems.map((g) => ({ type: 'factory-gallery-item', id: g.id, name: g.title })));

  const pages = await prisma.page.findMany({
    where: {
      OR: [
        { ogImage: { in: urls } },
        { heroImage: { in: urls } },
        { heroImageMobile: { in: urls } },
        ...urls.flatMap((u) => [{ bodyHtml: { contains: u } }, { sections: { contains: u } }]),
      ],
    },
    select: { id: true, title: true },
  });
  usages.push(...pages.map((p) => ({ type: 'page', id: p.id, name: p.title })));

  // Page 没有 deletedAt（硬删除），PageTranslation 不需要 join 过滤父表软删除状态
  const pageTranslations = await prisma.pageTranslation.findMany({
    where: { OR: urls.flatMap((u) => [{ bodyHtml: { contains: u } }, { sections: { contains: u } }]) },
    select: { pageId: true, page: { select: { title: true } } },
  });
  usages.push(...pageTranslations.map((t) => ({ type: 'page', id: t.pageId, name: `${t.page.title}（西班牙语译文）` })));

  const settings = await prisma.siteSetting.findFirst({
    where: {
      OR: [
        { heroDesktopImage: { in: urls } },
        { heroMobileImage: { in: urls } },
        { companyLogoUrl: { in: urls } },
        { faviconUrl: { in: urls } },
        { defaultOgImage: { in: urls } },
        { companyMapImage: { in: urls } },
        { companyMapMobileImage: { in: urls } },
      ],
    },
  });
  if (settings) usages.push({ type: 'site-setting', id: settings.id, name: '首页/全局设置' });

  return usages;
}

/**
 * 逐个媒体文件复用 findMediaUsage 判断是否被引用——当前媒体库规模（几十到几百个文件）下，
 * N 次简单查询远比维护一张形式化的关联表划算，也保证跟"删除前检查"用的是同一套判断逻辑，
 * 不会出现"未使用媒体页面说没人用，点删除却报错被占用"这种自相矛盾的情况。
 */
export async function listUnusedMedia(prisma: PrismaClient) {
  const allMedia = await prisma.media.findMany({ orderBy: { createdAt: 'desc' } });
  const unused = [];
  for (const media of allMedia) {
    const usages = await findMediaUsage(prisma, media);
    if (usages.length === 0) unused.push(media);
  }
  return unused;
}

export async function deleteMedia(prisma: PrismaClient, id: number) {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return;

  const usages = await findMediaUsage(prisma, media);
  if (usages.length > 0) {
    throw new MediaInUseError('该媒体文件仍被以下内容使用，无法删除');
  }

  await prisma.media.delete({ where: { id } });

  const filesToRemove = [
    path.join(ORIGINALS_DIR, media.filename),
    media.webpUrl ? path.join(UPLOAD_ROOT, media.webpUrl.replace('/uploads/', '')) : null,
    media.thumbnailUrl ? path.join(UPLOAD_ROOT, media.thumbnailUrl.replace('/uploads/', '')) : null,
  ].filter((p): p is string => !!p);

  await Promise.all(filesToRemove.map((filePath) => fs.unlink(filePath).catch(() => undefined)));
}
