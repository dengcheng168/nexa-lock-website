import { z } from 'zod';

export const contactEventSchema = z.object({
  eventId: z.string().min(8).max(128),
  sourcePath: z.string().min(1).max(500),
  contactMethod: z.enum(['whatsapp_link', 'email_link', 'phone_link']),
  contactLocation: z.string().max(200).optional(),
  productSlug: z.string().max(200).optional(),
});

export type ContactEventInput = z.infer<typeof contactEventSchema>;

export const productDetailViewEventSchema = z.object({
  eventId: z.string().min(8).max(128),
  sourcePath: z.string().min(1).max(500),
  productSlug: z.string().min(1).max(200),
});
