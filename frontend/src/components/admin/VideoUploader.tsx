'use client';

import { useState } from 'react';
import { resolveMediaUrl } from '@/lib/utils/media';
import { getYoutubeEmbedUrl } from '@/lib/utils/youtube';

const ACCEPTED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export function VideoUploader({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
}) {
  const [url, setUrl] = useState(defaultValue ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const youtubeUrl = getYoutubeEmbedUrl(url);

  async function upload(file: File) {
    setError(null);
    if (!ACCEPTED_VIDEO_TYPES.has(file.type)) {
      setError('请选择 MP4、WebM 或 MOV 视频');
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      setError('视频不能超过 100MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);
      const response = await fetch('/api/admin/media/upload', { method: 'POST', body: formData });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setError(body?.error?.message ?? '视频上传失败');
        return;
      }
      setUrl(body.data.url);
    } catch {
      setError('视频上传失败，请检查网络连接');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-navy-950">{label}</label>
      <p className="mb-3 text-xs leading-5 text-grey-500">
        上传视频后会自动放在产品图库第一位。支持 MP4、WebM、MOV，最大 100MB；也可以粘贴 YouTube 或视频外链。
      </p>
      <input type="hidden" name={name} value={url} />

      <div className="rounded-md border border-grey-200 bg-grey-50 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-navy-950 px-5 text-sm font-semibold text-white hover:bg-navy-900">
            {uploading ? '正在上传…' : '选择视频上传'}
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void upload(file);
              }}
            />
          </label>
          <span className="text-xs text-grey-500">或</span>
          <input
            type="text"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setError(null);
            }}
            placeholder="粘贴 YouTube 或视频地址"
            aria-label="视频地址"
            className="h-10 min-w-0 flex-1 rounded-md border border-grey-300 bg-white px-3 text-sm text-navy-950 outline-none focus:border-water-500 focus:ring-2 focus:ring-water-100"
          />
          {url && (
            <button type="button" onClick={() => setUrl('')} className="text-sm text-red-600 hover:underline">
              移除
            </button>
          )}
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {url && (
          <div className="mt-4 aspect-video max-w-xl overflow-hidden rounded-md bg-black">
            {youtubeUrl ? (
              <iframe
                src={`${youtubeUrl}?rel=0`}
                title="产品视频预览"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video src={resolveMediaUrl(url)} className="h-full w-full object-contain" controls playsInline preload="metadata" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
