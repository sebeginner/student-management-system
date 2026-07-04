import { useEffect, useState } from 'react';
import { type GradeLevel, type GradeLevelPayload } from '../../lib/academic-api';

interface Props {
  item: GradeLevel | null;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (payload: GradeLevelPayload) => void;
}

export const GradeLevelForm = ({ item, isSaving, onCancel, onSubmit }: Props) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setLevel(String(item.level));
      setIsActive(item.isActive);
    } else {
      setName('');
      setLevel('');
      setIsActive(true);
    }
    setError('');
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const lvl = Number(level);
    if (!name.trim() || !level) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }
    if (isNaN(lvl) || lvl < 10 || lvl > 12) {
      setError('Khối lớp phải nằm trong khoảng 10-12.');
      return;
    }
    onSubmit({ name: name.trim(), level: lvl, isActive });
  };

  const inputClass = 'h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  const labelClass = 'space-y-1.5 text-sm font-medium text-slate-700';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className={labelClass}>
        <span>Tên khối lớp <span className="text-rose-500">*</span></span>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="10" className={inputClass} />
      </label>

      <label className={labelClass}>
        <span>Khối (10-12) <span className="text-rose-500">*</span></span>
        <input type="number" min={10} max={12} value={level} onChange={e => setLevel(e.target.value)} placeholder="10" className={inputClass} />
      </label>

      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
        <span>Đang hoạt động</span>
      </label>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Huỷ
        </button>
        <button type="submit" disabled={isSaving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {isSaving ? 'Đang lưu...' : item ? 'Cập nhật' : 'Tạo khối lớp'}
        </button>
      </div>
    </form>
  );
};
