import { useCallback, useEffect, useState } from 'react';
import { academicApi, type Subject, type SubjectPayload } from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { useToastStore } from '../../lib/toast-store';
import { SubjectForm } from './SubjectForm';

export const SubjectsPage = () => {
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.showToast);
  const canManage = user?.role === 'ACADEMIC_STAFF' || user?.role === 'ADMIN';

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<Subject | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadSubjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await academicApi.getSubjects();
      setSubjects(data);
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void loadSubjects(); }, [loadSubjects]);

  const handleSubmit = async (payload: SubjectPayload) => {
    setIsSaving(true);
    try {
      if (editingItem) {
        await academicApi.updateSubject(editingItem.id, payload);
        showToast('Cập nhật môn học thành công.', 'success');
      } else {
        await academicApi.createSubject(payload);
        showToast('Tạo môn học thành công.', 'success');
      }
      setIsFormOpen(false);
      setEditingItem(null);
      await loadSubjects();
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
            <h2 className="text-2xl font-semibold text-slate-900">Môn học</h2>
            <p className="mt-1 text-sm text-slate-600">Quản lý các môn học trong hệ thống.</p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => { setEditingItem(null); setIsFormOpen(true); }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Thêm môn học
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Mã môn</th>
                <th className="px-4 py-3">Tên môn học</th>
                <th className="px-4 py-3">Hệ số</th>
                <th className="px-4 py-3">Giáo viên</th>
                <th className="px-4 py-3">Trạng thái</th>
                {canManage && <th className="px-4 py-3 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
              )}
              {!isLoading && subjects.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Chưa có dữ liệu</td></tr>
              )}
              {!isLoading && subjects.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.subjectCode}</td>
                  <td className="px-4 py-3 text-slate-600">{s.name}</td>
                  <td className="px-4 py-3">{s.coefficient}</td>
                  <td className="px-4 py-3">{s._count?.teachers ?? '—'}</td>
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
              {editingItem ? 'Chỉnh sửa môn học' : 'Thêm môn học'}
            </h3>
            <SubjectForm
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
