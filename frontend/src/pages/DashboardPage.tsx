import { Link } from 'react-router-dom';
import { getMenuItemsByRole } from '../components/layout/menu';
import { useAuthStore } from '../lib/auth-store';

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const menuItems = user ? getMenuItemsByRole(user.role) : [];

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">
          Xin chao {user?.fullName ?? user?.username}. Chon nhanh module theo
          vai tro hien tai.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded border border-slate-200 bg-white p-4 text-sm font-medium text-slate-800 transition hover:border-blue-300 hover:bg-blue-50"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
};
