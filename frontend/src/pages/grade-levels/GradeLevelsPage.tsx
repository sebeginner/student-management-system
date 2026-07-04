import { useCallback, useEffect, useState } from 'react';
import { academicApi, type GradeLevel, type GradeLevelPayload } from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { useToastStore } from '../../lib/toast-store';
import { GradeLevelForm } from './GradeLevelForm';

export const GradeLevelsPage = () => {
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.showToast);
  const canManage = user?.role === 'ACADEMIC_STAFF' || user?.role === 'ADMIN';

  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<GradeLevel | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadGradeLevels = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await academicApi.getGradeLevels();
      setGradeLevels(data);
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void loadGradeLevels(); }, [loadGradeLevels]);

  const handleSubmit = async (payload: GradeLevelPayload) => {
    setIsSaving(true);
    try {
      if (editingItem) {
        await academicApi.updateGradeLevel(editingItem.id, payload);
        showToast('Cập nhật khối lớp thành công.', 'success');
      } else {
        await academicApi.createGradeLevel(payload);
        showToast('Tạo khối lớp thành công.', 'success');
      }
      setIsFormOpen(false);
      setEditingItem(null);
      await loadGradeLevels();
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Khối lớp</h2>
            <p className="mt-1 text-sm text-slate-600">Quản lý các khối lớp trong hệ thống.</p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => { setEditingItem(null); setIsFormOpen(true); }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Thêm khối lớp
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Tên khối lớp</th>
                <th className="px-4 py-3">Khối</th>
                <th className="px-4 py-3">Số lớp</th>
                <th className="px-4 py-3">Trạng thái</th>
                {canManage && <th className="px-4 py-3 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
              )}
              {!isLoading && gradeLevels.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Chưa có dữ liệu</td></tr>
              )}
              {!isLoading && gradeLevels.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{g.name}</td>
                  <td className="px-4 py-3 text-slate-600">{g.level}</td>
                  <td className="px-4 py-3">{g._count?.classes ?? '—'}</td>
                  <td className="px-4 py-3">
                    {g.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Đang hoạt động</span>
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">Không hoạt động</span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => { setEditingItem(g); setIsFormOpen(true); }}
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
              {editingItem ? 'Chỉnh sửa khối lớp' : 'Thêm khối lớp'}
            </h3>
            <GradeLevelForm
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
