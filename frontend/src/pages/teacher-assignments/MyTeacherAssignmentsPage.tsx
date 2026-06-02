import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  academicApi,
  type TeacherAssignment,
} from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { getStatusLabel } from '../../lib/statusLabels';
import { useToastStore } from '../../lib/toast-store';
import { menuLabels } from '../../lib/uiText';

const AssignmentCard = ({ assignment }: { assignment: TeacherAssignment }) => {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            {assignment.class?.name ?? `Lớp ${assignment.classId}`}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            {assignment.schoolYear?.name ?? assignment.schoolYearId}
            {assignment.semester ? ` - ${assignment.semester.name}` : ''}
          </div>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {getStatusLabel(assignment.isActive ? 'ACTIVE' : 'INACTIVE')}
        </span>
      </div>

      {assignment.assignmentType === 'SUBJECT' ? (
        <div className="mt-3 text-sm text-slate-700">
          Môn học: {assignment.subject?.name ?? assignment.subjectId}
        </div>
      ) : null}
    </div>
  );
};

export const MyTeacherAssignmentsPage = () => {
  const showToast = useToastStore((state) => state.showToast);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAssignments = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await academicApi.getMyTeacherAssignments();
      setAssignments(data);
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const homeroomAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          assignment.assignmentType === 'HOMEROOM' && assignment.isActive,
      ),
    [assignments],
  );
  const subjectAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          assignment.assignmentType === 'SUBJECT' && assignment.isActive,
      ),
    [assignments],
  );

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          {menuLabels.myAssignments}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Xem lớp chủ nhiệm và các lớp bộ môn được phân công cho bạn.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Đang tải phân công...
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Lớp chủ nhiệm
          </h3>
          {homeroomAssignments.length === 0 && !isLoading ? (
            <div className="rounded border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
              Chưa có phân công chủ nhiệm đang hiệu lực.
            </div>
          ) : null}
          {homeroomAssignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Lớp bộ môn
          </h3>
          {subjectAssignments.length === 0 && !isLoading ? (
            <div className="rounded border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
              Chưa có phân công bộ môn đang hiệu lực.
            </div>
          ) : null}
          {subjectAssignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </section>
      </div>
    </section>
  );
};
