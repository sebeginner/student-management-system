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
  type ClassSemesterReport,
  type Semester,
  type TeacherAssignment,
} from '../../lib/academic-api';
import { useToastStore } from '../../lib/toast-store';
import { menuLabels } from '../../lib/uiText';
import {
  calculatePassRate,
  formatNumber,
  formatPercent,
  getReportErrorMessage,
  reportColors,
} from './report-utils';

const loadErrorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';

export const ClassReportPage = () => {
  const showToast = useToastStore((state) => state.showToast);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [assignmentId, setAssignmentId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [includeUnOfficial, setIncludeUnOfficial] = useState(false);
  const [report, setReport] = useState<ClassSemesterReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
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
  const selectedSemester = semesters.find(
    (semester) => semester.id === Number(semesterId),
  );

  const loadData = useCallback(async () => {
    setLoadError('');

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
      setLoadError(loadErrorMessage);
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
    setLoadError('');

    try {
      const data = await academicApi.getClassSemesterReport({
        classId: selectedAssignment.classId,
        semesterId: Number(semesterId),
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
          {menuLabels.classReport}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Báo cáo lớp chủ nhiệm, chỉ hiển thị các lớp được phân công cho bạn.
        </p>
      </div>

      <form
        onSubmit={loadReport}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h3 className="text-base font-semibold text-slate-900">Bộ lọc báo cáo</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <ReadOnlyField
            label="Năm học"
            value={selectedSemester?.schoolYear?.name ?? '-'}
          />
          <SelectField
            label="Lớp"
            value={assignmentId}
            onChange={setAssignmentId}
            options={homeroomAssignments.map((assignment) => ({
              value: String(assignment.id),
              label: String(assignment.class?.name ?? assignment.classId),
            }))}
          />
          <SelectField
            label="Học kỳ"
            value={semesterId}
            onChange={setSemesterId}
            options={semesters.map((semester) => ({
              value: String(semester.id),
              label: `${semester.schoolYear?.name ?? semester.schoolYearId} ${
                semester.name
              }`,
            }))}
          />
          <label className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={includeUnOfficial}
              onChange={(event) => setIncludeUnOfficial(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Bao gồm dữ liệu chưa chính thức
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading || !assignmentId || !semesterId}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
        >
          Tải báo cáo lớp
        </button>
      </form>

      {loadError ? <ErrorState /> : null}
      {isLoading ? <LoadingState /> : null}

      {!isLoading && !loadError && homeroomAssignments.length === 0 ? (
        <EmptyState />
      ) : null}

      {report ? (
        <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Báo cáo lớp</h3>

          <div className="grid gap-3 md:grid-cols-5">
            <Metric label="Tổng số học sinh" value={report.studentCount} />
            <Metric label="Số học sinh đạt" value={report.passCount} />
            <Metric label="Số học sinh chưa đạt" value={report.failCount} />
            <Metric
              label="Tỷ lệ đạt"
              value={formatPercent(
                calculatePassRate(report.passCount, report.studentCount),
              )}
            />
            <Metric
              label="Điểm trung bình"
              value={formatNumber(report.classSemesterAverage)}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <h4 className="mb-4 text-center text-sm font-semibold text-slate-700">
                Số lượng đạt/chưa đạt
              </h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: report.class.name,
                        'Số học sinh đạt': report.passCount,
                        'Số học sinh chưa đạt': report.failCount,
                      },
                    ]}
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
                        { name: 'Số học sinh đạt', value: report.passCount },
                        {
                          name: 'Số học sinh chưa đạt',
                          value: report.failCount,
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
            <table className="min-w-[760px] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Mã học sinh</th>
                  <th className="px-4 py-3">Họ tên</th>
                  <th className="px-4 py-3">Số môn</th>
                  <th className="px-4 py-3">Điểm trung bình</th>
                  <th className="px-4 py-3">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : null}
                {report.students.map((student) => (
                  <tr key={student.studentId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {student.studentCode}
                    </td>
                    <td className="px-4 py-3">{student.fullName}</td>
                    <td className="px-4 py-3">{student.subjectCount}</td>
                    <td className="px-4 py-3">
                      {formatNumber(student.semesterAverage)}
                    </td>
                    <td className="px-4 py-3">
                      {student.result === 'PASS' ? 'Đạt' : 'Chưa đạt'}
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
