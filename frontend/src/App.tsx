import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastViewport } from './components/ToastViewport';
import { useAuthStore } from './lib/auth-store';
import { AppRouter } from './routes/AppRouter';

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <AppRouter />
      <ToastViewport />
    </BrowserRouter>
  );
}

export default App;
