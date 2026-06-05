import { Bell, LogOut, School2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { academicApi } from '../../lib/academic-api';
import { useAuthStore, type UserRole } from '../../lib/auth-store';
import { appText } from '../../lib/uiText';
import { getMenuItemsByRole, roleLabels } from './menu';

const roleBadgeClasses: Record<UserRole, string> = {
  ADMIN: 'border-violet-200 bg-violet-50 text-violet-700',
  ACADEMIC_STAFF: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  MANAGER: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  TEACHER: 'border-sky-200 bg-sky-50 text-sky-700',
  STUDENT: 'border-amber-200 bg-amber-50 text-amber-700',
};

export const MainLayout = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const menuItems = user ? getMenuItemsByRole(user.role) : [];
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    academicApi.getUnreadCount()
      .then(d => setUnreadCount(d.count))
      .catch(() => {/* silent */});
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
      <aside className="hidden w-64 shrink-0 flex-col bg-emerald-900 text-white shadow-xl md:flex xl:w-72">
        <div className="flex min-h-24 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
            <School2 size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-tight">
              {appText.appName}
            </h1>
            <p className="mt-1 text-sm font-medium text-emerald-100">
              {appText.appSubtitle}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {menuItems.map((item) => (
            <NavLink
              key={`${item.to}-${item.label}`}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition',
                  isActive
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-emerald-50/90 hover:bg-white/10 hover:text-white',
                ].join(' ')
              }
            >
              <item.icon size={19} strokeWidth={2.2} className="shrink-0" />
              <span className="min-w-0">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-emerald-50/90 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={19} />
            {appText.logout}
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span>{appText.appSubtitle}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{appText.appName}</span>
            </div>
            <div className="mt-1 truncate text-base font-semibold text-slate-900 md:text-lg">
              {user
                ? `Xin chào, ${user.fullName ?? user.username}`
                : appText.appName}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {user ? (
              <span
                className={`hidden rounded-full border px-3 py-1 text-xs font-bold sm:inline-flex ${
                  roleBadgeClasses[user.role]
                }`}
              >
                {roleLabels[user.role]}
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              title="Thông báo"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <div className="hidden text-right md:block">
              <div className="text-sm font-semibold text-slate-800">
                {user?.fullName ?? user?.username}
              </div>
              <div className="text-xs text-slate-500">{user?.username}</div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              title={appText.logout}
              aria-label={appText.logout}
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">{appText.logout}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6 xl:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
