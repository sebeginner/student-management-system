import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  academicApi,
  type CreateUserPayload,
  type ResetPasswordPayload,
  type SystemUser,
  type UpdateUserPayload,
} from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { formatDisplayDate } from '../../lib/date';
import { getStatusLabel } from '../../lib/statusLabels';
import { useToastStore } from '../../lib/toast-store';
import { commonLabels, menuLabels } from '../../lib/uiText';
import { UserForm } from './UserForm';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  ACADEMIC_STAFF: 'Giáo vụ',
  MANAGER: 'Ban giám hiệu',
  TEACHER: 'Giáo viên',
  STUDENT: 'Học sinh',
};

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'border-violet-200 bg-violet-50 text-violet-700',
  ACADEMIC_STAFF: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  MANAGER: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  TEACHER: 'border-sky-200 bg-sky-50 text-sky-700',
  STUDENT: 'border-amber-200 bg-amber-50 text-amber-700',
};

const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả vai trò' },
  { value: 'ADMIN', label: 'Quản trị viên' },
  { value: 'ACADEMIC_STAFF', label: 'Giáo vụ' },
  { value: 'MANAGER', label: 'Ban giám hiệu' },
  { value: 'TEACHER', label: 'Giáo viên' },
  { value: 'STUDENT', label: 'Học sinh' },
];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'INACTIVE', label: 'Ngưng hoạt động' },
];

export const UsersPage = () => {
  const showToast = useToastStore((state) => state.showToast);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [keyword, setKeyword] = useState('');
  const [roleName, setRoleName] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [resetTarget, setResetTarget] = useState<SystemUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await academicApi.getUsers({
        keyword: keyword.trim() || undefined,
        roleName: roleName || undefined,
        status: statusFilter || undefined,
      });
      setUsers(data);
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [keyword, roleName, statusFilter, showToast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    void loadUsers();
  };

  const handleSubmit = async (payload: CreateUserPayload | UpdateUserPayload) => {
    setIsSaving(true);
    try {
      if (editingUser) {
        await academicApi.updateUser(editingUser.id, payload as UpdateUserPayload);
        showToast('Cập nhật người dùng thành công.', 'success');
      } else {
        await academicApi.createUser(payload as CreateUserPayload);
        showToast('Tạo người dùng thành công.', 'success');
      }
      setIsFormOpen(false);
      setEditingUser(null);
      await loadUsers();
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setIsResetting(true);
    try {
      const payload: ResetPasswordPayload = { newPassword };
      await academicApi.resetUserPassword(resetTarget.id, payload);
      showToast('Đặt lại mật khẩu thành công.', 'success');
      setResetTarget(null);
      setNewPassword('');
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {menuLabels.users}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Tạo và quản lý tài khoản đăng nhập, phân vai trò cho người dùng.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setEditingUser(null); setIsFormOpen(true); }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Thêm người dùng
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>{commonLabels.search}</span>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tên đăng nhập, họ tên, email"
            className="h-10 w-64 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Vai trò</span>
          <select
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="h-10 w-44 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {ROLE_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>{commonLabels.status}</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 w-44 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {commonLabels.apply}
        </button>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Tài khoản</th>
                <th className="px-4 py-3">Họ và tên</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Liên kết</th>
                <th className="px-4 py-3">{commonLabels.status}</th>
                <th className="px-4 py-3">Đăng nhập cuối</th>
                <th className="px-4 py-3 text-right">{commonLabels.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {commonLabels.loading}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {commonLabels.noData}
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{u.username}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">{u.fullName}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE[u.role.name] ?? 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                      {ROLE_LABELS[u.role.name] ?? u.role.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {u.student
                      ? `HS: ${u.student.studentCode}`
                      : u.teacher
                        ? `GV: ${u.teacher.teacherCode}`
                        : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${u.status === 'ACTIVE' ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                      {getStatusLabel(u.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {u.lastLoginAt ? formatDisplayDate(u.lastLoginAt) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setResetTarget(u); setNewPassword(''); }}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Đặt lại MK
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingUser(u); setIsFormOpen(true); }}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        {commonLabels.edit}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit modal */}
      {isFormOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-5 text-lg font-semibold text-slate-900">
              {editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}
            </h3>
            <UserForm
              user={editingUser}
              isSaving={isSaving}
              onSubmit={(p) => void handleSubmit(p)}
              onCancel={() => { setIsFormOpen(false); setEditingUser(null); }}
            />
          </div>
        </div>
      ) : null}

      {/* Reset password modal */}
      {resetTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-base font-semibold text-slate-900">
              Đặt lại mật khẩu – {resetTarget.username}
            </h3>
            <form onSubmit={(e) => void handleResetPassword(e)} className="space-y-4">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-slate-700">Mật khẩu mới *</span>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  disabled={isResetting}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {commonLabels.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isResetting ? 'Đang lưu...' : 'Đặt lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
};
