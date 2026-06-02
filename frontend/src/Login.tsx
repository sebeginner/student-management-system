import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from './lib/api';
import { useAuthStore } from './lib/auth-store';

type LocationState = {
  from?: {
    pathname?: string;
  };
};

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
    } catch (loginError) {
      setError(getApiErrorMessage(loginError));
    }
  };

  if (!isInitializing && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded bg-white p-8 shadow-sm"
      >
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Dang nhap</h1>
          <p className="mt-1 text-sm text-slate-500">Student Management System</p>
        </div>

        <input
          type="text"
          placeholder="Ten dang nhap"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <input
          type="password"
          placeholder="Mat khau"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        {error ? (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isLoading ? 'Dang dang nhap...' : 'Vao he thong'}
        </button>
      </form>
    </div>
  );
}

export default Login;
