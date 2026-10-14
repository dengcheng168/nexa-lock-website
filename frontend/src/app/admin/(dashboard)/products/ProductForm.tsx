'use client';

import { useActionState, useState } from 'react';
import { FormField, fieldInputClasses } from '@/components/admin/FormField';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { VideoUploader } from '@/components/admin/VideoUploader';
import { MultiImageUploader } from '@/components/admin/MultiImageUploader';
import { TranslationMeta } from '@/components/admin/TranslationMeta';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/admin/ui/tabs';
import { Badge } from '@/components/admin/ui/badge';
import type { AdminFormState } from '@/lib/actions/admin/categories';
import type { TranslationFormState } from '@/lib/actions/admin/translations-shared';

interface CategoryOption {
  id: number;
  name: string;
}

interface FormValues {
  name?: string;
  sku?: string | null;
  categoryId?: number;
  shortDescription?: string | null;
  description?: string;
  mainImage?: string;
  videoUrl?: string | null;
  galleryImages?: { url: string; alt?: string; mobileUrl?: string }[];
  specs?: { label: string; value: string }[];
  features?: (string | { title: string; description?: string })[];
  applications?: { title: string; description?: string }[];
  packagingInfo?: string | null;
  moq?: string | null;
  oemOdmSupport?: boolean;
  specSheetUrl?: string | null;
  status?: string;
  featured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
}

interface TranslationValues {
  name?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  specs?: { label: string; value: string }[] | null;
  features?: (string | { title: string; description?: string })[] | null;
  applications?: { title: string; description?: string }[] | null;
  packagingInfo?: string | null;
  moq?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  translationStatus?: string;
  updatedAt?: string;
  updatedBy?: number | null;
}

function specsToText(specs?: { label: string; value: string }[] | null) {
  return (specs ?? []).map((s) => `${s.label}: ${s.value}`).join('\n');
}

function featuresToText(features?: (string | { title: string; description?: string })[] | null) {
  return (features ?? []).map((f) => (typeof f === 'string' ? f : f.title)).join('\n');
}

function applicationsToText(apps?: { title: string; description?: string }[] | null) {
  return (apps ?? []).map((a) => (a.description ? `${a.title}: ${a.description}` : a.title)).join('\n');
}

