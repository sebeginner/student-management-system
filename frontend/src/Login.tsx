import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuthStore } from './lib/auth-store';

type LocationState = {
  from?: {
    pathname?: string;
  };
};

const demoAccounts = [
  'admin / Admin@123',
  'giaovu01 / Staff@123',
  'manager01 / Manager@123',
  'teacher01 / Teacher@123',
  'student01 / Student@123',
];

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isInitializing, isLoading, login } = useAuthStore();
  const from =
    (location.state as LocationState | null)?.from?.pathname ?? '/dashboard';

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch {
      setError('Tên đăng nhập hoặc mật khẩu không đúng');
    }
  };

  if (!isInitializing && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-[520px]"
      >
        <div className="mb-12 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
            <LogIn size={56} strokeWidth={2.4} />
          </div>
          <h1 className="mt-8 text-3xl font-semibold text-slate-700">
            Đăng nhập hệ thống
          </h1>
          <p className="mt-4 text-xl font-medium text-slate-500">
            Phần mềm quản lý học sinh cấp 3
          </p>
        </div>

        <div className="space-y-8">
          <label className="block space-y-3">
            <span className="text-xl font-medium text-slate-700">
              Tên đăng nhập
            </span>
            <input
              type="text"
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              className="h-16 w-full rounded-2xl border border-slate-200 px-6 text-xl text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </label>

          <label className="block space-y-3">
            <span className="text-xl font-medium text-slate-700">
              Mật khẩu
            </span>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="h-16 w-full rounded-2xl border border-slate-200 px-6 text-xl text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </label>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-10 h-16 w-full rounded-2xl bg-indigo-600 px-6 text-xl font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Tài khoản demo
          </div>
          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            {demoAccounts.map((account) => (
              <div key={account} className="font-medium">
                {account}
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}

export default Login;
