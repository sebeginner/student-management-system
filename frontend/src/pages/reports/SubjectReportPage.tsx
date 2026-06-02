import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  academicApi,
  type SubjectSummaryReport,
  type TeacherAssignment,
} from '../../lib/academic-api';
import { useToastStore } from '../../lib/toast-store';
import { menuLabels } from '../../lib/uiText';
import {
  calculateFailCount,
  calculatePassRate,
  formatNumber,
  formatPercent,
  getReportErrorMessage,
  reportColors,
} from './report-utils';

const loadErrorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';

export const SubjectReportPage = () => {
  const showToast = useToastStore((state) => state.showToast);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [assignmentId, setAssignmentId] = useState('');
  const [includeUnOfficial, setIncludeUnOfficial] = useState(false);
  const [report, setReport] = useState<SubjectSummaryReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
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

  const totals = useMemo(() => {
    const details = report?.details ?? [];
    const studentCount = details.reduce(
      (total, detail) => total + detail.studentCount,
      0,
    );
    const passCount = details.reduce(
      (total, detail) => total + detail.passCount,
      0,
    );
    const failCount = calculateFailCount(studentCount, passCount);
    const passRate = calculatePassRate(passCount, studentCount);
    const average =
      details.length > 0
        ? details.reduce(
            (total, detail) => total + (detail.subjectAverage ?? 0),
            0,
          ) / details.length
        : null;

    return { average, failCount, passCount, passRate, studentCount };
  }, [report]);

  const loadData = useCallback(async () => {
    setLoadError('');

    try {
      const data = await academicApi.getMyTeacherAssignments();
      const subjects = data.filter(
        (assignment) =>
          assignment.assignmentType === 'SUBJECT' && assignment.isActive,
      );
      setAssignments(data);
      setAssignmentId((current) => current || String(subjects[0]?.id ?? ''));
    } catch (error) {
      setLoadError(loadErrorMessage);
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
    setLoadError('');

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
      setLoadError(loadErrorMessage);
      showToast(getReportErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          {menuLabels.subjectReport}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Báo cáo môn học theo các lớp và môn được phân công cho bạn.
        </p>
      </div>

      <form
        onSubmit={loadReport}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h3 className="text-base font-semibold text-slate-900">Bộ lọc báo cáo</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SelectField
            label="Phân công"
            value={assignmentId}
            onChange={setAssignmentId}
            options={subjectAssignments.map((assignment) => ({
              value: String(assignment.id),
              label: `${assignment.class?.name ?? assignment.classId} - ${
                assignment.subject?.name ?? assignment.subjectId
              } - ${assignment.semester?.name ?? assignment.semesterId}`,
            }))}
          />
          <ReadOnlyField
            label="Năm học"
            value={selectedAssignment?.schoolYear?.name ?? '-'}
          />
          <ReadOnlyField
            label="Học kỳ"
            value={selectedAssignment?.semester?.name ?? '-'}
          />
          <ReadOnlyField
            label="Lớp"
            value={String(
              selectedAssignment?.class?.name ??
                selectedAssignment?.classId ??
                '-',
            )}
          />
          <ReadOnlyField
            label="Môn học"
            value={String(
              selectedAssignment?.subject?.name ??
                selectedAssignment?.subjectId ??
                '-',
            )}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={includeUnOfficial}
              onChange={(event) => setIncludeUnOfficial(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Bao gồm dữ liệu chưa chính thức
          </label>
          <button
            type="submit"
            disabled={isLoading || !assignmentId}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            Tải báo cáo môn học
          </button>
        </div>
      </form>

      {loadError ? <ErrorState /> : null}
      {isLoading ? <LoadingState /> : null}

      {!isLoading && !loadError && subjectAssignments.length === 0 ? (
        <EmptyState />
      ) : null}

      {report ? (
        <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Báo cáo môn học
          </h3>

          <div className="grid gap-3 md:grid-cols-5">
            <Metric label="Tổng số học sinh" value={totals.studentCount} />
            <Metric label="Số học sinh đạt" value={totals.passCount} />
            <Metric label="Số học sinh chưa đạt" value={totals.failCount} />
            <Metric label="Tỷ lệ đạt" value={formatPercent(totals.passRate)} />
            <Metric label="Điểm trung bình" value={formatNumber(totals.average)} />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <h4 className="mb-4 text-center text-sm font-semibold text-slate-700">
                Số lượng đạt/chưa đạt theo lớp
              </h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={report.details.map((detail) => ({
                      name: detail.className,
                      'Số học sinh đạt': detail.passCount,
                      'Số học sinh chưa đạt': calculateFailCount(
                        detail.studentCount,
                        detail.passCount,
                      ),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Số học sinh đạt" fill={reportColors.pass} />
                    <Bar
                      dataKey="Số học sinh chưa đạt"
                      fill={reportColors.fail}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <h4 className="mb-4 text-center text-sm font-semibold text-slate-700">
                Tỷ lệ đạt
              </h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie
                      data={[
                        { name: 'Số học sinh đạt', value: totals.passCount },
                        {
                          name: 'Số học sinh chưa đạt',
                          value: totals.failCount,
                        },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={92}
                      paddingAngle={3}
                    >
                      <Cell fill={reportColors.pass} />
                      <Cell fill={reportColors.fail} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-[900px] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Lớp</th>
                  <th className="px-4 py-3">Môn học</th>
                  <th className="px-4 py-3">Tổng số học sinh</th>
                  <th className="px-4 py-3">Điểm trung bình</th>
                  <th className="px-4 py-3">Số học sinh đạt</th>
                  <th className="px-4 py-3">Số học sinh chưa đạt</th>
                  <th className="px-4 py-3">Tỷ lệ đạt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.details.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : null}
                {report.details.map((detail) => (
                  <tr
                    key={`${detail.classId}-${detail.subjectId}`}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {detail.className}
                    </td>
                    <td className="px-4 py-3">{detail.subjectName}</td>
                    <td className="px-4 py-3">{detail.studentCount}</td>
                    <td className="px-4 py-3">
                      {formatNumber(detail.subjectAverage)}
                    </td>
                    <td className="px-4 py-3">{detail.passCount}</td>
                    <td className="px-4 py-3">
                      {calculateFailCount(detail.studentCount, detail.passCount)}
                    </td>
                    <td className="px-4 py-3">
                      {formatPercent(detail.passRate)}
                    </td>
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

interface SelectFieldProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

const SelectField = ({ label, onChange, options, value }: SelectFieldProps) => (
  <label className="space-y-1.5 text-sm font-medium text-slate-700">
    <span>{label}</span>
    <select
      required
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    >
      <option value="">Chọn</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <label className="space-y-1.5 text-sm font-medium text-slate-700">
    <span>{label}</span>
    <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
      {value}
    </div>
  </label>
);

const Metric = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
    <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
  </div>
);

const LoadingState = () => (
  <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
    Đang tải dữ liệu...
  </div>
);

const EmptyState = () => (
  <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
    Chưa có dữ liệu
  </div>
);

const ErrorState = () => (
  <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm font-medium text-rose-700">
    Đã xảy ra lỗi. Vui lòng thử lại.
  </div>
);
