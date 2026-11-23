import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LogOut,
  ShieldCheck,
  Lock,
  BookOpen,
  ClipboardList,
  Layers,
  HelpCircle
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
  const { usuario, cerrarSesion } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-[#082F64] text-white border-b border-[#051F42] shadow-md relative">
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
          {/* Logos Institucionales */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img
              src="/images/logo-unt.png"
              alt="Universidad Nacional de Trujillo"
              className="h-10 sm:h-11 w-auto object-contain drop-shadow cursor-pointer"
              onClick={() =>
                onCambiarVista && onCambiarVista(usuario ? 'secretaria' : 'repositorio')
              }
            />
            <div className="h-7 w-px bg-white/25" />
            <img
              src="/images/logo-industrial.png"
              alt="Escuela de Ingeniería Industrial UNT"
              className="h-10 sm:h-11 w-auto object-contain drop-shadow cursor-pointer"
              onClick={() =>
                onCambiarVista && onCambiarVista(usuario ? 'secretaria' : 'repositorio')
              }
            />

            <div className="flex flex-col justify-center border-l border-white/20 pl-3 hidden sm:flex">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-white uppercase font-serif leading-tight">
                Universidad Nacional de Trujillo
              </span>
              <span className="text-[11px] sm:text-xs text-blue-200 font-sans tracking-normal leading-tight mt-0.5">
                Escuela de Ingeniería Industrial
              </span>
            </div>
          </div>

          {/* Navegación Central:
              - Público (!usuario): Repositorio de Tesis | Instrucciones
              - Secretaría (usuario): Panel de Secretaría | Editar Instrucciones | Preguntas Frecuentes (SIN Repositorio) */}
          {onCambiarVista && (
            <nav className="flex items-center gap-1.5 bg-[#051F42]/70 p-1 rounded-xl border border-white/15">
              {!usuario ? (
                <>
                  <button
                    type="button"
                    onClick={() => onCambiarVista('repositorio')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      vistaActual === 'instrucciones'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-blue-100 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Instrucciones</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onCambiarVista('secretaria')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      vistaActual === 'secretaria'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-blue-100 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Interfaz de Secretaría</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCambiarVista('preguntas-frecuentes')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      vistaActual === 'preguntas-frecuentes'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-blue-100 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Preguntas Frecuentes</span>
                  </button>
                </>
              )}
            </nav>
          )}

          {/* Lado Derecho: Acceso Secretaría o Perfil Limpio (sin el icono de llavecita) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!usuario ? (
              onAbrirLogin && (
                <button
                  type="button"
                  onClick={onAbrirLogin}
                  title="Inicio de sesión exclusivo para Secretaría Académica"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-slate-950 text-white border border-white/20 text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden md:inline">Acceso Secretaría</span>
                </button>
              )
            ) : (
              <div className="flex items-center gap-2.5 pl-2 border-l border-white/20">
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

                <button
                  type="button"
                  onClick={cerrarSesion}
                  title="Salir del panel de Secretaría"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-rose-500 border border-white/15 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
