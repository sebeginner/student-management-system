import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  academicApi,
  type Subject,
  type Teacher,
  type TeacherPayload,
} from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { usePagination } from '../../lib/usePagination';
import { getStatusLabel } from '../../lib/statusLabels';
import { useToastStore } from '../../lib/toast-store';
import { commonLabels, menuLabels } from '../../lib/uiText';
import { PaginationBar } from '../../components/PaginationBar';
import { TeacherForm } from './TeacherForm';

const statusOptions = ['', 'ACTIVE', 'INACTIVE'];
const loadErrorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';

export const TeachersPage = () => {
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const canManage = user?.role === 'ACADEMIC_STAFF';
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const { page, setPage, totalPages, slice: pageTeachers } = usePagination(teachers, 20);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadTeachers = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const data = await academicApi.getTeachers({
        keyword: keyword.trim() || undefined,
        status: status || undefined,
      });
      setTeachers(data);
    } catch (error) {
      setLoadError(loadErrorMessage);
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [keyword, showToast, status]);

  const loadSubjects = useCallback(async () => {
    try {
      const data = await academicApi.getSubjects();
      setSubjects(data.filter((subject) => subject.isActive));
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    }
  }, [showToast]);

  useEffect(() => {
    void loadTeachers();
    void loadSubjects();
  }, [loadSubjects, loadTeachers]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadTeachers();
  };

  const handleSubmit = async (payload: TeacherPayload) => {
    setIsSaving(true);

    try {
      if (editingTeacher) {
        await academicApi.updateTeacher(editingTeacher.id, payload);
        showToast('Cập nhật giáo viên thành công.', 'success');
      } else {
        await academicApi.createTeacher(payload);
        showToast('Thêm giáo viên thành công.', 'success');
      }

      setIsFormOpen(false);
      setEditingTeacher(null);
      await loadTeachers();
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
            <h2 className="text-2xl font-semibold text-slate-900">
              {menuLabels.teachers}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Xem và quản lý hồ sơ giáo viên.
            </p>
          </div>

          {canManage ? (
            <button
              type="button"
              onClick={() => {
                setEditingTeacher(null);
                setIsFormOpen(true);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Thêm giáo viên
            </button>
          ) : null}
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>{commonLabels.search}</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Mã, họ tên, email"
            className="h-10 w-64 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>{commonLabels.status}</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 w-48 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {statusOptions.map((option) => (
              <option key={option || 'ALL'} value={option}>
                {option ? getStatusLabel(option) : commonLabels.allStatuses}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {commonLabels.apply}
        </button>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        {loadError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm font-medium text-rose-700">
            {loadError}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Mã giáo viên</th>
                  <th className="px-4 py-3">Họ tên</th>
                  <th className="px-4 py-3">Môn phụ trách</th>
                  <th className="px-4 py-3">Thư điện tử</th>
                  <th className="px-4 py-3">Số điện thoại</th>
                  <th className="px-4 py-3">{commonLabels.status}</th>
                  <th className="px-4 py-3 text-right">{commonLabels.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : null}

                {!isLoading && teachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? pageTeachers.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {teacher.teacherCode}
                        </td>
                        <td className="px-4 py-3">{teacher.fullName}</td>
                        <td className="px-4 py-3">
                          {teacher.subject?.name ?? teacher.subjectId}
                        </td>
                        <td className="px-4 py-3">{teacher.email ?? '-'}</td>
                        <td className="px-4 py-3">{teacher.phone ?? '-'}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {getStatusLabel(teacher.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTeacher(teacher);
                                setIsFormOpen(true);
                              }}
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              {commonLabels.edit}
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar
          page={page}
          totalPages={totalPages}
          totalItems={teachers.length}
          pageSize={20}
          onPageChange={setPage}
        />
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingTeacher ? 'Chỉnh sửa giáo viên' : 'Thêm giáo viên'}
              </h3>
            </div>
            <TeacherForm
              teacher={editingTeacher}
              subjects={subjects}
              isSaving={isSaving}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingTeacher(null);
              }}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
};
