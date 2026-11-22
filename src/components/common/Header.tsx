import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LogOut,
  X,
  ShieldCheck,
  Lock,
  KeyRound,
  BookOpen,
  ClipboardList,
  Layers
} from 'lucide-react';

interface HeaderProps {
  vistaActual?: string;
  onCambiarVista?: (vista: string) => void;
  onAbrirLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  vistaActual = 'repositorio',
  onCambiarVista,
  onAbrirLogin
}) => {
  const {
    usuario,
    cerrarSesion,
    cambiarMiPassword
  } = useApp();

  // Modal de Cambio de Contraseña Exclusiva de la Secretaria
  const [modalClaveAbierto, setModalClaveAbierto] = useState<boolean>(false);
  const [claveActual, setClaveActual] = useState<string>('');
  const [claveNueva, setClaveNueva] = useState<string>('');
  const [claveConfirmar, setClaveConfirmar] = useState<string>('');
  const [errorClave, setErrorClave] = useState<string | null>(null);

  const handleGuardarNuevaClave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorClave(null);
    if (claveNueva.trim().length < 6) {
      setErrorClave('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (claveNueva.trim() !== claveConfirmar.trim()) {
      setErrorClave('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    const ok = await cambiarMiPassword(claveActual, claveNueva);
    if (ok) {
      setModalClaveAbierto(false);
      setClaveActual('');
      setClaveNueva('');
      setClaveConfirmar('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#082F64] text-white border-b border-[#051F42] shadow-md relative">
      {/* Fotografía de la Universidad Nacional de Trujillo atenuada */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="/images/puerta1-mural-unt.jpg"
          alt="Campus Universidad Nacional de Trujillo"
          className="w-full h-full object-cover object-center opacity-25 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#082F64] via-[#082F64]/75 to-[#082F64]" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
          {/* Lado Izquierdo: Escudo UNT + Logo Escuela Ingeniería Industrial */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img
              src="/images/logo-unt.png"
              alt="Universidad Nacional de Trujillo"
              className="h-10 sm:h-11 w-auto object-contain drop-shadow cursor-pointer"
              onClick={() => onCambiarVista && onCambiarVista('repositorio')}
            />
            <div className="h-7 w-px bg-white/25" />
            <img
              src="/images/logo-industrial.png"
              alt="Escuela de Ingeniería Industrial UNT"
              className="h-10 sm:h-11 w-auto object-contain drop-shadow cursor-pointer"
              onClick={() => onCambiarVista && onCambiarVista('repositorio')}
            />

            <div className="flex flex-col justify-center border-l border-white/20 pl-3 hidden sm:flex">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-white uppercase font-serif leading-tight">
                Universidad Nacional de Trujillo
              </span>
              <span className="text-[11px] sm:text-xs text-blue-200 font-sans tracking-normal leading-tight mt-0.5">
                Escuela Profesional de Ingeniería Industrial
              </span>
            </div>
          </div>

          {/* Centro: Las 2 Pestañas Principales de la Interfaz Pública (+ acceso a Panel si Secretaría está conectada) */}
          {onCambiarVista && (
            <nav className="flex items-center gap-1.5 bg-[#051F42]/70 p-1 rounded-xl border border-white/15">
              <button
                type="button"
                onClick={() => onCambiarVista('repositorio')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  vistaActual === 'repositorio'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Repositorio de Tesis</span>
              </button>

              <button
                type="button"
                onClick={() => onCambiarVista('instrucciones')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  vistaActual === 'instrucciones'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Instrucciones y Seguimiento</span>
              </button>

              {usuario && (
                <button
                  type="button"
                  onClick={() => onCambiarVista('secretaria')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    vistaActual === 'secretaria'
                      ? 'bg-emerald-400 text-slate-950 shadow-xs'
                      : 'text-emerald-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Gestión Secretaría</span>
                </button>
              )}
            </nav>
          )}

          {/* Lado Derecho: Ícono de Inicio de Sesión Exclusivo para la Secretaria */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!usuario ? (
              onAbrirLogin && (
                <button
                  type="button"
                  onClick={onAbrirLogin}
                  title="Inicio de sesión exclusivo para Secretaría Académica (@unitru.edu.pe)"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-slate-950 text-white border border-white/20 text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden md:inline">Acceso Secretaría</span>
                </button>
              )
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-white/20">
                <div className="hidden lg:flex items-center gap-2 select-none">
                  <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white leading-tight">
                      Srta. Celia · Secretaría
                    </span>
                    <span className="text-[10px] text-blue-200 leading-none font-mono">
                      {usuario.email}
                    </span>
                  </div>
                </div>

                {/* Botón Cambiar Contraseña Exclusiva de la Secretaria */}
                <button
                  type="button"
                  onClick={() => {
                    setErrorClave(null);
                    setClaveActual('');
                    setClaveNueva('');
                    setClaveConfirmar('');
                    setModalClaveAbierto(true);
                  }}
                  title="Cambiar contraseña exclusiva de Secretaría"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clave</span>
                </button>

                <button
                  type="button"
                  onClick={cerrarSesion}
                  title="Cerrar sesión de Secretaría"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-rose-500/80 border border-white/15 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para que la Secretaria cambie su contraseña exclusiva */}
      {modalClaveAbierto && usuario && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModalClaveAbierto(false)}
        >
          <div
            className="bg-white text-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#082F64] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-300" />
                <span className="font-bold text-sm">Cambiar Contraseña de Secretaría</span>
              </div>
              <button
                type="button"
                onClick={() => setModalClaveAbierto(false)}
                className="p-1 text-white/70 hover:text-white rounded hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarNuevaClave} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-slate-600 leading-relaxed">
                Actualice la contraseña exclusiva de Secretaría Académica ({usuario.email}). Quedará cifrada con SHA-256.
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contraseña Actual</label>
                <input
                  type="password"
                  required
                  value={claveActual}
                  onChange={(e) => setClaveActual(e.target.value)}
                  placeholder="Ingrese su contraseña actual"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nueva Contraseña (mín. 6 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={claveNueva}
                  onChange={(e) => setClaveNueva(e.target.value)}
                  placeholder="Nueva contraseña exclusiva"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={claveConfirmar}
                  onChange={(e) => setClaveConfirmar(e.target.value)}
                  placeholder="Repita la nueva contraseña"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              {errorClave && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                  {errorClave}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalClaveAbierto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] text-white font-bold cursor-pointer"
                >
                  Guardar Nueva Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
