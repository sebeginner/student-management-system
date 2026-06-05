import { useEffect, useState } from 'react';
import { academicApi, type NotificationPayload, type TeacherNotificationClass } from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';

interface Props {
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (payload: NotificationPayload) => void;
}

const TARGET_ROLE_OPTIONS = [
  { value: '', label: 'Tất cả (toàn trường)' },
  { value: 'STUDENT', label: 'Học sinh' },
  { value: 'TEACHER', label: 'Giáo viên' },
  { value: 'ACADEMIC_STAFF', label: 'Giáo vụ' },
  { value: 'MANAGER', label: 'Ban giám hiệu' },
  { value: 'ADMIN', label: 'Quản trị viên' },
];

const TYPE_LABEL: Record<string, string> = {
  HOMEROOM: 'GVCN',
  SUBJECT: 'GVBM',
};

export const NotificationForm = ({ isSaving, onCancel, onSubmit }: Props) => {
  const user = useAuthStore((s) => s.user);
  const isTeacher = user?.role === 'TEACHER';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [classId, setClassId] = useState('');
  const [teacherClasses, setTeacherClasses] = useState<TeacherNotificationClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isTeacher) return;
    setLoadingClasses(true);
    academicApi.getTeacherNotificationClasses()
      .then(setTeacherClasses)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoadingClasses(false));
  }, [isTeacher]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !content.trim()) {
      setError('Vui lòng điền tiêu đề và nội dung.');
      return;
    }
    if (isTeacher && !classId) {
      setError('Vui lòng chọn lớp cần gửi thông báo.');
      return;
    }
    onSubmit({
      title: title.trim(),
      content: content.trim(),
      targetRole: isTeacher ? undefined : (targetRole || undefined),
      classId: classId ? Number(classId) : undefined,
    });
  };

  const inputClass = 'h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  const labelClass = 'space-y-1.5 text-sm font-medium text-slate-700';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className={labelClass}>
        <span>Tiêu đề <span className="text-rose-500">*</span></span>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề thông báo"
          className={inputClass}
        />
      </label>

      <label className={labelClass}>
        <span>Nội dung <span className="text-rose-500">*</span></span>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          placeholder="Nhập nội dung thông báo..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      {isTeacher ? (
        <label className={labelClass}>
          <span>Gửi đến lớp <span className="text-rose-500">*</span></span>
          {loadingClasses ? (
            <div className="text-sm text-slate-500">Đang tải danh sách lớp...</div>
          ) : teacherClasses.length === 0 ? (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Bạn chưa được phân công đến lớp nào.
            </div>
          ) : (
            <select
              value={classId}
              onChange={e => setClassId(e.target.value)}
              className={inputClass}
            >
              <option value="">-- Chọn lớp --</option>
              {teacherClasses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({TYPE_LABEL[c.type] ?? c.type})
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-slate-400">Thông báo sẽ được gửi đến học sinh của lớp đã chọn.</p>
        </label>
      ) : (
        <label className={labelClass}>
          <span>Gửi đến</span>
          <select
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            className={inputClass}
          >
            {TARGET_ROLE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      )}

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Huỷ
        </button>
        <button type="submit" disabled={isSaving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {isSaving ? 'Đang gửi...' : 'Gửi thông báo'}
        </button>
      </div>
    </form>
  );
};