function ProductSeoEditor({
  idPrefix,
  title: initialTitle,
  description: initialDescription,
  keywords: initialKeywords,
  languageLabel,
  sourceTitle,
  sourceDescription,
}: {
  idPrefix: string;
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  languageLabel: string;
  sourceTitle?: string | null;
  sourceDescription?: string | null;
}) {
  const [title, setTitle] = useState(initialTitle ?? '');
  const [description, setDescription] = useState(initialDescription ?? '');
  const [keywords, setKeywords] = useState(initialKeywords ?? '');
  const titleHealthy = title.length >= 30 && title.length <= 60;
  const descriptionHealthy = description.length >= 120 && description.length <= 160;
  const keywordCount = keywords.split(',').map((item) => item.trim()).filter(Boolean).length;

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">产品 SEO（{languageLabel}）</h2>
          <p className="mt-1 text-xs text-muted-foreground">用于该产品在搜索结果中的标题和摘要；留空时系统会使用产品名称与简短描述。</p>
        </div>
        <Badge variant={titleHealthy && descriptionHealthy ? 'success' : 'warning'}>
          {titleHealthy && descriptionHealthy ? '长度合适' : '需要调整'}
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-4">
          <FormField
            label={<span className="flex items-center justify-between gap-3"><span>SEO 标题</span><Badge variant={titleHealthy ? 'success' : 'warning'}>{title.length}/60</Badge></span>}
            htmlFor={`${idPrefix}seoTitle`}
            hint={sourceTitle ? `英文原文：${sourceTitle}` : '建议 30–60 个字符；写明型号、产品类型和核心卖点，避免关键词堆砌。'}
          >
            <input id={`${idPrefix}seoTitle`} name="seoTitle" value={title} onChange={(event) => setTitle(event.target.value)} className={fieldInputClasses} />
          </FormField>
          <FormField
            label={<span className="flex items-center justify-between gap-3"><span>SEO 描述</span><Badge variant={descriptionHealthy ? 'success' : 'warning'}>{description.length}/160</Badge></span>}
            htmlFor={`${idPrefix}seoDescription`}
            hint={sourceDescription ? `英文原文：${sourceDescription}` : '建议 120–160 个字符；包含规格、应用场景、OEM/ODM 能力和询盘意图。'}
          >
            <textarea id={`${idPrefix}seoDescription`} name="seoDescription" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className={fieldInputClasses} />
          </FormField>
          <FormField
            label={<span className="flex items-center justify-between gap-3"><span>辅助关键词</span><Badge variant={keywordCount <= 8 ? 'muted' : 'warning'}>{keywordCount} 个</Badge></span>}
            htmlFor={`${idPrefix}seoKeywords`}
            hint="使用英文逗号分隔，建议 3–8 个。Google 不使用 meta keywords 排名，本字段主要用于内容规划和其他搜索引擎。"
          >
            <input id={`${idPrefix}seoKeywords`} name="seoKeywords" value={keywords} onChange={(event) => setKeywords(event.target.value)} className={fieldInputClasses} />
          </FormField>
        </div>

        <div className="h-fit rounded-lg border border-border bg-muted/30 p-4">
          <div className="text-xs font-medium text-foreground">Google 搜索结果预览</div>
          <div className="mt-3 text-xs text-emerald-700">https://koigatetech.com/products/…</div>
          <div className="mt-1 line-clamp-2 text-lg leading-6 text-blue-700">{title || '产品 SEO 标题预览'}</div>
          <p className="mt-1 line-clamp-4 text-sm leading-5 text-muted-foreground">{description || '产品 SEO 描述会在这里实时显示。'}</p>
        </div>
      </div>
    </section>
  );
}

