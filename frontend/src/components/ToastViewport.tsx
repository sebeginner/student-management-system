import { useToastStore } from '../lib/toast-store';

const toastClasses = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-slate-200 bg-white text-slate-800',
};

export const ToastViewport = () => {
  const { removeToast, toasts } = useToastStore();

  return (
    <div className="fixed right-4 top-4 z-50 w-80 space-y-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => removeToast(toast.id)}
          className={`w-full rounded border px-4 py-3 text-left text-sm shadow-sm ${toastClasses[toast.type]}`}
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
};
