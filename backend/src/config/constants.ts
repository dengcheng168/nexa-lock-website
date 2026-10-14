export const API_PREFIX = '/api';
export const ADMIN_API_PREFIX = '/api/admin';

export const COOKIE_NAME = 'wp_session';
// 与默认 JWT_EXPIRES_IN=7d 对应；如修改该环境变量，请同步调整这里
export const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * 权限模型版本号：每次角色/权限体系发生不兼容变化（比如这次的二档角色扩展成三档）时手动加一。
 * 登录时把这个数字签进 JWT 的 pv 字段，requireAuth 校验时如果 JWT 里的 pv 跟当前常量不一致，
 * 直接拒绝并要求重新登录——保证旧 Session 不会因为角色名对不上或权限模型变了而拿到不该有的权限。
 */
export const PERMISSION_VERSION = 2;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// 允许上传的文件类型：JPG/PNG/WebP/AVIF/SVG/PDF（需求文档第十七节）
export const ALLOWED_UPLOAD_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'application/pdf': '.pdf',
};

export const RASTER_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

// 批量上传页面一次最多接受的文件数——不是接口层面的分页限制，是防止一次表单提交塞几百个文件把请求撑爆
export const MAX_BATCH_UPLOAD_FILES = 10;

export const THUMBNAIL_SIZE = 400;
