import { z } from 'zod';

export const inquiryStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'QUOTED',
  'WON',
  'CLOSED',
  'SPAM',
]);

export const createInquirySchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  company: z.string().optional(),
  country: z.string().optional(),
  email: z.string().email('邮箱格式不正确'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  productId: z.number().int().optional(),
  productName: z.string().optional(),
  quantity: z.string().optional(),
  message: z.string().optional(),
  sourcePage: z.string().optional(),
  // 提交询盘时所在页面的语言，前台隐藏字段传入；省略时（旧客户端/直接调用 API）视为英文
  pageLanguage: z.string().optional(),
  turnstileToken: z.string().optional(),
  // 蜜罐字段：正常用户看不到该输入框，机器人脚本通常会自动填写，一旦有值即视为垃圾提交（在 service 层判断，不在此处强制校验）
  website: z.string().optional(),
  metaEventId: z.string().min(8).max(128).optional(),
  metaFbp: z.string().max(255).optional(),
  metaFbc: z.string().max(255).optional(),
});

export const updateInquirySchema = z.object({
  status: inquiryStatusSchema.optional(),
  adminNotes: z.string().optional(),
});

export const inquiryListQuerySchema = z.object({
  status: inquiryStatusSchema.optional(),
  q: z.string().optional(),
  sourcePage: z.string().optional(),
  pageLanguage: z.string().optional(),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type UpdateInquiryInput = z.infer<typeof updateInquirySchema>;
