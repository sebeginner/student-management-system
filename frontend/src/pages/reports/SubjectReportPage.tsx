import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  academicApi,
  type SubjectSummaryReport,
  type TeacherAssignment,
} from '../../lib/academic-api';
import { useToastStore } from '../../lib/toast-store';
import { formatNumber, getReportErrorMessage } from './report-utils';

export const SubjectReportPage = () => {
  const showToast = useToastStore((state) => state.showToast);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [assignmentId, setAssignmentId] = useState('');
  const [includeUnOfficial, setIncludeUnOfficial] = useState(false);
  const [report, setReport] = useState<SubjectSummaryReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const subjectAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          assignment.assignmentType === 'SUBJECT' && assignment.isActive,
      ),
    [assignments],
  );
  const selectedAssignment = subjectAssignments.find(
    (assignment) => assignment.id === Number(assignmentId),
  );

  const loadData = useCallback(async () => {
    try {
      const data = await academicApi.getMyTeacherAssignments();
      const subjects = data.filter(
        (assignment) =>
          assignment.assignmentType === 'SUBJECT' && assignment.isActive,
      );
      setAssignments(data);
      setAssignmentId((current) => current || String(subjects[0]?.id ?? ''));
    } catch (error) {
      showToast(getReportErrorMessage(error), 'error');
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const loadReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !selectedAssignment ||
      !selectedAssignment.subjectId ||
      !selectedAssignment.semesterId
    ) {
      return;
    }

    setIsLoading(true);

    try {
      const data = await academicApi.getSubjectSummaryReport({
        classId: selectedAssignment.classId,
        subjectId: selectedAssignment.subjectId,
        semesterId: selectedAssignment.semesterId,
        includeUnOfficial,
      });
      setReport(data);
    } catch (error) {
      setReport(null);
      showToast(getReportErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Subject Report
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Only subject classes assigned to you are available.
        </p>
      </div>

      <form
        onSubmit={loadReport}
        className="space-y-4 rounded border border-slate-200 bg-white p-5"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span>Subject assignment</span>
            <select
              required
              value={assignmentId}
              onChange={(event) => setAssignmentId(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              {subjectAssignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.class?.name ?? assignment.classId} -{' '}
                  {assignment.subject?.name ?? assignment.subjectId} -{' '}
                  {assignment.semester?.name ?? assignment.semesterId}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={includeUnOfficial}
              onChange={(event) => setIncludeUnOfficial(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Include unofficial
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading || !assignmentId}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
        >
          Load report
        </button>
      </form>

      {report ? (
        <div className="overflow-hidden rounded border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Students</th>
                <th className="px-4 py-3">Average</th>
                <th className="px-4 py-3">Pass</th>
                <th className="px-4 py-3">Pass rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.details.map((detail) => (
                <tr key={`${detail.classId}-${detail.subjectId}`}>
                  <td className="px-4 py-3">{detail.className}</td>
                  <td className="px-4 py-3">{detail.subjectName}</td>
                  <td className="px-4 py-3">{detail.studentCount}</td>
                  <td className="px-4 py-3">
                    {formatNumber(detail.subjectAverage)}
                  </td>
                  <td className="px-4 py-3">{detail.passCount}</td>
                  <td className="px-4 py-3">{detail.passRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
};
