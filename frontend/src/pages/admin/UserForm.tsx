import { useState, type FormEvent } from 'react';
import type { CreateUserPayload, SystemUser, UpdateUserPayload } from '../../lib/academic-api';
import { commonLabels } from '../../lib/uiText';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Quản trị viên' },
  { value: 'ACADEMIC_STAFF', label: 'Giáo vụ' },
  { value: 'MANAGER', label: 'Ban giám hiệu' },
  { value: 'TEACHER', label: 'Giáo viên' },
  { value: 'STUDENT', label: 'Học sinh' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'INACTIVE', label: 'Ngưng hoạt động' },
];

interface Props {
  user: SystemUser | null;
  isSaving: boolean;
  onSubmit: (payload: CreateUserPayload | UpdateUserPayload) => void;
  onCancel: () => void;
}

export const UserForm = ({ user, isSaving, onSubmit, onCancel }: Props) => {
  const isEdit = Boolean(user);

  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [roleName, setRoleName] = useState(user?.role.name ?? 'ACADEMIC_STAFF');
  const [status, setStatus] = useState(user?.status ?? 'ACTIVE');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState(user?.studentId ? String(user.studentId) : '');
  const [teacherId, setTeacherId] = useState(user?.teacherId ? String(user.teacherId) : '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      const payload: UpdateUserPayload = {
        fullName: fullName.trim(),
        email: email.trim(),
        status,
        roleName,
        studentId: studentId ? Number(studentId) : null,
        teacherId: teacherId ? Number(teacherId) : null,
      };
      onSubmit(payload);
    } else {
      const payload: CreateUserPayload = {
        username: username.trim(),
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        roleName,
        studentId: studentId ? Number(studentId) : undefined,
        teacherId: teacherId ? Number(teacherId) : undefined,
      };
      onSubmit(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!isEdit ? (
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-slate-700">Tên đăng nhập *</span>
            <input
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        ) : null}

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-slate-700">Họ và tên *</span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-slate-700">Email *</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        {!isEdit ? (
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-slate-700">Mật khẩu *</span>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        ) : null}

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-slate-700">Vai trò *</span>
          <select
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        {isEdit ? (
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-slate-700">Trạng thái</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-slate-700">ID học sinh liên kết</span>
          <input
            type="number"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Để trống nếu không có"
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-slate-700">ID giáo viên liên kết</span>
          <input
            type="number"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            placeholder="Để trống nếu không có"
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {commonLabels.cancel}
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? commonLabels.saving : commonLabels.save}
        </button>
      </div>
    </form>
  );
};
