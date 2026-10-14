import Link from 'next/link';
import { adminFetch } from '@/lib/api/admin-client';
import { AdminTable, AdminTableHead, AdminEmptyRow } from '@/components/admin/AdminTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { PageHeader } from '@/components/admin/PageHeader';

interface Row {
  id: number;
  name: string;
  company: string | null;
  email: string;
  status: string;
  pageLanguage: string | null;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'NEW', label: '待处理' },
  { value: 'CONTACTED', label: '已联系' },
  { value: 'QUALIFIED', label: '有效客户' },
  { value: 'QUOTED', label: '已报价' },
  { value: 'WON', label: '已成交' },
  { value: 'CLOSED', label: '已关闭' },
  { value: 'SPAM', label: '垃圾询盘' },
];

const LANGUAGE_OPTIONS = [
  { value: '', label: '全部语言' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];

function languageLabel(pageLanguage: string | null) {
  if (pageLanguage === 'es') return 'Español';
  if (pageLanguage === 'en') return 'English';
  return '—'; // 本字段上线前的历史询盘，没有记录语言
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sourcePage?: string; pageLanguage?: string }>;
}) {
  const { status, sourcePage, pageLanguage } = await searchParams;
  const qs =
    (status ? `&status=${encodeURIComponent(status)}` : '') +
    (sourcePage ? `&sourcePage=${encodeURIComponent(sourcePage)}` : '') +
    (pageLanguage ? `&pageLanguage=${encodeURIComponent(pageLanguage)}` : '');
  const { data } = await adminFetch<Row[]>(`/inquiries?pageSize=100${qs}`);

  const exportParams = new URLSearchParams();
  if (status) exportParams.set('status', status);
  if (pageLanguage) exportParams.set('pageLanguage', pageLanguage);
  const exportQs = exportParams.toString();

  const buildFilterHref = (next: { status?: string; pageLanguage?: string }) => {
    const params = new URLSearchParams();
    const nextStatus = next.status ?? status;
    const nextLanguage = next.pageLanguage ?? pageLanguage;
    if (nextStatus) params.set('status', nextStatus);
    if (nextLanguage) params.set('pageLanguage', nextLanguage);
    const s = params.toString();
    return s ? `/admin/inquiries?${s}` : '/admin/inquiries';
  };

  return (
    <div>
      <PageHeader
        title="询盘管理"
        description={sourcePage ? `来源页面「${sourcePage}」的询盘，共 ${data.length} 条。` : '查看并跟进客户询盘，支持按状态、语言筛选与导出。'}
        action={
          <a
            href={`/auth/admin/inquiries/export${exportQs ? `?${exportQs}` : ''}`}
            className="rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F6F7F9]"
          >
            导出 CSV
          </a>
        }
      />

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={buildFilterHref({ status: opt.value })}
            className={`rounded-full px-3 py-1.5 text-sm ${
              (status ?? '') === opt.value ? 'bg-navy-900 text-white' : 'bg-grey-100 text-grey-700 hover:bg-grey-200'
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {LANGUAGE_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={buildFilterHref({ pageLanguage: opt.value })}
            className={`rounded-full px-3 py-1.5 text-sm ${
              (pageLanguage ?? '') === opt.value ? 'bg-water-600 text-white' : 'bg-grey-100 text-grey-700 hover:bg-grey-200'
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <AdminTable>
          <AdminTableHead columns={['姓名', '公司', '邮箱', '语言', '状态', '提交时间', '操作']} />
          <tbody>
            {data.length === 0 && <AdminEmptyRow colSpan={7} />}
            {data.map((row) => (
              <tr key={row.id} className="border-b border-grey-100 last:border-none">
                <td className="px-4 py-3 font-medium text-navy-950">{row.name}</td>
                <td className="px-4 py-3 text-grey-500">{row.company ?? '-'}</td>
                <td className="px-4 py-3 text-grey-500">{row.email}</td>
                <td className="px-4 py-3 text-grey-500">{languageLabel(row.pageLanguage)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-grey-500">{new Date(row.createdAt).toLocaleString('zh-CN')}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/inquiries/${row.id}`} className="text-water-600 hover:underline">
                    查看
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </div>
    </div>
  );
}
