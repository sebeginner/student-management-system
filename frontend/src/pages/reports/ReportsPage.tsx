import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  academicApi,
  type ClassSemesterReport,
  type DashboardSummaryReport,
  type SchoolClass,
  type Semester,
  type Subject,
  type SubjectSummaryReport,
} from '../../lib/academic-api';
import { useToastStore } from '../../lib/toast-store';
import { formatNumber, getReportErrorMessage } from './report-utils';

export const ReportsPage = () => {
  const showToast = useToastStore((state) => state.showToast);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [includeUnOfficial, setIncludeUnOfficial] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardSummaryReport | null>(
    null,
  );
  const [classReport, setClassReport] = useState<ClassSemesterReport | null>(
    null,
  );
  const [subjectReport, setSubjectReport] =
    useState<SubjectSummaryReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadMasterData = useCallback(async () => {
    try {
      const [classData, subjectData, semesterData] = await Promise.all([
        academicApi.getClasses(),
        academicApi.getSubjects(),
        academicApi.getSemesters(),
      ]);

      setClasses(classData);
      setSubjects(subjectData.filter((subject) => subject.isActive));
      setSemesters(semesterData);
      setSelectedClassId((current) => current || String(classData[0]?.id ?? ''));
      setSelectedSubjectId(
        (current) => current || String(subjectData[0]?.id ?? ''),
      );
      setSelectedSemesterId(
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

  const loadDashboard = useCallback(async () => {
    try {
      const data = await academicApi.getDashboardSummaryReport({
        semesterId: selectedSemesterId ? Number(selectedSemesterId) : undefined,
        includeUnOfficial,
      });
      setDashboard(data);
    } catch (error) {
      showToast(getReportErrorMessage(error), 'error');
    }
  }, [includeUnOfficial, selectedSemesterId, showToast]);

  useEffect(() => {
    void loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    if (selectedSemesterId) {
      void loadDashboard();
    }
  }, [loadDashboard, selectedSemesterId]);

  const loadClassReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const data = await academicApi.getClassSemesterReport({
        classId: Number(selectedClassId),
        semesterId: Number(selectedSemesterId),
        includeUnOfficial,
      });
      setClassReport(data);
    } catch (error) {
      setClassReport(null);
      showToast(getReportErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubjectReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const data = await academicApi.getSubjectSummaryReport({
        subjectId: Number(selectedSubjectId),
        classId: selectedClassId ? Number(selectedClassId) : undefined,
        semesterId: Number(selectedSemesterId),
        includeUnOfficial,
      });
      setSubjectReport(data);
    } catch (error) {
      setSubjectReport(null);
      showToast(getReportErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Reports</h2>
        <p className="mt-1 text-sm text-slate-600">
          School-wide dashboard, class semester, and subject summary reports.
        </p>
      </div>

      <div className="rounded border border-slate-200 bg-white p-4">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={includeUnOfficial}
            onChange={(event) => setIncludeUnOfficial(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Include unofficial score sheets
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Students</div>
          <div className="mt-1 text-2xl font-semibold">
            {dashboard?.studentCount ?? '-'}
          </div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Classes</div>
          <div className="mt-1 text-2xl font-semibold">
            {dashboard?.classCount ?? '-'}
          </div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Subjects</div>
          <div className="mt-1 text-2xl font-semibold">
            {dashboard?.subjectCount ?? '-'}
          </div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Score sheets</div>
          <div className="mt-1 text-2xl font-semibold">
            {dashboard?.scoreSheetCount ?? '-'}
          </div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Locked</div>
          <div className="mt-1 text-2xl font-semibold">
            {dashboard?.lockedScoreSheetCount ?? '-'}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <form
          onSubmit={loadClassReport}
          className="space-y-4 rounded border border-slate-200 bg-white p-5"
        >
          <h3 className="text-lg font-semibold text-slate-900">
            Class semester report
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Class"
              value={selectedClassId}
              onChange={setSelectedClassId}
              options={classes.map((item) => ({
                value: String(item.id),
                label: item.name,
              }))}
            />
            <SelectField
              label="Semester"
              value={selectedSemesterId}
              onChange={setSelectedSemesterId}
              options={semesters.map((item) => ({
                value: String(item.id),
                label: `${item.schoolYear?.name ?? item.schoolYearId} ${item.name}`,
              }))}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !selectedClassId || !selectedSemesterId}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
          >
            Load class report
          </button>

          {classReport ? (
            <ReportSummary
              items={[
                ['Student count', classReport.studentCount],
                ['Class average', formatNumber(classReport.classSemesterAverage)],
                ['Pass count', classReport.passCount],
                ['Fail count', classReport.failCount],
              ]}
            />
          ) : null}
        </form>

        <form
          onSubmit={loadSubjectReport}
          className="space-y-4 rounded border border-slate-200 bg-white p-5"
        >
          <h3 className="text-lg font-semibold text-slate-900">
            Subject summary
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField
              label="Subject"
              value={selectedSubjectId}
              onChange={setSelectedSubjectId}
              options={subjects.map((item) => ({
                value: String(item.id),
                label: item.name,
              }))}
            />
            <SelectField
              label="Class"
              value={selectedClassId}
              onChange={setSelectedClassId}
              options={classes.map((item) => ({
                value: String(item.id),
                label: item.name,
              }))}
            />
            <SelectField
              label="Semester"
              value={selectedSemesterId}
              onChange={setSelectedSemesterId}
              options={semesters.map((item) => ({
                value: String(item.id),
                label: item.name,
              }))}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !selectedSubjectId || !selectedSemesterId}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
          >
            Load subject report
          </button>

          {subjectReport ? (
            <div className="overflow-hidden rounded border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Class</th>
                    <th className="px-3 py-2">Students</th>
                    <th className="px-3 py-2">Average</th>
                    <th className="px-3 py-2">Pass</th>
                    <th className="px-3 py-2">Pass rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjectReport.details.map((detail) => (
                    <tr key={`${detail.classId}-${detail.subjectId}`}>
                      <td className="px-3 py-2">{detail.className}</td>
                      <td className="px-3 py-2">{detail.studentCount}</td>
                      <td className="px-3 py-2">
                        {formatNumber(detail.subjectAverage)}
                      </td>
                      <td className="px-3 py-2">{detail.passCount}</td>
                      <td className="px-3 py-2">{detail.passRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
};

interface SelectFieldProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

const SelectField = ({ label, onChange, options, value }: SelectFieldProps) => (
  <label className="space-y-1 text-sm font-medium text-slate-700">
    <span>{label}</span>
    <select
      required
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
    >
      <option value="">Select</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const ReportSummary = ({
  items,
}: {
  items: Array<[string, string | number]>;
}) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {items.map(([label, value]) => (
      <div key={label} className="rounded border border-slate-200 p-3">
        <div className="text-xs uppercase text-slate-500">{label}</div>
        <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
      </div>
    ))}
  </div>
);
