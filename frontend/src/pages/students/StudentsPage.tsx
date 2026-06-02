import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  academicApi,
  type Student,
  type StudentPayload,
} from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { formatDisplayDate } from '../../lib/date';
import { useToastStore } from '../../lib/toast-store';
import { StudentForm } from './StudentForm';

const statusOptions = [
  '',
  'PENDING_CLASS_ASSIGNMENT',
  'ACTIVE',
  'SUSPENDED',
  'TRANSFERRED',
  'GRADUATED',
  'INACTIVE',
];

export const StudentsPage = () => {
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const canManage = user?.role === 'ACADEMIC_STAFF';
  const [students, setStudents] = useState<Student[]>([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await academicApi.getStudents({
        keyword: keyword.trim() || undefined,
        status: status || undefined,
      });
      setStudents(data);
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [keyword, showToast, status]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadStudents();
  };

  const handleSubmit = async (payload: StudentPayload) => {
    setIsSaving(true);

    try {
      if (editingStudent) {
        await academicApi.updateStudent(editingStudent.id, payload);
        showToast('Student updated successfully.', 'success');
      } else {
        await academicApi.createStudent(payload);
        showToast('Student created successfully.', 'success');
      }

      setIsFormOpen(false);
      setEditingStudent(null);
      await loadStudents();
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateForm = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  const openEditForm = (student: Student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Students</h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage student records and class assignment readiness.
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={openCreateForm}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            New student
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
            className="w-56 rounded border border-slate-300 px-3 py-2 text-sm"
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
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Birth date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Current class</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading students...
                </td>
              </tr>
            ) : null}

            {!isLoading && students.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No students found.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? students.map((student) => {
                  const activeEnrollment = student.enrollments?.find(
                    (enrollment) => enrollment.status === 'ACTIVE',
                  );

                  return (
                    <tr key={student.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {student.studentCode}
                      </td>
                      <td className="px-4 py-3">{student.fullName}</td>
                      <td className="px-4 py-3">{student.gender}</td>
                      <td className="px-4 py-3">
                        {formatDisplayDate(student.dateOfBirth)}
                      </td>
                      <td className="px-4 py-3">{student.status}</td>
                      <td className="px-4 py-3">
                        {activeEnrollment?.class?.name ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {activeEnrollment?.classId ? (
                            <Link
                              to={`/classes/${activeEnrollment.classId}`}
                              className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                            >
                              Class
                            </Link>
                          ) : null}
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => openEditForm(student)}
                              className="rounded border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700"
                            >
                              Edit
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded bg-white p-6 shadow-lg">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingStudent ? 'Edit student' : 'New student'}
              </h3>
            </div>
            <StudentForm
              student={editingStudent}
              isSaving={isSaving}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingStudent(null);
              }}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
};
