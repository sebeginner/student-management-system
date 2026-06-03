import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  academicApi,
  type ClassPayload,
  type GradeLevel,
  type SchoolClass,
  type SchoolYear,
} from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { getStatusLabel } from '../../lib/statusLabels';
import { useToastStore } from '../../lib/toast-store';
import { commonLabels, menuLabels } from '../../lib/uiText';
import { ClassForm } from './ClassForm';

const loadErrorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';

export const ClassesPage = () => {
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const canManage = user?.role === 'ACADEMIC_STAFF';
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadClasses = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const data = await academicApi.getClasses({
        keyword: keyword.trim() || undefined,
      });
      setClasses(data);
    } catch (error) {
      setLoadError(loadErrorMessage);
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [keyword, showToast]);

  const loadMasterData = useCallback(async () => {
    try {
      const [yearData, gradeData] = await Promise.all([
        academicApi.getSchoolYears(),
        academicApi.getGradeLevels(),
      ]);

      setSchoolYears(yearData);
      setGradeLevels(gradeData.filter((grade) => grade.isActive));
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    }
  }, [showToast]);

  useEffect(() => {
    void loadClasses();
    void loadMasterData();
  }, [loadClasses, loadMasterData]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadClasses();
  };

  const handleSubmit = async (payload: ClassPayload) => {
    setIsSaving(true);

    try {
      if (editingClass) {
        await academicApi.updateClass(editingClass.id, payload);
        showToast('Cập nhật lớp học thành công.', 'success');
      } else {
        await academicApi.createClass(payload);
        showToast('Tạo lớp học thành công.', 'success');
      }

      setIsFormOpen(false);
      setEditingClass(null);
      await loadClasses();
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateForm = () => {
    setEditingClass(null);
    setIsFormOpen(true);
  };

  const openEditForm = (classItem: SchoolClass) => {
    setEditingClass(classItem);
    setIsFormOpen(true);
  };

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {menuLabels.classes}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Xem lớp học, sĩ số, khối lớp và năm học.
            </p>
          </div>

          {canManage ? (
            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Thêm lớp
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
            placeholder="Tên lớp hoặc mã lớp"
            className="h-10 w-64 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
        {loadError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm font-medium text-rose-700">
            {loadError}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Lớp</th>
                  <th className="px-4 py-3">Mã lớp</th>
                  <th className="px-4 py-3">Khối</th>
                  <th className="px-4 py-3">Năm học</th>
                  <th className="px-4 py-3">Sĩ số</th>
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

                {!isLoading && classes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? classes.map((classItem) => (
                      <tr key={classItem.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {classItem.name}
                        </td>
                        <td className="px-4 py-3">{classItem.classCode}</td>
                        <td className="px-4 py-3">
                          {classItem.gradeLevel?.name ?? classItem.gradeLevelId}
                        </td>
                        <td className="px-4 py-3">
                          {classItem.schoolYear?.name ?? classItem.schoolYearId}
                        </td>
                        <td className="px-4 py-3">
                          {classItem.currentSize}/{classItem.maxSize}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {getStatusLabel(classItem.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/classes/${classItem.id}`}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              {commonLabels.detail}
                            </Link>
                            {canManage ? (
                              <button
                                type="button"
                                onClick={() => openEditForm(classItem)}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                {commonLabels.edit}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingClass ? 'Chỉnh sửa lớp học' : 'Thêm lớp học'}
              </h3>
            </div>
            <ClassForm
              classItem={editingClass}
              gradeLevels={gradeLevels}
              isSaving={isSaving}
              schoolYears={schoolYears}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingClass(null);
              }}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
};
