import { useState, type FormEvent } from 'react';
import type { Subject, Teacher, TeacherPayload } from '../../lib/academic-api';
import { getStatusLabel } from '../../lib/statusLabels';
import { commonLabels } from '../../lib/uiText';

interface TeacherFormProps {
  isSaving: boolean;
  subjects: Subject[];
  teacher?: Teacher | null;
  onCancel: () => void;
  onSubmit: (payload: TeacherPayload) => Promise<void>;
}

const statusOptions = ['ACTIVE', 'INACTIVE'];

const cleanText = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const TeacherForm = ({
  isSaving,
  onCancel,
  onSubmit,
  subjects,
  teacher,
}: TeacherFormProps) => {
  const [teacherCode, setTeacherCode] = useState(teacher?.teacherCode ?? '');
  const [fullName, setFullName] = useState(teacher?.fullName ?? '');
  const [subjectId, setSubjectId] = useState(
    String(teacher?.subjectId ?? subjects[0]?.id ?? ''),
  );
  const [email, setEmail] = useState(teacher?.email ?? '');
  const [phone, setPhone] = useState(teacher?.phone ?? '');
  const [status, setStatus] = useState(teacher?.status ?? 'ACTIVE');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit({
      teacherCode: teacherCode.trim(),
      fullName: fullName.trim(),
      subjectId: Number(subjectId),
      email: cleanText(email),
      phone: cleanText(phone),
      status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Mã giáo viên</span>
          <input
            required
            value={teacherCode}
            onChange={(event) => setTeacherCode(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Họ và tên</span>
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Môn phụ trách</span>
          <select
            required
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>{commonLabels.status}</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {getStatusLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Thư điện tử</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Số điện thoại</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          {commonLabels.cancel}
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
        >
          {isSaving ? commonLabels.saving : commonLabels.save}
        </button>
      </div>
    </form>
  );
};
