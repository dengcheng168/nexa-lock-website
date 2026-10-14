'use client';

import { useActionState } from 'react';
import { updateInquiryAction, deleteInquiryAction } from '@/lib/actions/admin/inquiries';
import { ConfirmSubmitButton } from '@/components/admin/ConfirmSubmitButton';
import { fieldInputClasses } from '@/components/admin/FormField';

const STATUS_OPTIONS = [
  { value: 'NEW', label: '待处理' },
  { value: 'CONTACTED', label: '已联系' },
  { value: 'QUALIFIED', label: '有效客户' },
  { value: 'QUOTED', label: '已报价' },
  { value: 'WON', label: '已成交' },
  { value: 'CLOSED', label: '已关闭' },
  { value: 'SPAM', label: '垃圾询盘' },
];

export function InquiryDetailForm({
  id,
  status,
  adminNotes,
}: {
  id: number;
  status: string;
  adminNotes: string | null;
}) {
  const boundAction = updateInquiryAction.bind(null, id);
  const [state, formAction, pending] = useActionState(boundAction, {});

  return (
    <div className="mt-8 max-w-xl space-y-6">
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-navy-950">
            处理状态
          </label>
          <select id="status" name="status" defaultValue={status} className={fieldInputClasses}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="adminNotes" className="mb-1 block text-sm font-medium text-navy-950">
            管理员备注
          </label>
          <textarea id="adminNotes" name="adminNotes" rows={4} defaultValue={adminNotes ?? ''} className={fieldInputClasses} />
        </div>
        {state.message && <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-600'}`}>{state.message}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-water-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-water-600 disabled:opacity-60"
        >
          {pending ? '保存中...' : '保存'}
        </button>
      </form>

      <form action={deleteInquiryAction}>
        <input type="hidden" name="id" value={id} />
        <ConfirmSubmitButton confirmMessage="确定要删除这条询盘吗？此操作不可恢复。" className="text-sm text-red-600 hover:underline">
          删除该询盘
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
