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
import { useToastStore } from '../../lib/toast-store';
import { ClassForm } from './ClassForm';

export const ClassesPage = () => {
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const canManage = user?.role === 'ACADEMIC_STAFF';
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadClasses = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await academicApi.getClasses({
        keyword: keyword.trim() || undefined,
      });
      setClasses(data);
    } catch (error) {
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
        showToast('Class updated successfully.', 'success');
      } else {
        await academicApi.createClass(payload);
        showToast('Class created successfully.', 'success');
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Classes</h2>
          <p className="mt-1 text-sm text-slate-600">
            View classes, capacity, grade level, and school year.
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={openCreateForm}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            New class
          </button>
        ) : null}
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-wrap items-end gap-3 rounded border border-slate-200 bg-white p-4"
      >
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Search</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Class name or code"
            className="w-64 rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <button
          type="submit"
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Apply
        </button>
      </form>

      <div className="overflow-hidden rounded border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">School year</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading classes...
                </td>
              </tr>
            ) : null}

            {!isLoading && classes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No classes found.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? classes.map((classItem) => (
                  <tr key={classItem.id}>
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
                    <td className="px-4 py-3">{classItem.status}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/classes/${classItem.id}`}
                          className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                        >
                          Detail
                        </Link>
                        {canManage ? (
                          <button
                            type="button"
                            onClick={() => openEditForm(classItem)}
                            className="rounded border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700"
                          >
                            Edit
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

      {isFormOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded bg-white p-6 shadow-lg">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingClass ? 'Edit class' : 'New class'}
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