export function ProductForm({
  action,
  categories,
  initialValues,
  translationAction,
  translation,
}: {
  action: (prevState: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  categories: CategoryOption[];
  initialValues?: FormValues;
  translationAction?: (prevState: TranslationFormState, formData: FormData) => Promise<TranslationFormState>;
  translation?: TranslationValues | null;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [esState, esFormAction, esPending] = useActionState(translationAction ?? action, {});

  const englishForm = (
    <form action={formAction} className="max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="产品名称" htmlFor="name" required>
          <input id="name" name="name" defaultValue={initialValues?.name} required className={fieldInputClasses} />
        </FormField>
        <FormField label="产品编号 SKU" htmlFor="sku">
          <input id="sku" name="sku" defaultValue={initialValues?.sku ?? ''} className={fieldInputClasses} />
        </FormField>
      </div>

      <FormField label="产品分类" htmlFor="categoryId" required>
        <select id="categoryId" name="categoryId" defaultValue={initialValues?.categoryId} required className={fieldInputClasses}>
          <option value="">请选择分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="简短描述" htmlFor="shortDescription">
        <input id="shortDescription" name="shortDescription" defaultValue={initialValues?.shortDescription ?? ''} className={fieldInputClasses} />
      </FormField>

      <FormField label="详细描述（HTML）" htmlFor="description" hint="支持 HTML 标签，如 <p> <strong> <ul><li>">
        <textarea id="description" name="description" rows={6} defaultValue={initialValues?.description} className={fieldInputClasses} />
      </FormField>

      <ImageUploader
        name="mainImage"
        label="产品主图（上传实拍图）"
        defaultValue={initialValues?.mainImage}
        recommendedSize="选择你拍摄的产品照片，建议使用 1:1 方图、1200×1200px；上传后可裁剪。"
        aspectRatio={1}
        minRecommendedSize={1000}
      />
      <VideoUploader name="videoUrl" label="产品视频（可选）" defaultValue={initialValues?.videoUrl} />
      <MultiImageUploader
        name="galleryImages"
        label="产品相册（可上传多张实拍图）"
        defaultValue={initialValues?.galleryImages}
        recommendedSize="可上传正面、侧面、细节、安装效果等多张照片；建议 1:1、1200×1200px。"
        aspectRatio={1}
        minRecommendedSize={1000}
        mobileVariantHint="通常不需要手机版图片，前台会自动适配屏幕。"
      />

      <FormField label="参数表" htmlFor="specsText" hint="每行一条，格式：标签: 值，例如 Daily Output: 50 GPD">
        <textarea id="specsText" name="specsText" rows={4} defaultValue={specsToText(initialValues?.specs)} className={fieldInputClasses} />
      </FormField>

      <FormField label="产品特点" htmlFor="featuresText" hint="每行一条">
        <textarea id="featuresText" name="featuresText" rows={4} defaultValue={featuresToText(initialValues?.features)} className={fieldInputClasses} />
      </FormField>

      <FormField label="应用场景" htmlFor="applicationsText" hint="每行一条，格式：标题: 描述">
        <textarea
          id="applicationsText"
          name="applicationsText"
          rows={4}
          defaultValue={applicationsToText(initialValues?.applications)}
          className={fieldInputClasses}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="包装信息" htmlFor="packagingInfo">
          <input id="packagingInfo" name="packagingInfo" defaultValue={initialValues?.packagingInfo ?? ''} className={fieldInputClasses} />
        </FormField>
        <FormField label="最小起订量 MOQ" htmlFor="moq">
          <input id="moq" name="moq" defaultValue={initialValues?.moq ?? ''} className={fieldInputClasses} />
        </FormField>
      </div>

      <FormField label="PDF 规格书地址（可选）" htmlFor="specSheetUrl">
        <input id="specSheetUrl" name="specSheetUrl" defaultValue={initialValues?.specSheetUrl ?? ''} className={fieldInputClasses} />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="上架状态" htmlFor="status">
          <select id="status" name="status" defaultValue={initialValues?.status ?? 'DRAFT'} className={fieldInputClasses}>
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">已发布</option>
          </select>
        </FormField>
        <div className="flex items-end gap-6 pb-2">
          <label className="flex items-center gap-2 text-sm text-navy-950">
            <input type="checkbox" name="featured" defaultChecked={initialValues?.featured} /> 首页推荐
          </label>
          <label className="flex items-center gap-2 text-sm text-navy-950">
            <input type="checkbox" name="oemOdmSupport" defaultChecked={initialValues?.oemOdmSupport ?? true} /> 支持 OEM/ODM
          </label>
        </div>
      </div>

      <ProductSeoEditor
        idPrefix=""
        title={initialValues?.seoTitle}
        description={initialValues?.seoDescription}
        keywords={initialValues?.seoKeywords}
        languageLabel="英文"
      />

      {state.message && <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-600'}`}>{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-water-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-water-600 disabled:opacity-60"
      >
        {pending ? '保存中...' : '保存'}
      </button>
    </form>
  );

  if (!translationAction) return englishForm;

  return (
    <Tabs defaultValue="en">
      <TabsList>
        <TabsTrigger value="en">English</TabsTrigger>
        <TabsTrigger value="es">Español</TabsTrigger>
      </TabsList>
      <TabsContent value="en">{englishForm}</TabsContent>
      <TabsContent value="es">
        <form action={esFormAction} className="max-w-3xl space-y-4">
          <TranslationMeta
            translationStatus={translation?.translationStatus}
            updatedAt={translation?.updatedAt}
            updatedBy={translation?.updatedBy}
          />

          <FormField label="产品名称（西班牙语）" htmlFor="es_name" hint={`英文原文：${initialValues?.name ?? ''}`}>
            <input id="es_name" name="name" defaultValue={translation?.name ?? ''} className={fieldInputClasses} />
          </FormField>

          <FormField
            label="简短描述（西班牙语）"
            htmlFor="es_shortDescription"
            hint={`英文原文：${initialValues?.shortDescription ?? ''}`}
          >
            <input id="es_shortDescription" name="shortDescription" defaultValue={translation?.shortDescription ?? ''} className={fieldInputClasses} />
          </FormField>

          <FormField label="详细描述（西班牙语 HTML）" htmlFor="es_description" hint="支持 HTML 标签；留空则前台自动显示英文原文">
            <textarea id="es_description" name="description" rows={6} defaultValue={translation?.description ?? ''} className={fieldInputClasses} />
          </FormField>
          {initialValues?.description && (
            <details className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <summary className="cursor-pointer font-medium text-muted-foreground">查看英文原文（详细描述）</summary>
              <div className="prose prose-sm mt-2 max-w-none" dangerouslySetInnerHTML={{ __html: initialValues.description }} />
            </details>
          )}

          <FormField label="参数表（西班牙语，仅译 label）" htmlFor="es_specsText" hint={`每行一条，格式：标签: 值。英文原文：\n${specsToText(initialValues?.specs)}`}>
            <textarea id="es_specsText" name="specsText" rows={4} defaultValue={specsToText(translation?.specs)} className={fieldInputClasses} />
          </FormField>

          <FormField label="产品特点（西班牙语）" htmlFor="es_featuresText" hint={`每行一条。英文原文：\n${featuresToText(initialValues?.features)}`}>
            <textarea id="es_featuresText" name="featuresText" rows={4} defaultValue={featuresToText(translation?.features)} className={fieldInputClasses} />
          </FormField>

          <FormField
            label="应用场景（西班牙语）"
            htmlFor="es_applicationsText"
            hint={`每行一条，格式：标题: 描述。英文原文：\n${applicationsToText(initialValues?.applications)}`}
          >
            <textarea
              id="es_applicationsText"
              name="applicationsText"
              rows={4}
              defaultValue={applicationsToText(translation?.applications)}
              className={fieldInputClasses}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="包装信息（西班牙语）" htmlFor="es_packagingInfo" hint={`英文原文：${initialValues?.packagingInfo ?? ''}`}>
              <input id="es_packagingInfo" name="packagingInfo" defaultValue={translation?.packagingInfo ?? ''} className={fieldInputClasses} />
            </FormField>
            <FormField label="MOQ（西班牙语）" htmlFor="es_moq" hint={`英文原文：${initialValues?.moq ?? ''}`}>
              <input id="es_moq" name="moq" defaultValue={translation?.moq ?? ''} className={fieldInputClasses} />
            </FormField>
          </div>

          <ProductSeoEditor
            idPrefix="es_"
            title={translation?.seoTitle}
            description={translation?.seoDescription}
            keywords={translation?.seoKeywords}
            languageLabel="西班牙语"
            sourceTitle={initialValues?.seoTitle}
            sourceDescription={initialValues?.seoDescription}
          />

          <FormField label="翻译发布状态" htmlFor="es_translationStatus">
            <select
              id="es_translationStatus"
              name="translationStatus"
              defaultValue={translation?.translationStatus ?? 'DRAFT'}
              className={fieldInputClasses}
            >
              <option value="DRAFT">草稿（前台不可见）</option>
              <option value="PUBLISHED">已发布（前台可见）</option>
            </select>
          </FormField>

          {esState.message && (
            <p className={`text-sm ${esState.success ? 'text-green-600' : 'text-red-600'}`}>{esState.message}</p>
          )}

          <button
            type="submit"
            disabled={esPending}
            className="rounded-md bg-water-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-water-600 disabled:opacity-60"
          >
            {esPending ? '保存中...' : '保存西班牙语'}
          </button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
