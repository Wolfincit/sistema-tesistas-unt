import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { sanitizarTextoSeguro } from '../utils/security';
import {
  User,
  ArrowRight,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';

interface LoginPageProps {
  onClose?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onClose }) => {
  const { iniciarSesion } = useApp();
  const [email, setEmail] = useState('secretaria.industrial@unitru.edu.pe');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailSanitizado = sanitizarTextoSeguro(email);
    if (/[<>"';()]/.test(email) || emailSanitizado !== email.trim()) {
      setError('Correo no válido.');
      return;
    }

    const exito = iniciarSesion(emailSanitizado, 'secretaria', password);
    if (exito) {
      if (onClose) onClose();
    } else {
      setError('Correo o contraseña incorrectos.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#082F64] to-[#0C4D96] p-5 text-white relative">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <img
              src="/images/logo-unt.png"
              alt="Logo UNT"
              className="h-10 w-auto object-contain"
            />
            <div className="h-7 w-px bg-white/25" />
            <img
              src="/images/logo-industrial.png"
              alt="Logo Industrial UNT"
              className="h-10 w-auto object-contain"
            />
            <div className="pl-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                Ingeniería Industrial UNT
              </span>
              <h2 className="text-sm font-extrabold text-white leading-tight">
                Acceso Secretaría
              </h2>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3.5" autoComplete="off">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1">
                Correo
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="secretaria.industrial@unitru.edu.pe"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#082F64]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type={mostrarPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#082F64]"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  tabIndex={-1}
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] text-white text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Ingresar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
