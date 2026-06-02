import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  academicApi,
  type SchoolClass,
  type SchoolYear,
  type Semester,
  type Subject,
  type Teacher,
  type TeacherAssignment,
  type TeacherAssignmentPayload,
  type TeacherAssignmentType,
} from '../../lib/academic-api';
import { getApiErrorKey, getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { getStatusLabel } from '../../lib/statusLabels';
import { useToastStore } from '../../lib/toast-store';
import { commonLabels, menuLabels } from '../../lib/uiText';
import { TeacherAssignmentForm } from './TeacherAssignmentForm';

const assignmentErrorMessages: Record<string, string> = {
  HOMEROOM_ALREADY_ASSIGNED:
    'Lớp đã có giáo viên chủ nhiệm đang hiệu lực trong năm học này.',
  SUBJECT_TEACHER_ALREADY_ASSIGNED:
    'Môn/lớp/học kỳ đã có giáo viên bộ môn đang hiệu lực.',
  INVALID_HOMEROOM_ASSIGNMENT:
    'Phân công chủ nhiệm không được gắn môn học hoặc học kỳ.',
  INVALID_SUBJECT_ASSIGNMENT:
    'Phân công bộ môn bắt buộc có môn học và học kỳ hợp lệ.',
};

const loadErrorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';

const assignmentTypeMeta: Record<
  TeacherAssignmentType,
  { label: string; className: string }
> = {
  HOMEROOM: {
    label: 'Chủ nhiệm',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  SUBJECT: {
    label: 'Bộ môn',
    className: 'border-violet-200 bg-violet-50 text-violet-700',
  },
};

interface AssignmentTableProps {
  assignments: TeacherAssignment[];
  canManage: boolean;
  description: string;
  isLoading: boolean;
  onEdit: (assignment: TeacherAssignment) => void;
  title: string;
}

const AssignmentTable = ({
  assignments,
  canManage,
  description,
  isLoading,
  onEdit,
  title,
}: AssignmentTableProps) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
        {assignments.length} phân công
      </span>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-[920px] divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
          <tr>
            <th className="px-4 py-3">Giáo viên</th>
            <th className="px-4 py-3">Loại phân công</th>
            <th className="px-4 py-3">Lớp</th>
            <th className="px-4 py-3">Môn học</th>
            <th className="px-4 py-3">Năm học</th>
            <th className="px-4 py-3">Học kỳ</th>
            <th className="px-4 py-3">{commonLabels.status}</th>
            <th className="px-4 py-3 text-right">{commonLabels.actions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                Đang tải dữ liệu...
              </td>
            </tr>
          ) : null}

          {!isLoading && assignments.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                Chưa có dữ liệu
              </td>
            </tr>
          ) : null}

          {!isLoading
            ? assignments.map((assignment) => {
                const typeMeta = assignmentTypeMeta[assignment.assignmentType];

                return (
                  <tr key={assignment.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {assignment.teacher?.fullName ?? assignment.teacherId}
                      </div>
                      <div className="text-xs text-slate-500">
                        {assignment.teacher?.teacherCode ?? ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${typeMeta.className}`}
                      >
                        {typeMeta.label}
                      </span>
                    </td>
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
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {getStatusLabel(
                          assignment.isActive ? 'ACTIVE' : 'INACTIVE',
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => onEdit(assignment)}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          {commonLabels.edit}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            : null}
        </tbody>
      </table>
    </div>
  </div>
);

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
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<TeacherAssignment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const homeroomAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) => assignment.assignmentType === 'HOMEROOM',
      ),
    [assignments],
  );
  const subjectAssignments = useMemo(
    () =>
      assignments.filter((assignment) => assignment.assignmentType === 'SUBJECT'),
    [assignments],
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

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
      setLoadError(loadErrorMessage);
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
        showToast('Cập nhật phân công thành công.', 'success');
      } else {
        await academicApi.createTeacherAssignment(payload);
        showToast('Tạo phân công thành công.', 'success');
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

  const openEditForm = (assignment: TeacherAssignment) => {
    setEditingAssignment(assignment);
    setIsFormOpen(true);
  };

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {menuLabels.teacherAssignments}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              GVCN và GVBM là các phân công của tài khoản Giáo viên, không phải
              hai loại tài khoản riêng.
            </p>
          </div>

          {canManage ? (
            <button
              type="button"
              onClick={() => {
                setEditingAssignment(null);
                setIsFormOpen(true);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Thêm phân công
            </button>
          ) : null}
        </div>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm font-medium text-rose-700">
          {loadError}
        </div>
      ) : (
        <>
          <AssignmentTable
            assignments={homeroomAssignments}
            canManage={canManage}
            description="Một lớp chỉ có một giáo viên chủ nhiệm đang hiệu lực trong năm học."
            isLoading={isLoading}
            onEdit={openEditForm}
            title="Giáo viên chủ nhiệm"
          />

          <AssignmentTable
            assignments={subjectAssignments}
            canManage={canManage}
            description="Phân công giáo viên bộ môn theo lớp, môn học và học kỳ."
            isLoading={isLoading}
            onEdit={openEditForm}
            title="Giáo viên bộ môn"
          />
        </>
      )}

      {isFormOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingAssignment ? 'Chỉnh sửa phân công' : 'Thêm phân công'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Chọn giáo viên có role Giáo viên, sau đó gán phạm vi chủ nhiệm
                hoặc bộ môn phù hợp.
              </p>
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
