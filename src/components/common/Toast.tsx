import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removerToast } = useApp();

  if (toasts.length === 0) return null;

  const toast = toasts[toasts.length - 1];

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-300 shrink-0" />
  };

  const styles = {
    success: 'bg-slate-900/95 border-emerald-500/40 text-white',
    warning: 'bg-slate-900/95 border-amber-400/50 text-white',
    error: 'bg-rose-950/95 border-rose-500/50 text-white',
    info: 'bg-slate-900/95 border-sky-400/40 text-white'
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 pointer-events-none flex justify-center">
      <div
        key={toast.id}
        className={`pointer-events-auto inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border shadow-xl backdrop-blur-md max-w-full transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${styles[toast.tipo]}`}
      >
        {icons[toast.tipo]}
        <div className="min-w-0 flex items-center gap-1.5 text-xs">
          <span className="font-bold whitespace-nowrap">{toast.titulo}:</span>
          <span className="text-slate-200 truncate">{toast.mensaje}</span>
        </div>
        <button
          onClick={() => removerToast(toast.id)}
          className="text-slate-400 hover:text-white p-0.5 rounded-full transition-colors cursor-pointer shrink-0"
          aria-label="Cerrar notificación"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
