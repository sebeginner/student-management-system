import { useState, type FormEvent } from 'react';
import type {
  ClassPayload,
  GradeLevel,
  SchoolClass,
  SchoolYear,
} from '../../lib/academic-api';
import { getStatusLabel } from '../../lib/statusLabels';
import { commonLabels } from '../../lib/uiText';

interface ClassFormProps {
  classItem?: SchoolClass | null;
  gradeLevels: GradeLevel[];
  isSaving: boolean;
  schoolYears: SchoolYear[];
  onCancel: () => void;
  onSubmit: (payload: ClassPayload) => Promise<void>;
}

const statusOptions = ['ACTIVE', 'INACTIVE'];

const toNumberOrUndefined = (value: string) => {
  if (!value) {
    return undefined;
  }

  return Number(value);
};

export const ClassForm = ({
  classItem,
  gradeLevels,
  isSaving,
  onCancel,
  onSubmit,
  schoolYears,
}: ClassFormProps) => {
  const [className, setClassName] = useState(classItem?.name ?? '');
  const [classCode, setClassCode] = useState(classItem?.classCode ?? '');
  const [schoolYearId, setSchoolYearId] = useState(
    String(
      classItem?.schoolYearId ??
        schoolYears.find((year) => year.isActive)?.id ??
        schoolYears[0]?.id ??
        '',
    ),
  );
  const [gradeLevelId, setGradeLevelId] = useState(
    String(classItem?.gradeLevelId ?? gradeLevels[0]?.id ?? ''),
  );
  const [maxSize, setMaxSize] = useState(String(classItem?.maxSize ?? 40));
  const [status, setStatus] = useState(classItem?.status ?? 'ACTIVE');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit({
      className: className.trim(),
      classCode: classCode.trim() || undefined,
      schoolYearId: Number(schoolYearId),
      gradeLevelId: Number(gradeLevelId),
      maxSize: toNumberOrUndefined(maxSize),
      status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Tên lớp</span>
          <input
            required
            value={className}
            onChange={(event) => setClassName(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Mã lớp</span>
          <input
            value={classCode}
            onChange={(event) => setClassCode(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Năm học</span>
          <select
            required
            value={schoolYearId}
            onChange={(event) => setSchoolYearId(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {schoolYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Khối lớp</span>
          <select
            required
            value={gradeLevelId}
            onChange={(event) => setGradeLevelId(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {gradeLevels.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Sĩ số tối đa</span>
          <input
            min={1}
            type="number"
            value={maxSize}
            onChange={(event) => setMaxSize(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
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
