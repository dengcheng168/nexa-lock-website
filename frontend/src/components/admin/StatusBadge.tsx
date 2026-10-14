const styles: Record<string, string> = {
  PUBLISHED: 'bg-green-100 text-green-700',
  DRAFT: 'bg-grey-100 text-grey-700',
  NEW: 'bg-water-100 text-water-600',
  CONTACTED: 'bg-yellow-100 text-yellow-700',
  QUALIFIED: 'bg-green-100 text-green-700',
  QUOTED: 'bg-purple-100 text-purple-700',
  WON: 'bg-green-100 text-green-700',
  CLOSED: 'bg-grey-100 text-grey-700',
  SPAM: 'bg-red-100 text-red-700',
};

const labels: Record<string, string> = {
  PUBLISHED: '已发布',
  DRAFT: '草稿',
  NEW: '待处理',
  CONTACTED: '已联系',
  QUALIFIED: '有效客户',
  QUOTED: '已报价',
  WON: '已成交',
  CLOSED: '已关闭',
  SPAM: '垃圾询盘',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-grey-100 text-grey-700'}`}>
      {labels[status] ?? status}
    </span>
  );
}
