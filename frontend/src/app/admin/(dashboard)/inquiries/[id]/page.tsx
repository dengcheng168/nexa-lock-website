import { notFound } from 'next/navigation';
import { adminFetch } from '@/lib/api/admin-client';
import { InquiryDetailForm } from './InquiryDetailForm';

interface InquiryDetail {
  id: number;
  name: string;
  company: string | null;
  country: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  productName: string | null;
  product?: { name: string; slug: string } | null;
  quantity: string | null;
  message: string | null;
  sourcePage: string | null;
  pageLanguage: string | null;
  status: string;
  adminNotes: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface MetaEventLog {
  id: number;
  summary: string;
  result: 'SUCCESS' | 'FAILURE';
  metadata: string | null;
  createdAt: string;
}

function metaEventName(metadata: string | null) {
  if (!metadata) return '-';
  try {
    const parsed = JSON.parse(metadata) as { eventName?: string; inquiryStatus?: string };
    return parsed.eventName ?? parsed.inquiryStatus ?? '-';
  } catch {
    return '-';
  }
}

function languageLabel(pageLanguage: string | null) {
  if (pageLanguage === 'es') return 'Español';
  if (pageLanguage === 'en') return 'English';
  return '未记录（本字段上线前的历史询盘）';
}

export default async function AdminInquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [result, metaLogsResult] = await Promise.all([
    adminFetch<InquiryDetail>(`/inquiries/${id}`).catch(() => null),
    adminFetch<MetaEventLog[]>(`/inquiries/${id}/meta-events`).catch(() => ({ data: [] })),
  ]);
  if (!result) notFound();
  const inquiry = result.data;

  const rows: [string, string | null][] = [
    ['姓名', inquiry.name],
    ['公司', inquiry.company],
    ['国家/地区', inquiry.country],
    ['邮箱', inquiry.email],
    ['电话', inquiry.phone],
    ['WhatsApp', inquiry.whatsapp],
    ['感兴趣的产品', inquiry.product?.name ?? inquiry.productName],
    ['采购数量', inquiry.quantity],
    ['留言', inquiry.message],
    ['来源页面', inquiry.sourcePage],
    ['来源语言', languageLabel(inquiry.pageLanguage)],
    ['提交 IP', inquiry.ipAddress],
    ['提交时间', new Date(inquiry.createdAt).toLocaleString('zh-CN')],
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy-950">询盘详情</h1>

      <dl className="mt-6 max-w-xl divide-y divide-grey-100 rounded-lg border border-grey-200 bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="flex px-4 py-3 text-sm">
            <dt className="w-32 shrink-0 text-grey-500">{label}</dt>
            <dd className="text-navy-950">{value || '-'}</dd>
          </div>
        ))}
      </dl>

      <InquiryDetailForm id={inquiry.id} status={inquiry.status} adminNotes={inquiry.adminNotes} />

      <section className="mt-8 max-w-3xl">
        <h2 className="text-lg font-semibold text-navy-950">Meta 服务器回传记录</h2>
        <p className="mt-1 text-sm text-grey-500">仅记录事件名、结果和时间，不保存 Meta 访问令牌或明文客户资料。</p>
        <div className="mt-3 overflow-hidden rounded-lg border border-grey-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-grey-50 text-grey-500">
              <tr>
                <th className="px-4 py-3">时间</th><th className="px-4 py-3">事件</th>
                <th className="px-4 py-3">结果</th><th className="px-4 py-3">说明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-100">
              {metaLogsResult.data.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-grey-500">暂无回传记录</td></tr>
              )}
              {metaLogsResult.data.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-grey-500">{new Date(log.createdAt).toLocaleString('zh-CN')}</td>
                  <td className="px-4 py-3 text-navy-950">{metaEventName(log.metadata)}</td>
                  <td className={`px-4 py-3 font-medium ${log.result === 'SUCCESS' ? 'text-green-700' : 'text-red-700'}`}>
                    {log.result === 'SUCCESS' ? '成功' : '失败'}
                  </td>
                  <td className="px-4 py-3 text-grey-500">{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
