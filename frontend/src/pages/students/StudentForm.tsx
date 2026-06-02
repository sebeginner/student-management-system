import { useState, type FormEvent } from 'react';
import type { Student, StudentPayload } from '../../lib/academic-api';
import { toDateInputValue } from '../../lib/date';

interface StudentFormProps {
  student?: Student | null;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (payload: StudentPayload) => Promise<void>;
}

const statusOptions = [
  'PENDING_CLASS_ASSIGNMENT',
  'ACTIVE',
  'SUSPENDED',
  'TRANSFERRED',
  'GRADUATED',
  'INACTIVE',
];

const genderOptions = ['MALE', 'FEMALE', 'OTHER'];

const cleanText = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const StudentForm = ({
  isSaving,
  onCancel,
  onSubmit,
  student,
}: StudentFormProps) => {
  const [studentCode, setStudentCode] = useState(student?.studentCode ?? '');
  const [fullName, setFullName] = useState(student?.fullName ?? '');
  const [gender, setGender] = useState(student?.gender ?? 'MALE');
  const [dateOfBirth, setDateOfBirth] = useState(
    toDateInputValue(student?.dateOfBirth),
  );
  const [admissionDate, setAdmissionDate] = useState(
    toDateInputValue(student?.admissionDate),
  );
  const [address, setAddress] = useState(student?.address ?? '');
  const [email, setEmail] = useState(student?.email ?? '');
  const [status, setStatus] = useState(
    student?.status ?? 'PENDING_CLASS_ASSIGNMENT',
  );
  const [note, setNote] = useState(student?.note ?? '');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit({
      studentCode: studentCode.trim(),
      fullName: fullName.trim(),
      gender,
      dateOfBirth,
      admissionDate,
      address: cleanText(address),
      email: cleanText(email),
      status,
      note: cleanText(note),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Student code</span>
          <input
            required
            value={studentCode}
            onChange={(event) => setStudentCode(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Full name</span>
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Gender</span>
          <select
            value={gender}
            onChange={(event) => setGender(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {genderOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Date of birth</span>
          <input
            required
            type="date"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Admission date</span>
          <input
            required
            type="date"
            value={admissionDate}
            onChange={(event) => setAdmissionDate(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
          <span>Address</span>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm font-medium text-slate-700">
        <span>Note</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="min-h-20 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};
