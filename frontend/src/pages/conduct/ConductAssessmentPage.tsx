import { useCallback, useEffect, useState } from 'react';
import {
  academicApi,
  CONDUCT_RATING_LABELS,
  type ConductAssessment,
  type SchoolClass,
  type Semester,
} from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useToastStore } from '../../lib/toast-store';
import { menuLabels } from '../../lib/uiText';

const CRITERIA = [
  { code: 'ATTENDANCE', label: 'Chuyên cần' },
  { code: 'DISCIPLINE', label: 'Kỷ luật, đạo đức' },
  { code: 'ACADEMIC',   label: 'Học tập, rèn luyện' },
  { code: 'ACTIVITIES', label: 'Hoạt động tập thể' },
];

const RATING_OPTIONS = [
  { value: 'EXCELLENT', label: 'Tốt' },
  { value: 'GOOD',      label: 'Khá' },
  { value: 'AVERAGE',   label: 'Trung bình' },
  { value: 'WEAK',      label: 'Yếu' },
];

const RATING_COLORS: Record<string, string> = {
  EXCELLENT: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  GOOD:      'border-blue-200 bg-blue-50 text-blue-700',
  AVERAGE:   'border-slate-200 bg-slate-50 text-slate-700',
  WEAK:      'border-rose-200 bg-rose-50 text-rose-700',
};

export const ConductAssessmentPage = () => {
  const showToast = useToastStore((s) => s.showToast);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [assessments, setAssessments] = useState<ConductAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCriteria, setEditCriteria] = useState<Record<string, string>>({});
  const [editNote, setEditNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([academicApi.getSemesters(), academicApi.getClasses()])
      .then(([s, c]) => { setSemesters(s); setClasses(c); })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!selectedSem || !selectedClass) return;
    setIsLoading(true);
    try {
      const data = await academicApi.getConductAssessments({
        semesterId: Number(selectedSem),
        classId: Number(selectedClass),
      });
      setAssessments(data);
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSem, selectedClass, showToast]);

  useEffect(() => { void load(); }, [load]);

  const handleCreateBatch = async () => {
    if (!selectedSem || !selectedClass) return;
    try {
      const res = await academicApi.createConductBatch(Number(selectedSem), Number(selectedClass));
      showToast(`Tạo ${res.created} đánh giá mới.`, 'success');
      await load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const openEdit = (a: ConductAssessment) => {
    setEditingId(a.id);
    const map: Record<string, string> = {};
    for (const c of a.criteria) map[c.code] = c.rating;
    setEditCriteria(map);
    setEditNote(a.teacherNote ?? '');
  };

  const handleSave = async () => {
    if (!editingId) return;
    setIsSaving(true);
    try {
      const criteria = CRITERIA.map(c => ({ code: c.code, rating: editCriteria[c.code] ?? 'AVERAGE' }));
      await academicApi.updateConduct(editingId, { criteria, teacherNote: editNote });
      showToast('Lưu thành công.', 'success');
      setEditingId(null);
      await load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (id: number) => {
    try {
      await academicApi.submitConduct(id);
      showToast('Đã nộp đánh giá hạnh kiểm.', 'success');
      await load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">{menuLabels.conductAssessment}</h2>
        <p className="mt-1 text-sm text-slate-600">
          GVCN chấm điểm hạnh kiểm từng tiêu chí cho học sinh lớp chủ nhiệm, sau đó nộp để giáo vụ duyệt.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Học kỳ</span>
          <select value={selectedSem} onChange={e => setSelectedSem(e.target.value)}
            className="h-10 w-32 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500">
            <option value="">-- HK --</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.schoolYear?.name} {s.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Lớp</span>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
            className="h-10 w-28 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500">
            <option value="">-- Lớp --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        {selectedSem && selectedClass ? (
          <div className="flex items-end">
            <button onClick={() => void handleCreateBatch()}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Tạo đánh giá cho cả lớp
            </button>
          </div>
        ) : null}
      </div>

      {assessments.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[860px] w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Học sinh</th>
                {CRITERIA.map(c => <th key={c.code} className="px-4 py-3 text-center">{c.label}</th>)}
                <th className="px-4 py-3 text-center">Xếp loại</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={CRITERIA.length + 4} className="px-4 py-8 text-center text-slate-500">Đang tải...</td></tr>
              ) : assessments.map(a => {
                const criteriaMap = Object.fromEntries(a.criteria.map(c => [c.code, c.rating]));
                const isEditing = editingId === a.id;
                const isDraft = a.status === 'DRAFT';

                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{a.student.fullName}</div>
                      <div className="text-xs text-slate-500">{a.student.studentCode}</div>
                    </td>
                    {CRITERIA.map(c => (
                      <td key={c.code} className="px-4 py-3 text-center">
                        {isEditing ? (
                          <select
                            value={editCriteria[c.code] ?? 'AVERAGE'}
                            onChange={e => setEditCriteria(prev => ({ ...prev, [c.code]: e.target.value }))}
                            className="rounded border border-slate-300 px-1 py-0.5 text-xs"
                          >
                            {RATING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${RATING_COLORS[criteriaMap[c.code] ?? ''] ?? 'text-slate-400'}`}>
                            {CONDUCT_RATING_LABELS[criteriaMap[c.code] ?? ''] ?? '-'}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      {a.finalRating ? (
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${RATING_COLORS[a.finalRating] ?? ''}`}>
                          {CONDUCT_RATING_LABELS[a.finalRating]}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-slate-600">{a.status === 'DRAFT' ? 'Bản nháp' : a.status === 'SUBMITTED' ? 'Đã nộp' : 'Đã chốt'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button onClick={() => setEditingId(null)} className="rounded border border-slate-300 px-2.5 py-1 text-xs">Hủy</button>
                            <button onClick={() => void handleSave()} disabled={isSaving} className="rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50">Lưu</button>
                          </>
                        ) : isDraft ? (
                          <>
                            <button onClick={() => openEdit(a)} className="rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100">Chỉnh sửa</button>
                            <button onClick={() => void handleSubmit(a.id)} className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700">Nộp</button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : selectedSem && selectedClass && !isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Chưa có đánh giá. Nhấn "Tạo đánh giá cho cả lớp" để bắt đầu.
        </div>
      ) : null}

      {editingId ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            <span>Ghi chú của GVCN</span>
            <textarea
              value={editNote}
              onChange={e => setEditNote(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={3}
            />
          </label>
        </div>
      ) : null}
    </section>
  );
};
