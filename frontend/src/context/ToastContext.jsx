import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      {/* Toast container */}
      <div className="fixed right-4 top-20 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          let bgColor = 'bg-zinc-900 border-zinc-800 text-white';
          let icon = 'ℹ️';
          if (toast.type === 'success') {
            bgColor = 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200';
            icon = '✅';
          } else if (toast.type === 'error') {
            bgColor = 'bg-red-950/90 border-red-500/30 text-red-200';
            icon = '❌';
          } else if (toast.type === 'warning') {
            bgColor = 'bg-amber-950/90 border-amber-500/30 text-amber-200';
            icon = '⚠️';
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-2xl border ${bgColor} p-4 shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-right-5 pointer-events-auto cursor-pointer`}
              onClick={() => removeToast(toast.id)}
            >
              <span className="text-lg leading-none">{icon}</span>
              <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
              <button
                type="button"
                className="ml-auto text-white/40 hover:text-white transition duration-200 text-xs font-bold"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
