import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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
  type DashboardSummaryReport,
  type SchoolClass,
  type Semester,
  type Subject,
  type SubjectSummaryReport,
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
  const [loadError, setLoadError] = useState('');

  const selectedSemester = semesters.find(
    (semester) => semester.id === Number(selectedSemesterId),
  );

  const subjectTotals = useMemo(() => {
    const details = subjectReport?.details ?? [];
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
  }, [subjectReport]);

  const loadMasterData = useCallback(async () => {
    setLoadError('');

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
      setLoadError(loadErrorMessage);
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

  const loadClassReport = async () => {
    if (!selectedClassId || !selectedSemesterId) {
      return;
    }

    setIsLoading(true);
    setLoadError('');

    try {
      const data = await academicApi.getClassSemesterReport({
        classId: Number(selectedClassId),
        semesterId: Number(selectedSemesterId),
        includeUnOfficial,
      });
      setClassReport(data);
    } catch (error) {
      setClassReport(null);
      setLoadError(loadErrorMessage);
      showToast(getReportErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubjectReport = async () => {
    if (!selectedSubjectId || !selectedSemesterId) {
      return;
    }

    setIsLoading(true);
    setLoadError('');

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
      setLoadError(loadErrorMessage);
      showToast(getReportErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          {menuLabels.reports}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Báo cáo học kỳ và báo cáo môn học theo dữ liệu bảng điểm hiện có.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Bộ lọc báo cáo</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ReadOnlyField
            label="Năm học"
            value={selectedSemester?.schoolYear?.name ?? '-'}
          />
          <SelectField
            label="Học kỳ"
            value={selectedSemesterId}
            onChange={setSelectedSemesterId}
            options={semesters.map((item) => ({
              value: String(item.id),
              label: `${item.schoolYear?.name ?? item.schoolYearId} ${item.name}`,
            }))}
          />
          <SelectField
            label="Lớp"
            value={selectedClassId}
            onChange={setSelectedClassId}
            options={classes.map((item) => ({
              value: String(item.id),
              label: item.name,
            }))}
          />
          <SelectField
            label="Môn học"
            value={selectedSubjectId}
            onChange={setSelectedSubjectId}
            options={subjects.map((item) => ({
              value: String(item.id),
              label: item.name,
            }))}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={includeUnOfficial}
              onChange={(event) => setIncludeUnOfficial(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Bao gồm dữ liệu chưa chính thức
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isLoading || !selectedClassId || !selectedSemesterId}
              onClick={() => void loadClassReport()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              Tải báo cáo học kỳ
            </button>
            <button
              type="button"
              disabled={isLoading || !selectedSubjectId || !selectedSemesterId}
              onClick={() => void loadSubjectReport()}
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
            >
              Tải báo cáo môn học
            </button>
          </div>
        </div>
      </div>

      {loadError ? <ErrorState /> : null}
      {isLoading ? <LoadingState /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Tổng số học sinh" value={dashboard?.studentCount ?? '-'} />
        <MetricCard label="Lớp" value={dashboard?.classCount ?? '-'} />
        <MetricCard label="Môn học" value={dashboard?.subjectCount ?? '-'} />
        <MetricCard label="Bảng điểm" value={dashboard?.scoreSheetCount ?? '-'} />
        <MetricCard
          label="Bảng điểm đã khóa"
          value={dashboard?.lockedScoreSheetCount ?? '-'}
        />
      </div>

      {classReport ? (
        <ReportSection title="Báo cáo học kỳ">
          <div className="grid gap-3 md:grid-cols-5">
            <MetricCard label="Tổng số học sinh" value={classReport.studentCount} />
            <MetricCard label="Số học sinh đạt" value={classReport.passCount} />
            <MetricCard
              label="Số học sinh chưa đạt"
              value={classReport.failCount}
            />
            <MetricCard
              label="Tỷ lệ đạt"
              value={formatPercent(
                calculatePassRate(classReport.passCount, classReport.studentCount),
              )}
            />
            <MetricCard
              label="Điểm trung bình"
              value={formatNumber(classReport.classSemesterAverage)}
            />
          </div>

          <ResultCharts
            barTitle="Số lượng đạt/chưa đạt"
            pieTitle="Tỷ lệ đạt"
            barData={[
              {
                name: classReport.class.name,
                'Số học sinh đạt': classReport.passCount,
                'Số học sinh chưa đạt': classReport.failCount,
              },
            ]}
            pieData={[
              { name: 'Số học sinh đạt', value: classReport.passCount },
              { name: 'Số học sinh chưa đạt', value: classReport.failCount },
            ]}
          />

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
                {classReport.students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : null}
                {classReport.students.map((student) => (
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
        </ReportSection>
      ) : null}

      {subjectReport ? (
        <ReportSection title="Báo cáo môn học">
          <div className="grid gap-3 md:grid-cols-5">
            <MetricCard label="Tổng số học sinh" value={subjectTotals.studentCount} />
            <MetricCard label="Số học sinh đạt" value={subjectTotals.passCount} />
            <MetricCard
              label="Số học sinh chưa đạt"
              value={subjectTotals.failCount}
            />
            <MetricCard label="Tỷ lệ đạt" value={formatPercent(subjectTotals.passRate)} />
            <MetricCard
              label="Điểm trung bình"
              value={formatNumber(subjectTotals.average)}
            />
          </div>

          <ResultCharts
            barTitle="Số lượng đạt/chưa đạt theo lớp"
            pieTitle="Tỷ lệ đạt"
            barData={subjectReport.details.map((detail) => ({
              name: detail.className,
              'Số học sinh đạt': detail.passCount,
              'Số học sinh chưa đạt': calculateFailCount(
                detail.studentCount,
                detail.passCount,
              ),
            }))}
            pieData={[
              { name: 'Số học sinh đạt', value: subjectTotals.passCount },
              { name: 'Số học sinh chưa đạt', value: subjectTotals.failCount },
            ]}
          />

          <SubjectReportTable details={subjectReport.details} />
        </ReportSection>
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

const MetricCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
    <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
  </div>
);

const ReportSection = ({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) => (
  <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    {children}
  </div>
);

const ResultCharts = ({
  barData,
  barTitle,
  pieData,
  pieTitle,
}: {
  barData: Array<Record<string, string | number>>;
  barTitle: string;
  pieData: Array<{ name: string; value: number }>;
  pieTitle: string;
}) => (
  <div className="grid gap-5 xl:grid-cols-2">
    <div className="rounded-lg border border-slate-200 p-4">
      <h4 className="mb-4 text-center text-sm font-semibold text-slate-700">
        {barTitle}
      </h4>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Số học sinh đạt" fill={reportColors.pass} />
            <Bar dataKey="Số học sinh chưa đạt" fill={reportColors.fail} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="rounded-lg border border-slate-200 p-4">
      <h4 className="mb-4 text-center text-sm font-semibold text-slate-700">
        {pieTitle}
      </h4>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip />
            <Legend />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={92}
              paddingAngle={3}
            >
              {pieData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={
                    entry.name.includes('chưa')
                      ? reportColors.fail
                      : reportColors.pass
                  }
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

const SubjectReportTable = ({
  details,
}: {
  details: SubjectSummaryReport['details'];
}) => (
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
        {details.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
              Chưa có dữ liệu
            </td>
          </tr>
        ) : null}
        {details.map((detail) => (
          <tr key={`${detail.classId}-${detail.subjectId}`} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-900">
              {detail.className}
            </td>
            <td className="px-4 py-3">{detail.subjectName}</td>
            <td className="px-4 py-3">{detail.studentCount}</td>
            <td className="px-4 py-3">{formatNumber(detail.subjectAverage)}</td>
            <td className="px-4 py-3">{detail.passCount}</td>
            <td className="px-4 py-3">
              {calculateFailCount(detail.studentCount, detail.passCount)}
            </td>
            <td className="px-4 py-3">{formatPercent(detail.passRate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const LoadingState = () => (
  <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
    Đang tải dữ liệu...
  </div>
);

const ErrorState = () => (
  <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm font-medium text-rose-700">
    Đã xảy ra lỗi. Vui lòng thử lại.
  </div>
);
