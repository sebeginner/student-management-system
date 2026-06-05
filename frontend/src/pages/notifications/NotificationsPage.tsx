import { useCallback, useEffect, useState } from 'react';
import { academicApi, type Notification, type NotificationPayload } from '../../lib/academic-api';
import { getApiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { useToastStore } from '../../lib/toast-store';
import { NotificationForm } from './NotificationForm';

const TARGET_ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Học sinh',
  TEACHER: 'Giáo viên',
  ACADEMIC_STAFF: 'Giáo vụ',
  MANAGER: 'Ban giám hiệu',
  ADMIN: 'Quản trị viên',
};

export const NotificationsPage = () => {
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.showToast);
  const canCreate = user?.role !== 'STUDENT';
  const canDelete = user?.role === 'ADMIN' || user?.role === 'ACADEMIC_STAFF';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await academicApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void loadNotifications(); }, [loadNotifications]);

  const handleRead = async (id: number) => {
    try {
      await academicApi.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch {
      // silent – reading is best-effort
    }
  };

  const handleCreate = async (payload: NotificationPayload) => {
    setIsSaving(true);
    try {
      await academicApi.createNotification(payload);
      showToast('Đã gửi thông báo thành công.', 'success');
      setIsFormOpen(false);
      await loadNotifications();
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xác nhận xoá thông báo này?')) return;
    try {
      await academicApi.deleteNotification(id);
      showToast('Đã xoá thông báo.', 'success');
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    }
  };

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Thông báo</h2>
            <p className="mt-1 text-sm text-slate-600">
              {unreadCount > 0 ? (
                <span className="font-semibold text-blue-600">{unreadCount} thông báo chưa đọc</span>
              ) : (
                'Tất cả thông báo đã được đọc.'
              )}
            </p>
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Tạo thông báo
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === 'unread' ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
        >
          Chưa đọc ({unreadCount})
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        {isLoading && (
          <div className="px-4 py-8 text-center text-sm text-slate-500">Đang tải...</div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-500">Không có thông báo nào.</div>
        )}
        {!isLoading && filtered.map((n, idx) => (
          <div
            key={n.id}
            onClick={() => { if (!n.isRead) void handleRead(n.id); }}
            className={`cursor-pointer border-b border-slate-100 p-4 last:border-0 hover:bg-slate-50 ${!n.isRead ? 'bg-blue-50/40' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {!n.isRead && (
                    <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                  )}
                  <span className={`text-sm font-semibold text-slate-900 ${!n.isRead ? '' : 'font-medium'}`}>
                    {n.title}
                  </span>
                  {n.className && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      Lớp {n.className}
                    </span>
                  )}
                  {n.targetRole && !n.className && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {TARGET_ROLE_LABEL[n.targetRole] ?? n.targetRole}
                    </span>
                  )}
                  {!n.targetRole && !n.className && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Toàn trường</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">{n.content}</p>
                <p className="mt-1.5 text-xs text-slate-400">
                  {n.createdBy} · {formatDate(n.createdAt)}
                </p>
              </div>
              {canDelete && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); void handleDelete(n.id); }}
                  className="flex-shrink-0 rounded-lg border border-rose-200 px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                >
                  Xoá
                </button>
              )}
            </div>
            {/* suppress unused idx warning */}
            {idx < 0 && null}
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Tạo thông báo mới</h3>
            <NotificationForm
              isSaving={isSaving}
              onCancel={() => setIsFormOpen(false)}
              onSubmit={handleCreate}
            />
          </div>
        </div>
      )}
    </section>
  );
};
