import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastViewport } from './components/ToastViewport';
import { useAuthStore } from './lib/auth-store';
import { AppRouter } from './routes/AppRouter';

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRouter />
        <ToastViewport />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
