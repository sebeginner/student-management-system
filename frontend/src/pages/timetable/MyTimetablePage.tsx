import { useEffect, useState } from 'react';
import { academicApi, type Semester, type TimetableSlot } from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useToastStore } from '../../lib/toast-store';
import { menuLabels } from '../../lib/uiText';

const DAYS = [
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
];
const PERIODS = [1, 2, 3, 4, 5];

const COLORS = [
  'bg-blue-50 border-blue-200 text-blue-800',
  'bg-emerald-50 border-emerald-200 text-emerald-800',
  'bg-violet-50 border-violet-200 text-violet-800',
  'bg-amber-50 border-amber-200 text-amber-800',
  'bg-rose-50 border-rose-200 text-rose-800',
  'bg-cyan-50 border-cyan-200 text-cyan-800',
];

export const MyTimetablePage = () => {
  const showToast = useToastStore((s) => s.showToast);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSem, setSelectedSem] = useState('');
  const [grid, setGrid] = useState<Record<number, Record<number, TimetableSlot>>>({});
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    academicApi.getSemesters()
      .then(data => {
        setSemesters(data);
        const active = data.find(s => s.isActive);
        if (active) setSelectedSem(String(active.id));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSem) return;
    setIsLoading(true);
    academicApi.getMyTimetable(Number(selectedSem))
      .then(data => {
        setSlots(data.slots);
        setGrid(data.grid as Record<number, Record<number, TimetableSlot>>);
      })
      .catch(err => showToast(getApiErrorMessage(err), 'error'))
      .finally(() => setIsLoading(false));
  }, [selectedSem, showToast]);

  // Build color map from subject IDs
  const subjectIds = [...new Set(slots.map(s => s.subjectId))];
  const colorMap = new Map(subjectIds.map((id, i) => [id, COLORS[i % COLORS.length] ?? '']));

  const hasAnySlot = slots.length > 0;

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">{menuLabels.myTimetable}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Thời khóa biểu cá nhân theo học kỳ.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Học kỳ</span>
          <select value={selectedSem} onChange={e => setSelectedSem(e.target.value)}
            className="ml-3 h-10 w-48 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500">
            <option value="">-- Chọn học kỳ --</option>
            {semesters.map(s => (
              <option key={s.id} value={s.id}>
                {s.schoolYear?.name} – {s.name}{s.isActive ? ' (hiện tại)' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedSem ? (
        isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Đang tải...</div>
        ) : hasAnySlot ? (
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[700px] w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="w-20 px-4 py-3 text-left text-xs font-semibold text-slate-600 border-b border-slate-200">Tiết</th>
                    {DAYS.map(d => (
                      <th key={d.value} className="px-4 py-3 text-center text-xs font-semibold text-slate-600 border-b border-slate-200">
                        {d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PERIODS.map(period => (
                    <tr key={period}>
                      <td className="px-4 py-3 text-xs font-medium text-slate-500 border-r border-slate-100">
                        Tiết {period}
                      </td>
                      {DAYS.map(d => {
                        const slot = grid[d.value]?.[period];
                        const color = slot ? (colorMap.get(slot.subjectId) ?? '') : '';
                        return (
                          <td key={d.value} className="px-2 py-2 text-center">
                            {slot ? (
                              <div className={`rounded-lg border p-2.5 text-left ${color}`}>
                                <div className="text-xs font-semibold leading-tight">{slot.subject.name}</div>
                                <div className="text-xs opacity-70 mt-0.5">{slot.teacher.fullName}</div>
                                {slot.room ? <div className="text-xs opacity-60 mt-0.5">P.{slot.room}</div> : null}
                              </div>
                            ) : (
                              <div className="h-14 rounded border border-dashed border-slate-100" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Chưa có thời khóa biểu cho học kỳ này.
          </div>
        )
      ) : null}
    </section>
  );
};
