import { useCallback, useEffect, useState } from 'react';
import { academicApi, type Semester, type SemesterPayload, type SchoolYear } from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { useToastStore } from '../../lib/toast-store';
import { SemesterForm } from './SemesterForm';

export const SemestersPage = () => {
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.showToast);
  const canManage = user?.role === 'ACADEMIC_STAFF' || user?.role === 'ADMIN';

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [filterYearId, setFilterYearId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<Semester | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [semData, yearData] = await Promise.all([
        academicApi.getSemesters(),
        academicApi.getSchoolYears(),
      ]);
      setSemesters(semData);
      setSchoolYears(yearData);
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleSubmit = async (payload: SemesterPayload) => {
    setIsSaving(true);
    try {
      if (editingItem) {
        await academicApi.updateSemester(editingItem.id, payload);
        showToast('Cập nhật học kỳ thành công.', 'success');
      } else {
        await academicApi.createSemester(payload);
        showToast('Tạo học kỳ thành công.', 'success');
      }
      setIsFormOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '';

  const filtered = filterYearId
    ? semesters.filter(s => String(s.schoolYearId) === filterYearId)
    : semesters;

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Học kỳ</h2>
            <p className="mt-1 text-sm text-slate-600">Quản lý các học kỳ trong từng năm học.</p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => { setEditingItem(null); setIsFormOpen(true); }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Thêm học kỳ
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Năm học</span>
          <select
            value={filterYearId}
            onChange={e => setFilterYearId(e.target.value)}
            className="h-10 w-48 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Tất cả năm học</option>
            {schoolYears.map(sy => (
              <option key={sy.id} value={sy.id}>{sy.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Tên học kỳ</th>
                <th className="px-4 py-3">Năm học</th>
                <th className="px-4 py-3">Ngày bắt đầu</th>
                <th className="px-4 py-3">Ngày kết thúc</th>
                <th className="px-4 py-3">Bảng điểm</th>
                <th className="px-4 py-3">Trạng thái</th>
                {canManage && <th className="px-4 py-3 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Chưa có dữ liệu</td></tr>
              )}
              {!isLoading && filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-3">{s.schoolYear?.name ?? s.schoolYearId}</td>
                  <td className="px-4 py-3">{formatDate(s.startDate)}</td>
                  <td className="px-4 py-3">{formatDate(s.endDate)}</td>
                  <td className="px-4 py-3">{s._count?.scoreSheets ?? '—'}</td>
                  <td className="px-4 py-3">
                    {s.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Đang hoạt động</span>
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">Không hoạt động</span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => { setEditingItem(s); setIsFormOpen(true); }}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        Sửa
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              {editingItem ? 'Chỉnh sửa học kỳ' : 'Thêm học kỳ'}
            </h3>
            <SemesterForm
              item={editingItem}
              schoolYears={schoolYears}
              isSaving={isSaving}
              onCancel={() => { setIsFormOpen(false); setEditingItem(null); }}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      )}
    </section>
  );
};
