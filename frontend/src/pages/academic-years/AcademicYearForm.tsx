import { useEffect, useState } from 'react';
import { type AcademicYearPayload, type SchoolYear } from '../../lib/academic-api';

interface Props {
  item: SchoolYear | null;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (payload: AcademicYearPayload) => void;
}

export const AcademicYearForm = ({ item, isSaving, onCancel, onSubmit }: Props) => {
  const [name, setName] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setStartYear(String(item.startYear));
      setEndYear(String(item.endYear));
      setStartDate(item.startDate?.slice(0, 10) ?? '');
      setEndDate(item.endDate?.slice(0, 10) ?? '');
      setIsActive(item.isActive);
    } else {
      setName('');
      setStartYear('');
      setEndYear('');
      setStartDate('');
      setEndDate('');
      setIsActive(false);
    }
    setError('');
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const sy = Number(startYear);
    const ey = Number(endYear);
    if (!name.trim() || !startYear || !endYear || !startDate || !endDate) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }
    if (sy >= ey) {
      setError('Năm bắt đầu phải nhỏ hơn năm kết thúc.');
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setError('Ngày bắt đầu phải nhỏ hơn ngày kết thúc.');
      return;
    }
    onSubmit({ name: name.trim(), startYear: sy, endYear: ey, startDate, endDate, isActive });
  };

  const inputClass = 'h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  const labelClass = 'space-y-1.5 text-sm font-medium text-slate-700';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className={labelClass}>
        <span>Tên năm học <span className="text-rose-500">*</span></span>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="2026-2027" className={inputClass} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className={labelClass}>
          <span>Năm bắt đầu <span className="text-rose-500">*</span></span>
          <input type="number" value={startYear} onChange={e => setStartYear(e.target.value)} placeholder="2026" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span>Năm kết thúc <span className="text-rose-500">*</span></span>
          <input type="number" value={endYear} onChange={e => setEndYear(e.target.value)} placeholder="2027" className={inputClass} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className={labelClass}>
          <span>Ngày bắt đầu <span className="text-rose-500">*</span></span>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span>Ngày kết thúc <span className="text-rose-500">*</span></span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
        </label>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
        <span>Đặt làm năm học đang hoạt động</span>
        {isActive && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            Sẽ tắt các năm học khác
          </span>
        )}
      </label>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Huỷ
        </button>
        <button type="submit" disabled={isSaving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {isSaving ? 'Đang lưu...' : item ? 'Cập nhật' : 'Tạo năm học'}
        </button>
      </div>
    </form>
  );
};
