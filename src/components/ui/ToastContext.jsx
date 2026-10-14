import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (title, message) => addToast({ title, message, type: 'success' }),
    error: (title, message) => addToast({ title, message, type: 'error', duration: 5500 }),
    warning: (title, message) => addToast({ title, message, type: 'warning', duration: 5000 }),
    info: (title, message) => addToast({ title, message, type: 'info' })
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full px-4">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-bottom-3 ${
              t.type === 'success'
                ? 'bg-white/95 border-emerald-300 text-slate-800 shadow-emerald-500/10'
                : t.type === 'error'
                ? 'bg-white/95 border-rose-300 text-slate-800 shadow-rose-500/10'
                : t.type === 'warning'
                ? 'bg-white/95 border-amber-300 text-slate-800 shadow-amber-500/10'
                : 'bg-white/95 border-blue-200 text-slate-800 shadow-blue-500/10'
            }`}
            style={{ borderLeftWidth: '5px' }}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-sm font-semibold text-slate-900">{t.title}</p>}
              {t.message && <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{t.message}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-slate-400 hover:text-slate-700 transition-colors p-1 -mr-1 -mt-1 rounded-md"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      success: (t, m) => console.log('Toast success:', t, m),
      error: (t, m) => console.error('Toast error:', t, m),
      warning: (t, m) => console.warn('Toast warning:', t, m),
      info: (t, m) => console.log('Toast info:', t, m),
    };
  }
  return ctx;
}
