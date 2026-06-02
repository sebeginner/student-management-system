interface Props {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const PaginationBar = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: Props) => {
  if (totalItems === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 text-sm text-slate-600">
      <span>
        {from}–{to} / {totalItems} bản ghi
      </span>

      <div className="flex items-center gap-1">
        <PageButton
          label="«"
          disabled={page === 1}
          onClick={() => onPageChange(1)}
          title="Trang đầu"
        />
        <PageButton
          label="‹"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          title="Trang trước"
        />

        {buildPageRange(page, totalPages).map((item, i) =>
          item === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-slate-400">
              …
            </span>
          ) : (
            <PageButton
              key={item}
              label={String(item)}
              active={item === page}
              onClick={() => onPageChange(item as number)}
            />
          ),
        )}

        <PageButton
          label="›"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          title="Trang sau"
        />
        <PageButton
          label="»"
          disabled={page === totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Trang cuối"
        />
      </div>
    </div>
  );
};

const PageButton = ({
  label,
  active,
  disabled,
  onClick,
  title,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={[
      'flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-sm font-medium transition',
      active
        ? 'bg-blue-600 text-white'
        : disabled
          ? 'cursor-not-allowed text-slate-300'
          : 'text-slate-600 hover:bg-slate-100',
    ].join(' ')}
  >
    {label}
  </button>
);

const buildPageRange = (current: number, total: number) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);

  return pages;
};
