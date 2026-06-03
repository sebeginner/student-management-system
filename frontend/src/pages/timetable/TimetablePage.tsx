import { useCallback, useEffect, useState } from 'react';
import {
  academicApi,
  type SchoolClass,
  type Semester,
  type Subject,
  type Teacher,
  type TimetableSlot,
} from '../../lib/academic-api';
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

const SUBJECT_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
];

export const TimetablePage = () => {
  const showToast = useToastStore((s) => s.showToast);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [grid, setGrid] = useState<Record<number, Record<number, TimetableSlot>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [editCell, setEditCell] = useState<{ day: number; period: number } | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editTeacher, setEditTeacher] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Assign a color to each subject deterministically
  const subjectColorMap = new Map<number, string>();
  subjects.forEach((s, i) => { subjectColorMap.set(s.id, SUBJECT_COLORS[i % SUBJECT_COLORS.length] ?? ''); });

  useEffect(() => {
    Promise.all([
      academicApi.getSemesters(),
      academicApi.getClasses(),
      academicApi.getSubjects(),
      academicApi.getTeachers(),
    ]).then(([s, c, sub, t]) => {
      setSemesters(s);
      setClasses(c);
      setSubjects(sub);
      setTeachers(t);
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!selectedSem || !selectedClass) return;
    setIsLoading(true);
    try {
      const data = await academicApi.getTimetable(Number(selectedSem), Number(selectedClass));
      setGrid(data.grid as Record<number, Record<number, TimetableSlot>>);
    } catch { setGrid({}); }
    finally { setIsLoading(false); }
  }, [selectedSem, selectedClass]);

  useEffect(() => { void load(); }, [load]);

  const openEdit = (day: number, period: number) => {
    const existing = grid[day]?.[period];
    setEditCell({ day, period });
    setEditSubject(existing ? String(existing.subjectId) : '');
    setEditTeacher(existing ? String(existing.teacherId) : '');
    setEditRoom(existing?.room ?? '');
  };

  const handleSave = async () => {
    if (!editCell || !selectedSem || !selectedClass || !editSubject || !editTeacher) return;
    setIsSaving(true);
    try {
      await academicApi.upsertTimetableSlot({
        semesterId: Number(selectedSem),
        classId: Number(selectedClass),
        subjectId: Number(editSubject),
        teacherId: Number(editTeacher),
        dayOfWeek: editCell.day,
        period: editCell.period,
        room: editRoom || undefined,
      });
      showToast('Đã lưu tiết học.', 'success');
      setEditCell(null);
      await load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (day: number, period: number) => {
    const slot = grid[day]?.[period];
    if (!slot) return;
    try {
      await academicApi.deleteTimetableSlot(slot.id);
      showToast('Đã xóa tiết học.', 'success');
      await load();
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  const selectedClassName = classes.find(c => String(c.id) === selectedClass)?.name;

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">{menuLabels.timetable}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tạo và chỉnh sửa thời khóa biểu cho từng lớp theo học kỳ.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Học kỳ</span>
          <select value={selectedSem} onChange={e => { setSelectedSem(e.target.value); setGrid({}); }}
            className="h-10 w-44 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500">
            <option value="">-- Chọn học kỳ --</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.schoolYear?.name} – {s.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Lớp</span>
          <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setGrid({}); }}
            className="h-10 w-28 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500">
            <option value="">-- Lớp --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      {selectedSem && selectedClass ? (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
            <span className="text-sm font-semibold text-slate-700">
              TKB lớp {selectedClassName} – {semesters.find(s => String(s.id) === selectedSem)?.name}
            </span>
            <span className="text-xs text-slate-500">Nhấn vào ô để thêm/sửa tiết</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-500">Đang tải...</div>
          ) : (
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
                    <tr key={period} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-xs font-medium text-slate-500 border-r border-slate-100">
                        Tiết {period}
                      </td>
                      {DAYS.map(d => {
                        const slot = grid[d.value]?.[period];
                        const color = slot ? (subjectColorMap.get(slot.subjectId) ?? '') : '';
                        return (
                          <td key={d.value} className="px-2 py-2 text-center">
                            {slot ? (
                              <div className={`rounded-lg border p-2 text-left cursor-pointer hover:opacity-80 ${color}`}
                                onClick={() => openEdit(d.value, period)}>
                                <div className="text-xs font-semibold leading-tight">{slot.subject.name}</div>
                                <div className="text-xs opacity-75 mt-0.5 truncate">{slot.teacher.fullName.split(' ').slice(-1)[0]}</div>
                                {slot.room ? <div className="text-xs opacity-60 mt-0.5">P.{slot.room}</div> : null}
                                <button type="button"
                                  onClick={(e) => { e.stopPropagation(); void handleDelete(d.value, period); }}
                                  className="mt-1 text-xs opacity-50 hover:opacity-100">✕ Xóa</button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => openEdit(d.value, period)}
                                className="w-full h-16 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 text-xs hover:border-blue-300 hover:text-blue-400 hover:bg-blue-50 transition-colors">
                                + Thêm
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Chọn học kỳ và lớp để xem hoặc chỉnh sửa thời khóa biểu.
        </div>
      )}

      {/* Modal chỉnh sửa tiết */}
      {editCell ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-base font-semibold text-slate-900">
              {DAYS.find(d => d.value === editCell.day)?.label} – Tiết {editCell.period}
            </h3>
            <div className="space-y-3">
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                <span>Môn học *</span>
                <select required value={editSubject} onChange={e => setEditSubject(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500">
                  <option value="">-- Chọn môn --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                <span>Giáo viên *</span>
                <select required value={editTeacher} onChange={e => setEditTeacher(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500">
                  <option value="">-- Chọn GV --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                <span>Phòng học</span>
                <input value={editRoom} onChange={e => setEditRoom(e.target.value)} placeholder="Ví dụ: 101"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500" />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setEditCell(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
                Hủy
              </button>
              <button type="button" onClick={() => void handleSave()} disabled={isSaving || !editSubject || !editTeacher}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {isSaving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
