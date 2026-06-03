import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  academicApi,
  CONDUCT_RATING_LABELS,
  type ConductAssessment,
  type SchoolClass,
  type Semester,
} from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useToastStore } from '../../lib/toast-store';
import { menuLabels, commonLabels } from '../../lib/uiText';

const CRITERIA_LABELS: Record<string, string> = {
  ATTENDANCE: 'Chuyên cần',
  DISCIPLINE: 'Kỷ luật',
  ACADEMIC:   'Học tập',
  ACTIVITIES: 'Hoạt động',
};

const RATING_COLORS: Record<string, string> = {
  EXCELLENT: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  GOOD:      'border-blue-200 bg-blue-50 text-blue-700',
  AVERAGE:   'border-slate-200 bg-slate-50 text-slate-700',
  WEAK:      'border-rose-200 bg-rose-50 text-rose-700',
};

const RATING_OPTIONS = ['EXCELLENT', 'GOOD', 'AVERAGE', 'WEAK'];

export const ConductReviewPage = () => {
  const showToast = useToastStore((s) => s.showToast);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [statusFilter, setStatusFilter] = useState('SUBMITTED');
  const [assessments, setAssessments] = useState<ConductAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [finalizeTarget, setFinalizeTarget] = useState<ConductAssessment | null>(null);
  const [finalRating, setFinalRating] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([academicApi.getSemesters(), academicApi.getClasses()])
      .then(([s, c]) => { setSemesters(s); setClasses(c); })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        semesterId: selectedSem ? Number(selectedSem) : undefined,
        classId: selectedClass ? Number(selectedClass) : undefined,
      };
      const data = await academicApi.getConductAssessments(params);
      setAssessments(statusFilter ? data.filter(a => a.status === statusFilter) : data);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSem, selectedClass, statusFilter, showToast]);

  useEffect(() => { void load(); }, [load]);

  const openFinalize = (a: ConductAssessment) => {
    setFinalizeTarget(a);
    setFinalRating(a.finalRating ?? 'GOOD');
    setReviewNote('');
  };

  const handleFinalize = async (e: FormEvent) => {
    e.preventDefault();
    if (!finalizeTarget) return;
    setIsSaving(true);
    try {
      await academicApi.finalizeConduct(finalizeTarget.id, { finalRating, reviewNote });
      showToast('Đã chốt xếp loại hạnh kiểm.', 'success');
      setFinalizeTarget(null);
      await load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const submitted = assessments.filter(a => a.status === 'SUBMITTED').length;
  const finalized = assessments.filter(a => a.status === 'FINALIZED').length;

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">{menuLabels.conductReview}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Giáo vụ xét duyệt và chốt xếp loại hạnh kiểm từ GVCN.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Học kỳ</span>
          <select value={selectedSem} onChange={e => setSelectedSem(e.target.value)}
            className="h-10 w-40 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500">
            <option value="">Tất cả HK</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.schoolYear?.name} {s.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Lớp</span>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
            className="h-10 w-28 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500">
            <option value="">Tất cả</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>{commonLabels.status}</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="h-10 w-36 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500">
            <option value="">Tất cả</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="SUBMITTED">Đã nộp</option>
            <option value="FINALIZED">Đã chốt</option>
          </select>
        </label>
      </div>

      {assessments.length > 0 ? (
        <>
          <div className="flex gap-4 text-sm">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-700">Chờ duyệt: {submitted}</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">Đã chốt: {finalized}</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[760px] w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Học sinh</th>
                  <th className="px-4 py-3">Lớp</th>
                  <th className="px-4 py-3">Tiêu chí</th>
                  <th className="px-4 py-3 text-center">Xếp loại</th>
                  <th className="px-4 py-3 text-center">{commonLabels.status}</th>
                  <th className="px-4 py-3 text-right">{commonLabels.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Đang tải...</td></tr>
                ) : assessments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{a.student.fullName}</div>
                      <div className="text-xs text-slate-500">{a.student.studentCode}</div>
                    </td>
                    <td className="px-4 py-3">{a.class.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {a.criteria.map(c => (
                          <span key={c.code} className={`rounded border px-1.5 py-0.5 text-xs ${RATING_COLORS[c.rating] ?? ''}`}>
                            {CRITERIA_LABELS[c.code] ?? c.code}: {CONDUCT_RATING_LABELS[c.rating]}
                          </span>
                        ))}
                        {a.criteria.length === 0 ? <span className="text-slate-400 text-xs">Chưa chấm</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {a.finalRating ? (
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${RATING_COLORS[a.finalRating] ?? ''}`}>
                          {CONDUCT_RATING_LABELS[a.finalRating]}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-600">
                      {a.status === 'DRAFT' ? 'Bản nháp' : a.status === 'SUBMITTED' ? '⏳ Chờ duyệt' : '✓ Đã chốt'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.status === 'SUBMITTED' ? (
                        <button onClick={() => openFinalize(a)}
                          className="rounded border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                          Duyệt & chốt
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : !isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {statusFilter === 'SUBMITTED' ? 'Không có đánh giá chờ duyệt.' : 'Chưa có dữ liệu.'}
        </div>
      ) : null}

      {/* Modal chốt xếp loại */}
      {finalizeTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-base font-semibold text-slate-900">
              Chốt hạnh kiểm – {finalizeTarget.student.fullName}
            </h3>
            <form onSubmit={(e) => void handleFinalize(e)} className="space-y-4">
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                <span>Xếp loại cuối cùng *</span>
                <select required value={finalRating} onChange={e => setFinalRating(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500">
                  {RATING_OPTIONS.map(r => <option key={r} value={r}>{CONDUCT_RATING_LABELS[r]}</option>)}
                </select>
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                <span>Ghi chú duyệt</span>
                <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={3} />
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setFinalizeTarget(null)} disabled={isSaving}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-50">
                  {commonLabels.cancel}
                </button>
                <button type="submit" disabled={isSaving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {isSaving ? 'Đang lưu...' : 'Chốt xếp loại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
};
