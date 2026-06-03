import { useEffect, useState } from 'react';
import {
  academicApi,
  ACADEMIC_RATING_LABELS,
  CONDUCT_RATING_LABELS,
  YEAR_END_DECISION_LABELS,
  type SchoolYear,
  type YearEndResult,
} from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useToastStore } from '../../lib/toast-store';
import { menuLabels } from '../../lib/uiText';

const DECISION_COLORS: Record<string, string> = {
  ADVANCE:        'border-emerald-200 bg-emerald-50 text-emerald-700',
  REMEDIAL:       'border-amber-200 bg-amber-50 text-amber-700',
  CONDUCT_REVIEW: 'border-blue-200 bg-blue-50 text-blue-700',
  RETAIN:         'border-rose-200 bg-rose-50 text-rose-700',
};

export const YearEndPage = () => {
  const showToast = useToastStore((state) => state.showToast);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedSy, setSelectedSy] = useState('');
  const [results, setResults] = useState<YearEndResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    academicApi.getSchoolYears()
      .then(setSchoolYears)
      .catch(() => {});
  }, []);

  const loadResults = async (syId: string) => {
    if (!syId) return;
    setIsLoading(true);
    try {
      const data = await academicApi.getYearEndResults(Number(syId));
      setResults(data);
    } catch { setResults([]); }
    finally { setIsLoading(false); }
  };

  const handleGenerate = async () => {
    if (!selectedSy) return;
    setIsGenerating(true);
    try {
      const res = await academicApi.generateYearEnd(Number(selectedSy));
      showToast(`Tổng kết ${res.studentCount} học sinh thành công.`, 'success');
      await loadResults(selectedSy);
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const decisionCounts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.decision] = (acc[r.decision] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">{menuLabels.yearEnd}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tổng kết năm học: điểm TB năm = (HK1×1 + HK2×2)/3, xét lên lớp theo Thông tư 58.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Năm học</span>
          <select
            value={selectedSy}
            onChange={(e) => { setSelectedSy(e.target.value); void loadResults(e.target.value); }}
            className="h-10 w-44 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">-- Chọn năm học --</option>
            {schoolYears.map(sy => <option key={sy.id} value={sy.id}>{sy.name}</option>)}
          </select>
        </label>

        {selectedSy ? (
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={isGenerating}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isGenerating ? 'Đang tổng kết...' : results.length > 0 ? 'Tổng kết lại' : 'Tổng kết năm học'}
            </button>
          </div>
        ) : null}
      </div>

      {results.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-3">
            {Object.entries(YEAR_END_DECISION_LABELS).map(([key, label]) => (
              <div key={key} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${DECISION_COLORS[key] ?? ''}`}>
                {label}: {decisionCounts[key] ?? 0} HS
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[860px] w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Mã HS</th>
                  <th className="px-4 py-3">Họ tên</th>
                  <th className="px-4 py-3">Lớp</th>
                  <th className="px-4 py-3 text-center">ĐTB HK1</th>
                  <th className="px-4 py-3 text-center">ĐTB HK2</th>
                  <th className="px-4 py-3 text-center">ĐTB Năm</th>
                  <th className="px-4 py-3 text-center">Học lực</th>
                  <th className="px-4 py-3 text-center">Hạnh kiểm</th>
                  <th className="px-4 py-3 text-center">Quyết định</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Đang tải...</td></tr>
                ) : results.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{r.student.studentCode}</td>
                    <td className="px-4 py-3">{r.student.fullName}</td>
                    <td className="px-4 py-3">{r.class.name}</td>
                    <td className="px-4 py-3 text-center">{r.hk1Average.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">{r.hk2Average.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center font-semibold">{r.yearAverage.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-semibold">
                        {ACADEMIC_RATING_LABELS[r.academicRating] ?? r.academicRating}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs">{r.conductRating ? (CONDUCT_RATING_LABELS[r.conductRating] ?? r.conductRating) : '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${DECISION_COLORS[r.decision] ?? ''}`}>
                        {YEAR_END_DECISION_LABELS[r.decision] ?? r.decision}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : selectedSy && !isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Chưa có dữ liệu. Cần chốt cả HK1 và HK2 trước, rồi nhấn "Tổng kết năm học".
        </div>
      ) : null}
    </section>
  );
};
