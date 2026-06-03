import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { academicApi, type AuditLogItem } from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { formatDisplayDate } from '../../lib/date';
import { useToastStore } from '../../lib/toast-store';
import { commonLabels } from '../../lib/uiText';

const ACTION_LABELS: Record<string, string> = {
  CREATE_STUDENT: 'Thêm học sinh',
  UPDATE_STUDENT: 'Sửa học sinh',
  ASSIGN_CLASS: 'Phân lớp',
  TRANSFER_CLASS: 'Chuyển lớp',
  LOCK_SCORE_SHEET: 'Khóa bảng điểm',
  UNLOCK_SCORE_SHEET: 'Mở khóa bảng điểm',
  APPROVE_SCORE_CHANGE_REQUEST: 'Duyệt sửa điểm',
  REJECT_SCORE_CHANGE_REQUEST: 'Từ chối sửa điểm',
  FINALIZE_CONDUCT: 'Chốt hạnh kiểm',
  FINALIZE_SEMESTER: 'Chốt điểm HK',
  GENERATE_YEAR_END: 'Tổng kết năm',
};

const ENTITY_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'Student', label: 'Học sinh' },
  { value: 'StudentClassEnrollment', label: 'Phân lớp / Chuyển lớp' },
  { value: 'ScoreSheet', label: 'Bảng điểm' },
  { value: 'ScoreChangeRequest', label: 'Yêu cầu sửa điểm' },
  { value: 'ConductAssessment', label: 'Hạnh kiểm' },
  { value: 'SemesterStudentResult', label: 'Kết quả HK' },
];

const PAGE_SIZE = 30;

const tryParseJson = (s: string | null): string => {
  if (!s) return '-';
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
};

export const AuditLogPage = () => {
  const showToast = useToastStore((state) => state.showToast);
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Filters
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async (p = 1) => {
    setIsLoading(true);
    try {
      const result = await academicApi.getAuditLogs({
        entityType: entityType || undefined,
        action: action.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
        page: p,
        limit: PAGE_SIZE,
      });
      setItems(result.items);
      setTotal(result.total);
      setPage(p);
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [entityType, action, from, to, showToast]);

  useEffect(() => { void load(1); }, [load]);

  const handleSearch = (e: FormEvent) => { e.preventDefault(); void load(1); };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from1 = (page - 1) * PAGE_SIZE + 1;
  const to1 = Math.min(page * PAGE_SIZE, total);

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Nhật ký hệ thống</h2>
        <p className="mt-1 text-sm text-slate-600">
          Lịch sử thay đổi: phân lớp, chuyển lớp, sửa điểm, khóa bảng điểm...
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Loại đối tượng</span>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="h-10 w-52 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
          >
            {ENTITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Hành động</span>
          <input
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="Ví dụ: TRANSFER_CLASS"
            className="h-10 w-48 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Từ ngày</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Đến ngày</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <button
          type="submit"
          className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {commonLabels.apply}
        </button>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
          {total > 0 ? <span>{from1}–{to1} / {total} bản ghi</span> : <span>Chưa có dữ liệu</span>}
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => void load(page - 1)} className="rounded px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-30">‹ Trước</button>
            <span className="px-2 py-1 text-xs">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => void load(page + 1)} className="rounded px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-30">Sau ›</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[860px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3 w-36">Thời gian</th>
                <th className="px-4 py-3">Người thực hiện</th>
                <th className="px-4 py-3">Hành động</th>
                <th className="px-4 py-3">Đối tượng</th>
                <th className="px-4 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{commonLabels.loading}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{commonLabels.noData}</td></tr>
              ) : items.map((item) => (
                <>
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDisplayDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {item.user ? (
                        <div>
                          <div className="font-medium text-slate-900">{item.user.fullName}</div>
                          <div className="text-xs text-slate-500">@{item.user.username}</div>
                        </div>
                      ) : <span className="text-slate-400">Hệ thống</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {ACTION_LABELS[item.action] ?? item.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="font-medium">{item.entityType}</span>
                      {item.entityId ? <span className="ml-1 text-slate-400">#{item.entityId}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(item.oldValue ?? item.newValue) ? (
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                          className="rounded border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          {expandedId === item.id ? 'Ẩn' : 'Xem'}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <tr key={`${item.id}-detail`} className="bg-slate-50">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {item.oldValue ? (
                            <div>
                              <div className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trước</div>
                              <pre className="overflow-auto rounded bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">{tryParseJson(item.oldValue)}</pre>
                            </div>
                          ) : null}
                          {item.newValue ? (
                            <div>
                              <div className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sau</div>
                              <pre className="overflow-auto rounded bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">{tryParseJson(item.newValue)}</pre>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
