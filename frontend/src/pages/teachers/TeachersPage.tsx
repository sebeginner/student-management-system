import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  academicApi,
  type Subject,
  type Teacher,
  type TeacherPayload,
} from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { useToastStore } from '../../lib/toast-store';
import { TeacherForm } from './TeacherForm';

const statusOptions = ['', 'ACTIVE', 'INACTIVE'];

export const TeachersPage = () => {
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const canManage = user?.role === 'ACADEMIC_STAFF';
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadTeachers = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await academicApi.getTeachers({
        keyword: keyword.trim() || undefined,
        status: status || undefined,
      });
      setTeachers(data);
    } catch (error) {
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
        showToast('Teacher updated successfully.', 'success');
      } else {
        await academicApi.createTeacher(payload);
        showToast('Teacher created successfully.', 'success');
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Teachers</h2>
          <p className="mt-1 text-sm text-slate-600">
            View teachers and maintain teacher profiles.
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => {
              setEditingTeacher(null);
              setIsFormOpen(true);
            }}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            New teacher
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
            placeholder="Code, name, email"
            className="w-64 rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-48 rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option || 'ALL'} value={option}>
                {option || 'All statuses'}
              </option>
            ))}
          </select>
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
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading teachers...
                </td>
              </tr>
            ) : null}

            {!isLoading && teachers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No teachers found.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {teacher.teacherCode}
                    </td>
                    <td className="px-4 py-3">{teacher.fullName}</td>
                    <td className="px-4 py-3">
                      {teacher.subject?.name ?? teacher.subjectId}
                    </td>
                    <td className="px-4 py-3">{teacher.email ?? '-'}</td>
                    <td className="px-4 py-3">{teacher.phone ?? '-'}</td>
                    <td className="px-4 py-3">{teacher.status}</td>
                    <td className="px-4 py-3 text-right">
                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTeacher(teacher);
                            setIsFormOpen(true);
                          }}
                          className="rounded border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700"
                        >
                          Edit
                        </button>
                      ) : null}
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
                {editingTeacher ? 'Edit teacher' : 'New teacher'}
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
