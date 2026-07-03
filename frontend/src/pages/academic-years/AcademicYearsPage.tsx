import { useCallback, useEffect, useState } from 'react';
import { academicApi, type AcademicYearPayload, type SchoolYear } from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { useToastStore } from '../../lib/toast-store';
import { AcademicYearForm } from './AcademicYearForm';

export const AcademicYearsPage = () => {
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.showToast);
  const canManage = user?.role === 'ACADEMIC_STAFF' || user?.role === 'ADMIN';

  const [years, setYears] = useState<SchoolYear[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<SchoolYear | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadYears = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await academicApi.getSchoolYears();
      setYears(data);
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void loadYears(); }, [loadYears]);

  const handleSubmit = async (payload: AcademicYearPayload) => {
    setIsSaving(true);
    try {
      if (editingItem) {
        await academicApi.updateAcademicYear(editingItem.id, payload);
        showToast('Cập nhật năm học thành công.', 'success');
      } else {
        await academicApi.createAcademicYear(payload);
        showToast('Tạo năm học thành công.', 'success');
      }
      setIsFormOpen(false);
      setEditingItem(null);
      await loadYears();
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('vi-VN') : '';

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Năm học</h2>
            <p className="mt-1 text-sm text-slate-600">Quản lý các năm học trong hệ thống.</p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => { setEditingItem(null); setIsFormOpen(true); }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Thêm năm học
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Tên năm học</th>
                <th className="px-4 py-3">Năm</th>
                <th className="px-4 py-3">Ngày bắt đầu</th>
                <th className="px-4 py-3">Ngày kết thúc</th>
                <th className="px-4 py-3">Số học kỳ</th>
                <th className="px-4 py-3">Trạng thái</th>
                {canManage && <th className="px-4 py-3 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
              )}
              {!isLoading && years.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Chưa có dữ liệu</td></tr>
              )}
              {!isLoading && years.map((y) => (
                <tr key={y.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{y.name}</td>
                  <td className="px-4 py-3 text-slate-600">{y.startYear}–{y.endYear}</td>
                  <td className="px-4 py-3">{formatDate(y.startDate)}</td>
                  <td className="px-4 py-3">{formatDate(y.endDate)}</td>
                  <td className="px-4 py-3">{y._count?.semesters ?? '—'}</td>
                  <td className="px-4 py-3">
                    {y.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Đang hoạt động</span>
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">Không hoạt động</span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => { setEditingItem(y); setIsFormOpen(true); }}
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
              {editingItem ? 'Chỉnh sửa năm học' : 'Thêm năm học'}
            </h3>
            <AcademicYearForm
              item={editingItem}
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
