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

const assignmentErrorMessages: Record<string, string> = {
  CLASS_FULL: 'Lop da du si so. Vui long chon lop khac.',
  STUDENT_ALREADY_ENROLLED: 'Hoc sinh da co lop active trong hoc ky nay.',
};

const transferErrorMessages: Record<string, string> = {
  CLASS_FULL: 'Lop dich da du si so. Vui long chon lop khac.',
  STUDENT_ALREADY_ENROLLED: 'Hoc sinh dang hoc trong lop nay.',
  INVALID_TRANSFER_DIFFERENT_GRADE: 'Chi duoc chuyen lop trong cung khoi.',
  ENROLLMENT_NOT_FOUND: 'Khong tim thay lop active cua hoc sinh trong hoc ky nay.',
};

const activeEnrollmentForSemester = (student: Student, semesterId: number) =>
  student.enrollments?.find(
    (enrollment) =>
      enrollment.status === 'ACTIVE' && enrollment.semesterId === semesterId,
  );

export const EnrollmentsPage = () => {
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

      showToast('Student assigned successfully.', 'success');
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

      showToast('Student transferred successfully.', 'success');
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

  if (!canManage) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900">Enrollments</h2>
        <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">
          You can view academic data, but class assignment and transfer actions
          are reserved for academic staff.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Enrollments</h2>
        <p className="mt-1 text-sm text-slate-600">
          Assign students to classes and transfer active students between classes.
        </p>
      </div>

      <div className="rounded border border-slate-200 bg-white p-4">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Semester</span>
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
          Loading enrollment data...
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <form
          onSubmit={handleAssign}
          className="space-y-4 rounded border border-slate-200 bg-white p-5"
        >
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Assign class</h3>
            <p className="mt-1 text-sm text-slate-600">
              Choose a student without active class in the selected semester.
            </p>
          </div>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Student</span>
            <select
              required
              value={assignStudentId}
              onChange={(event) => setAssignStudentId(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select student</option>
              {unassignedStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.studentCode} - {student.fullName}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Class</span>
            <select
              required
              value={assignClassId}
              onChange={(event) => setAssignClassId(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select class</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - {classItem.currentSize}/{classItem.maxSize}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Reason</span>
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
            Assign student
          </button>
        </form>

        <form
          onSubmit={handleTransfer}
          className="space-y-4 rounded border border-slate-200 bg-white p-5"
        >
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Transfer class</h3>
            <p className="mt-1 text-sm text-slate-600">
              Select an active student and a target class in the same grade.
            </p>
          </div>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Student</span>
            <select
              required
              value={transferStudentId}
              onChange={(event) => {
                setTransferStudentId(event.target.value);
                setTransferClassId('');
              }}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select student</option>
              {assignedStudents.map((student) => {
                const activeEnrollment = activeEnrollmentForSemester(
                  student,
                  selectedSemesterId,
                );

                return (
                  <option key={student.id} value={student.id}>
                    {student.studentCode} - {student.fullName} -{' '}
                    {activeEnrollment?.class?.name ?? 'Current class'}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="rounded bg-slate-50 p-3 text-sm text-slate-600">
            Current class: {currentClass?.name ?? '-'}
          </div>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Target class</span>
            <select
              required
              value={transferClassId}
              onChange={(event) => setTransferClassId(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              disabled={!currentClass}
            >
              <option value="">Select target class</option>
              {targetClasses.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - {classItem.currentSize}/{classItem.maxSize}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm font-medium text-slate-700">
            <span>Reason</span>
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
            Transfer student
          </button>
        </form>
      </div>
    </section>
  );
};
