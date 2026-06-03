import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ImportExcelModal } from '../../components/ImportExcelModal';
import {
  academicApi,
  type Student,
  type StudentPayload,
} from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { formatDisplayDate } from '../../lib/date';
import { usePagination } from '../../lib/usePagination';
import { getStatusLabel } from '../../lib/statusLabels';
import { useToastStore } from '../../lib/toast-store';
import { commonLabels, menuLabels } from '../../lib/uiText';
import { PaginationBar } from '../../components/PaginationBar';
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

const genderLabels: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
};

const loadErrorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';

export const StudentsPage = () => {
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const canManage = user?.role === 'ACADEMIC_STAFF';
  const [students, setStudents] = useState<Student[]>([]);
  const { page, setPage, totalPages, slice: pageStudents } = usePagination(students, 20);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const data = await academicApi.getStudents({
        keyword: keyword.trim() || undefined,
        status: status || undefined,
      });
      setStudents(data);
    } catch (error) {
      setLoadError(loadErrorMessage);
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
        showToast('Cập nhật học sinh thành công.', 'success');
      } else {
        await academicApi.createStudent(payload);
        showToast('Thêm học sinh thành công.', 'success');
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
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {menuLabels.students}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Quản lý hồ sơ học sinh và trạng thái sẵn sàng phân lớp.
            </p>
          </div>

          {canManage ? (
            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Thêm học sinh
            </button>
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Import Excel
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
            className="h-10 w-56 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  <th className="px-4 py-3">Mã học sinh</th>
                  <th className="px-4 py-3">Họ tên</th>
                  <th className="px-4 py-3">Giới tính</th>
                  <th className="px-4 py-3">Ngày sinh</th>
                  <th className="px-4 py-3">{commonLabels.status}</th>
                  <th className="px-4 py-3">Lớp hiện tại</th>
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

                {!isLoading && students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? pageStudents.map((student) => {
                      const activeEnrollment = student.enrollments?.find(
                        (enrollment) => enrollment.status === 'ACTIVE',
                      );

                      return (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {student.studentCode}
                          </td>
                          <td className="px-4 py-3">{student.fullName}</td>
                          <td className="px-4 py-3">
                            {genderLabels[student.gender] ?? student.gender}
                          </td>
                          <td className="px-4 py-3">
                            {formatDisplayDate(student.dateOfBirth)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {getStatusLabel(student.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {activeEnrollment?.class?.name ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              {activeEnrollment?.classId ? (
                                <Link
                                  to={`/classes/${activeEnrollment.classId}`}
                                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  Lớp
                                </Link>
                              ) : null}
                              {canManage ? (
                                <button
                                  type="button"
                                  onClick={() => openEditForm(student)}
                                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                >
                                  {commonLabels.edit}
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
        )}
        <PaginationBar
          page={page}
          totalPages={totalPages}
          totalItems={students.length}
          pageSize={20}
          onPageChange={setPage}
        />
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingStudent ? 'Chỉnh sửa học sinh' : 'Thêm học sinh'}
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
      {showImportModal ? (
        <ImportExcelModal
          title="Import học sinh từ Excel"
          description="Tải file mẫu, điền dữ liệu rồi upload để xem trước và xác nhận."
          onClose={() => { setShowImportModal(false); void loadStudents(); }}
          onDownloadTemplate={() => academicApi.downloadStudentTemplate()}
          onPreview={(file) => academicApi.previewStudentImport(file)}
          onCommit={(rows) => academicApi.commitStudentImport(rows).then(() => undefined)}
        />
      ) : null}
    </section>
  );
};
