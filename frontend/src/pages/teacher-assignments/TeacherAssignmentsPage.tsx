import { useCallback, useEffect, useState } from 'react';
import {
  academicApi,
  type SchoolClass,
  type SchoolYear,
  type Semester,
  type Subject,
  type Teacher,
  type TeacherAssignment,
  type TeacherAssignmentPayload,
} from '../../lib/academic-api';
import { getApiErrorKey, getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { useToastStore } from '../../lib/toast-store';
import { TeacherAssignmentForm } from './TeacherAssignmentForm';

const assignmentErrorMessages: Record<string, string> = {
  HOMEROOM_ALREADY_ASSIGNED:
    'Lop da co giao vien chu nhiem active trong nam hoc nay.',
  SUBJECT_TEACHER_ALREADY_ASSIGNED:
    'Mon/lop/hoc ky da co giao vien bo mon active.',
  INVALID_HOMEROOM_ASSIGNMENT:
    'Phan cong GVCN khong duoc gan mon hoc hoac hoc ky.',
  INVALID_SUBJECT_ASSIGNMENT:
    'Phan cong GVBM bat buoc co mon hoc va hoc ky hop le.',
};

const assignmentTitle = (assignment: TeacherAssignment) => {
  if (assignment.assignmentType === 'HOMEROOM') {
    return 'GVCN';
  }

  return `GVBM ${assignment.subject?.name ?? assignment.subjectId}`;
};

export const TeacherAssignmentsPage = () => {
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const canManage = user?.role === 'ACADEMIC_STAFF';
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<TeacherAssignment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [
        assignmentData,
        teacherData,
        classData,
        schoolYearData,
        semesterData,
        subjectData,
      ] = await Promise.all([
        academicApi.getTeacherAssignments(),
        academicApi.getTeachers(),
        academicApi.getClasses(),
        academicApi.getSchoolYears(),
        academicApi.getSemesters(),
        academicApi.getSubjects(),
      ]);

      setAssignments(assignmentData);
      setTeachers(teacherData.filter((teacher) => teacher.status === 'ACTIVE'));
      setClasses(classData.filter((classItem) => classItem.status === 'ACTIVE'));
      setSchoolYears(schoolYearData);
      setSemesters(semesterData);
      setSubjects(subjectData.filter((subject) => subject.isActive));
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmit = async (payload: TeacherAssignmentPayload) => {
    setIsSaving(true);

    try {
      if (editingAssignment) {
        await academicApi.updateTeacherAssignment(editingAssignment.id, payload);
        showToast('Teacher assignment updated successfully.', 'success');
      } else {
        await academicApi.createTeacherAssignment(payload);
        showToast('Teacher assignment created successfully.', 'success');
      }

      setEditingAssignment(null);
      setIsFormOpen(false);
      await loadData();
    } catch (error) {
      const errorKey = getApiErrorKey(error);
      showToast(
        errorKey
          ? assignmentErrorMessages[errorKey] ?? getApiErrorMessage(error)
          : getApiErrorMessage(error),
        'error',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Teacher Assignments
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage homeroom and subject teacher assignments.
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => {
              setEditingAssignment(null);
              setIsFormOpen(true);
            }}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            New assignment
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">School year</th>
              <th className="px-4 py-3">Semester</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Loading assignments...
                </td>
              </tr>
            ) : null}

            {!isLoading && assignments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No assignments found.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {assignment.teacher?.fullName ?? assignment.teacherId}
                    </td>
                    <td className="px-4 py-3">{assignmentTitle(assignment)}</td>
                    <td className="px-4 py-3">
                      {assignment.class?.name ?? assignment.classId}
                    </td>
                    <td className="px-4 py-3">
                      {assignment.subject?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      {assignment.schoolYear?.name ?? assignment.schoolYearId}
                    </td>
                    <td className="px-4 py-3">
                      {assignment.semester?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      {assignment.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAssignment(assignment);
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
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded bg-white p-6 shadow-lg">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingAssignment ? 'Edit assignment' : 'New assignment'}
              </h3>
            </div>
            <TeacherAssignmentForm
              assignment={editingAssignment}
              classes={classes}
              isSaving={isSaving}
              schoolYears={schoolYears}
              semesters={semesters}
              subjects={subjects}
              teachers={teachers}
              onCancel={() => {
                setEditingAssignment(null);
                setIsFormOpen(false);
              }}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
};
