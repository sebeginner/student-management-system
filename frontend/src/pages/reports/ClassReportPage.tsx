import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  academicApi,
  type ClassSemesterReport,
  type Semester,
  type TeacherAssignment,
} from '../../lib/academic-api';
import { useToastStore } from '../../lib/toast-store';
import { formatNumber, getReportErrorMessage } from './report-utils';

export const ClassReportPage = () => {
  const showToast = useToastStore((state) => state.showToast);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [assignmentId, setAssignmentId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [includeUnOfficial, setIncludeUnOfficial] = useState(false);
  const [report, setReport] = useState<ClassSemesterReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const homeroomAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          assignment.assignmentType === 'HOMEROOM' && assignment.isActive,
      ),
    [assignments],
  );
  const selectedAssignment = homeroomAssignments.find(
    (assignment) => assignment.id === Number(assignmentId),
  );

  const loadData = useCallback(async () => {
    try {
      const [assignmentData, semesterData] = await Promise.all([
        academicApi.getMyTeacherAssignments(),
        academicApi.getSemesters(),
      ]);
      const homerooms = assignmentData.filter(
        (assignment) =>
          assignment.assignmentType === 'HOMEROOM' && assignment.isActive,
      );
      setAssignments(assignmentData);
      setSemesters(semesterData);
      setAssignmentId((current) => current || String(homerooms[0]?.id ?? ''));
      setSemesterId(
        (current) =>
          current ||
          String(
            semesterData.find((semester) => semester.isActive)?.id ??
              semesterData[0]?.id ??
              '',
          ),
      );
    } catch (error) {
      showToast(getReportErrorMessage(error), 'error');
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const loadReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedAssignment) {
      return;
    }

    setIsLoading(true);

    try {
      const data = await academicApi.getClassSemesterReport({
        classId: selectedAssignment.classId,
        semesterId: Number(semesterId),
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
          Homeroom Class Report
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Only homeroom classes assigned to you are available.
        </p>
      </div>

      <form
        onSubmit={loadReport}
        className="space-y-4 rounded border border-slate-200 bg-white p-5"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span>Homeroom class</span>
            <select
              required
              value={assignmentId}
              onChange={(event) => setAssignmentId(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              {homeroomAssignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.class?.name ?? assignment.classId}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span>Semester</span>
            <select
              required
              value={semesterId}
              onChange={(event) => setSemesterId(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.schoolYear?.name ?? semester.schoolYearId}{' '}
                  {semester.name}
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
          disabled={isLoading || !assignmentId || !semesterId}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
        >
          Load report
        </button>
      </form>

      {report ? (
        <div className="space-y-4 rounded border border-slate-200 bg-white p-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Students" value={report.studentCount} />
            <Metric label="Average" value={formatNumber(report.classSemesterAverage)} />
            <Metric label="Pass" value={report.passCount} />
            <Metric label="Fail" value={report.failCount} />
          </div>

          <div className="overflow-hidden rounded border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Subjects</th>
                  <th className="px-3 py-2">Average</th>
                  <th className="px-3 py-2">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.students.map((student) => (
                  <tr key={student.studentId}>
                    <td className="px-3 py-2">{student.studentCode}</td>
                    <td className="px-3 py-2">{student.fullName}</td>
                    <td className="px-3 py-2">{student.subjectCount}</td>
                    <td className="px-3 py-2">
                      {formatNumber(student.semesterAverage)}
                    </td>
                    <td className="px-3 py-2">{student.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
};

const Metric = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded border border-slate-200 p-3">
    <div className="text-xs uppercase text-slate-500">{label}</div>
    <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
  </div>
);
