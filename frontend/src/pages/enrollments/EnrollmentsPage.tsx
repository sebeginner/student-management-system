import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  academicApi,
  type SchoolClass,
  type Semester,
  type Student,
} from '../../lib/academic-api';
import { getApiErrorKey, getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { useToastStore } from '../../lib/toast-store';
import { menuLabels } from '../../lib/uiText';

const assignmentErrorMessages: Record<string, string> = {
  CLASS_FULL: 'Lớp đã đủ sĩ số. Vui lòng chọn lớp khác.',
  STUDENT_ALREADY_ENROLLED: 'Học sinh đã có lớp đang hiệu lực trong học kỳ này.',
};

const transferErrorMessages: Record<string, string> = {
  CLASS_FULL: 'Lớp đích đã đủ sĩ số. Vui lòng chọn lớp khác.',
  STUDENT_ALREADY_ENROLLED: 'Học sinh đang học trong lớp này.',
  INVALID_TRANSFER_DIFFERENT_GRADE: 'Chỉ được chuyển lớp trong cùng khối.',
  ENROLLMENT_NOT_FOUND: 'Không tìm thấy lớp đang hiệu lực của học sinh trong học kỳ này.',
};

const activeEnrollmentForSemester = (student: Student, semesterId: number) =>
  student.enrollments?.find(
    (enrollment) =>
      enrollment.status === 'ACTIVE' && enrollment.semesterId === semesterId,
  );

interface EnrollmentsPageProps {
  mode?: 'assign' | 'transfer';
}

export const EnrollmentsPage = ({ mode = 'assign' }: EnrollmentsPageProps) => {
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const canManage = user?.role === 'ACADEMIC_STAFF';
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semesterId, setSemesterId] = useState('');
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignClassId, setAssignClassId] = useState('');
  const [assignReason, setAssignReason] = useState('');
  const [transferStudentId, setTransferStudentId] = useState('');
  const [transferClassId, setTransferClassId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSemesterId = Number(semesterId);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [studentData, classData, semesterData] = await Promise.all([
        academicApi.getStudents(),
        academicApi.getClasses(),
        academicApi.getSemesters(),
      ]);

      setStudents(studentData);
      setClasses(classData);
      setSemesters(semesterData);

      if (!semesterId) {
        const activeSemester =
          semesterData.find((semester) => semester.isActive) ?? semesterData[0];
        setSemesterId(activeSemester ? String(activeSemester.id) : '');
      }
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [semesterId, showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const unassignedStudents = useMemo(() => {
    if (!selectedSemesterId) {
      return [];
    }

    return students.filter(
      (student) => !activeEnrollmentForSemester(student, selectedSemesterId),
    );
  }, [selectedSemesterId, students]);

  const assignedStudents = useMemo(() => {
    if (!selectedSemesterId) {
      return [];
    }

    return students.filter((student) =>
      activeEnrollmentForSemester(student, selectedSemesterId),
    );
  }, [selectedSemesterId, students]);

  const selectedTransferStudent = assignedStudents.find(
    (student) => student.id === Number(transferStudentId),
  );
  const currentEnrollment = selectedTransferStudent
    ? activeEnrollmentForSemester(selectedTransferStudent, selectedSemesterId)
    : undefined;
  const currentClass = classes.find(
    (classItem) => classItem.id === currentEnrollment?.classId,
  );
  const targetClasses = classes.filter(
    (classItem) =>
      classItem.id !== currentClass?.id &&
      classItem.gradeLevelId === currentClass?.gradeLevelId,
  );

  const handleAssign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await academicApi.assignEnrollment({
        studentId: Number(assignStudentId),
        classId: Number(assignClassId),
        semesterId: selectedSemesterId,
        reason: assignReason.trim() || undefined,
      });

      showToast('Phân lớp học sinh thành công.', 'success');
      setAssignStudentId('');
      setAssignClassId('');
      setAssignReason('');
      await loadData();
    } catch (error) {
      const errorKey = getApiErrorKey(error);
      showToast(
        errorKey ? assignmentErrorMessages[errorKey] ?? getApiErrorMessage(error) : getApiErrorMessage(error),
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransfer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await academicApi.transferEnrollment({
        studentId: Number(transferStudentId),
        fromClassId: currentEnrollment?.classId,
        toClassId: Number(transferClassId),
        semesterId: selectedSemesterId,
        reason: transferReason.trim() || undefined,
      });

      showToast('Chuyển lớp học sinh thành công.', 'success');
      setTransferStudentId('');
      setTransferClassId('');
      setTransferReason('');
      await loadData();
    } catch (error) {
      const errorKey = getApiErrorKey(error);
      showToast(
        errorKey ? transferErrorMessages[errorKey] ?? getApiErrorMessage(error) : getApiErrorMessage(error),
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle = mode === 'transfer' ? menuLabels.transfer : menuLabels.enrollments;
  const pageDescription =
    mode === 'transfer'
      ? 'Chuyển học sinh đang học sang lớp khác trong cùng khối.'
      : 'Phân học sinh chưa có lớp vào lớp học trong học kỳ.';

  if (!canManage) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900">{pageTitle}</h2>
        <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Bạn có thể xem dữ liệu học vụ, nhưng thao tác phân lớp và chuyển lớp
          chỉ dành cho Giáo vụ.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">{pageTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{pageDescription}</p>
      </div>

      <div className="rounded border border-slate-200 bg-white p-4">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Học kỳ</span>
          <select
            value={semesterId}
            onChange={(event) => {
              setSemesterId(event.target.value);
              setAssignStudentId('');
              setTransferStudentId('');
              setTransferClassId('');
            }}
            className="w-72 rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.schoolYear?.name ?? semester.schoolYearId} - {semester.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Đang tải dữ liệu phân lớp...
        </div>
      ) : null}

      {mode === 'assign' ? (
        <form
          onSubmit={handleAssign}
          className="max-w-xl space-y-4 rounded border border-slate-200 bg-white p-5"
        >
          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Học sinh chưa có lớp</span>
            <select
              required
              value={assignStudentId}
              onChange={(event) => setAssignStudentId(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Chọn học sinh</option>
              {unassignedStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.studentCode} - {student.fullName}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Lớp</span>
            <select
              required
              value={assignClassId}
              onChange={(event) => setAssignClassId(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Chọn lớp</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - {classItem.currentSize}/{classItem.maxSize}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Lý do</span>
            <textarea
              value={assignReason}
              onChange={(event) => setAssignReason(event.target.value)}
              className="min-h-20 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
          >
            Phân lớp học sinh
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleTransfer}
          className="max-w-xl space-y-4 rounded border border-slate-200 bg-white p-5"
        >
          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Học sinh đang học</span>
            <select
              required
              value={transferStudentId}
              onChange={(event) => {
                setTransferStudentId(event.target.value);
                setTransferClassId('');
              }}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Chọn học sinh</option>
              {assignedStudents.map((student) => {
                const activeEnrollment = activeEnrollmentForSemester(
                  student,
                  selectedSemesterId,
                );

                return (
                  <option key={student.id} value={student.id}>
                    {student.studentCode} - {student.fullName} -{' '}
                    {activeEnrollment?.class?.name ?? 'Lớp hiện tại'}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="rounded bg-slate-50 p-3 text-sm text-slate-600">
            Lớp hiện tại: <span className="font-medium">{currentClass?.name ?? '-'}</span>
          </div>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Lớp đích (cùng khối)</span>
            <select
              required
              value={transferClassId}
              onChange={(event) => setTransferClassId(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              disabled={!currentClass}
            >
              <option value="">Chọn lớp đích</option>
              {targetClasses.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - {classItem.currentSize}/{classItem.maxSize}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Lý do chuyển lớp *</span>
            <textarea
              required
              value={transferReason}
              onChange={(event) => setTransferReason(event.target.value)}
              className="min-h-20 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !currentClass}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
          >
            Chuyển lớp học sinh
          </button>
        </form>
      )}
    </section>
  );
};
