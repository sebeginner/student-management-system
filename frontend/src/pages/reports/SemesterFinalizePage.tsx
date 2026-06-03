import { useCallback, useEffect, useState } from 'react';
import {
  academicApi,
  ACADEMIC_RATING_LABELS,
  type SchoolYear,
  type Semester,
  type SemesterStudentResult,
} from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useToastStore } from '../../lib/toast-store';
import { menuLabels } from '../../lib/uiText';

const RATING_COLORS: Record<string, string> = {
  EXCELLENT: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  GOOD:      'text-blue-700 bg-blue-50 border-blue-200',
  AVERAGE:   'text-slate-700 bg-slate-50 border-slate-200',
  WEAK:      'text-amber-700 bg-amber-50 border-amber-200',
  POOR:      'text-rose-700 bg-rose-50 border-rose-200',
};

export const SemesterFinalizePage = () => {
  const showToast = useToastStore((state) => state.showToast);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSy, setSelectedSy] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [results, setResults] = useState<SemesterStudentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeInfo, setFinalizeInfo] = useState<{ studentCount: number; semesterName: string } | null>(null);

  useEffect(() => {
    Promise.all([academicApi.getSchoolYears(), academicApi.getSemesters()])
      .then(([sy, sem]) => { setSchoolYears(sy); setSemesters(sem); })
      .catch(() => {});
  }, []);

  const filteredSemesters = semesters.filter(s => !selectedSy || String(s.schoolYearId) === selectedSy);

  const loadResults = useCallback(async () => {
    if (!selectedSem) return;
    setIsLoading(true);
    try {
      const data = await academicApi.getSemesterResults(Number(selectedSem));
      setResults(data);
    } catch { setResults([]); }
    finally { setIsLoading(false); }
  }, [selectedSem]);

  useEffect(() => { void loadResults(); }, [loadResults]);

  const handleFinalize = async () => {
    if (!selectedSem) return;
    setIsFinalizing(true);
    try {
      const res = await academicApi.finalizeSemester(Number(selectedSem));
      showToast(`Chốt thành công ${res.studentCount} học sinh.`, 'success');
      setFinalizeInfo({ studentCount: res.studentCount, semesterName: res.semesterName });
      await loadResults();
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsFinalizing(false);
    }
  };

  const ratingCounts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.academicRating] = (acc[r.academicRating] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">{menuLabels.semesterFinalize}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tính điểm TB học kỳ và phân loại học lực cho từng học sinh theo Thông tư 58.
          Yêu cầu tất cả bảng điểm trong học kỳ đã được khóa.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Năm học</span>
          <select
            value={selectedSy}
            onChange={(e) => { setSelectedSy(e.target.value); setSelectedSem(''); }}
            className="h-10 w-44 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">-- Chọn năm học --</option>
            {schoolYears.map(sy => <option key={sy.id} value={sy.id}>{sy.name}</option>)}
          </select>
        </label>

        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Học kỳ</span>
          <select
            value={selectedSem}
            onChange={(e) => setSelectedSem(e.target.value)}
            className="h-10 w-32 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">-- Chọn HK --</option>
            {filteredSemesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>

        {selectedSem ? (
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void handleFinalize()}
              disabled={isFinalizing}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isFinalizing ? 'Đang chốt...' : results.length > 0 ? 'Chốt lại (idempotent)' : 'Chốt kết quả HK'}
            </button>
          </div>
        ) : null}
      </div>

      {finalizeInfo ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Đã chốt kết quả {finalizeInfo.semesterName}: <strong>{finalizeInfo.studentCount} học sinh</strong>.
        </div>
      ) : null}

      {results.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-3">
            {Object.entries(ACADEMIC_RATING_LABELS).map(([key, label]) => (
              <div key={key} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${RATING_COLORS[key] ?? ''}`}>
                {label}: {ratingCounts[key] ?? 0} HS
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[700px] w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Mã HS</th>
                  <th className="px-4 py-3">Họ tên</th>
                  <th className="px-4 py-3">Lớp</th>
                  <th className="px-4 py-3 text-center">Số môn</th>
                  <th className="px-4 py-3 text-center">Môn yếu</th>
                  <th className="px-4 py-3 text-center">Điểm TB HK</th>
                  <th className="px-4 py-3 text-center">Học lực</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Đang tải...</td></tr>
                ) : results.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{r.student.studentCode}</td>
                    <td className="px-4 py-3">{r.student.fullName}</td>
                    <td className="px-4 py-3">{r.class.name}</td>
                    <td className="px-4 py-3 text-center">{r.subjectCount}</td>
                    <td className="px-4 py-3 text-center">{r.failedSubjectCount > 0 ? <span className="text-rose-600 font-semibold">{r.failedSubjectCount}</span> : '0'}</td>
                    <td className="px-4 py-3 text-center font-semibold">{r.semesterAverage.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${RATING_COLORS[r.academicRating] ?? ''}`}>
                        {ACADEMIC_RATING_LABELS[r.academicRating] ?? r.academicRating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : selectedSem && !isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Chưa có kết quả. Nhấn "Chốt kết quả HK" để tính.
        </div>
      ) : null}
    </section>
  );
};
