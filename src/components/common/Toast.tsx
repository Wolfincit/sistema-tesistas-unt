import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removerToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          info: <Info className="w-5 h-5 text-unt-blue shrink-0" />
        };

        const borderColors = {
          success: 'border-emerald-200 bg-white/95 text-slate-800 shadow-emerald-900/5',
          warning: 'border-amber-200 bg-white/95 text-slate-800 shadow-amber-900/5',
          error: 'border-rose-200 bg-white/95 text-slate-800 shadow-rose-900/5',
          info: 'border-slate-200 bg-white/95 text-slate-800 shadow-slate-900/5'
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-bottom-2 ${borderColors[toast.tipo]}`}
          >
            <div className="mt-0.5">{icons[toast.tipo]}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900">{toast.titulo}</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.mensaje}</p>
            </div>
            <button
              onClick={() => removerToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 rounded-lg transition-colors"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
