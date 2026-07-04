import { useEffect, useState } from 'react';
import { type Subject, type SubjectPayload } from '../../lib/academic-api';

interface Props {
  item: Subject | null;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (payload: SubjectPayload) => void;
}

export const SubjectForm = ({ item, isSaving, onCancel, onSubmit }: Props) => {
  const [subjectCode, setSubjectCode] = useState('');
  const [name, setName] = useState('');
  const [coefficient, setCoefficient] = useState('1');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setSubjectCode(item.subjectCode);
      setName(item.name);
      setCoefficient(String(item.coefficient));
      setDescription(item.description ?? '');
      setIsActive(item.isActive);
    } else {
      setSubjectCode('');
      setName('');
      setCoefficient('1');
      setDescription('');
      setIsActive(true);
    }
    setError('');
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const coef = Number(coefficient);
    if (!subjectCode.trim() || !name.trim() || !coefficient) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }
    if (isNaN(coef) || coef < 1) {
      setError('Hệ số môn học phải lớn hơn hoặc bằng 1.');
      return;
    }
    onSubmit({
      subjectCode: subjectCode.trim(),
      name: name.trim(),
      coefficient: coef,
      description: description.trim() || undefined,
      isActive,
    });
  };

  const inputClass = 'h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  const labelClass = 'space-y-1.5 text-sm font-medium text-slate-700';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <label className={labelClass}>
          <span>Mã môn học <span className="text-rose-500">*</span></span>
          <input value={subjectCode} onChange={e => setSubjectCode(e.target.value)} placeholder="MATH" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span>Hệ số <span className="text-rose-500">*</span></span>
          <input type="number" min={1} value={coefficient} onChange={e => setCoefficient(e.target.value)} className={inputClass} />
        </label>
      </div>

      <label className={labelClass}>
        <span>Tên môn học <span className="text-rose-500">*</span></span>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Toán" className={inputClass} />
      </label>

      <label className={labelClass}>
        <span>Mô tả</span>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
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
          {isSaving ? 'Đang lưu...' : item ? 'Cập nhật' : 'Tạo môn học'}
        </button>
      </div>
    </form>
  );
};
