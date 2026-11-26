import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  /** Duración visible antes de iniciar el desvanecimiento (ms). Por defecto 1650 ms (~2 s total con fade). */
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ durationMs = 1650 }) => {
  const [fading, setFading] = useState(false);
  const [unmounted, setUnmounted] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setFading(true);
    }, durationMs);

    const removeTimer = window.setTimeout(() => {
      setUnmounted(true);
    }, durationMs + 380);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [durationMs]);

  if (unmounted) return null;

  return (
    <div
      role="status"
      aria-label="Cargando Sistema de Tesistas de Ingeniería Industrial UNT"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#051C3D] via-[#082F64] to-[#0B3E82] text-white transition-all duration-400 ease-out ${
        fading ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Brillo ambiental suave */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute w-[420px] h-[420px] rounded-full bg-amber-400/10 blur-3xl"
      />

      {/* Engranaje principal con tuerca hexagonal central + piñón secundario */}
      <div className="relative flex items-center justify-center mb-7">
        <div className="relative w-32 h-28 flex items-center justify-center">
          {/* Engranaje principal (dorado UNT) con tuerca hexagonal al centro */}
          <svg
            viewBox="0 0 120 120"
            className="w-24 h-24 -ml-5 drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)] animate-splash-gear-cw"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="untGoldGear" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="50%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#B48313" />
              </linearGradient>
            </defs>

            {/* 8 dientes exteriores */}
            <g fill="url(#untGoldGear)">
              <rect x="52" y="6" width="16" height="16" rx="3" />
              <rect x="52" y="98" width="16" height="16" rx="3" />
              <rect x="6" y="52" width="16" height="16" rx="3" />
              <rect x="98" y="52" width="16" height="16" rx="3" />
              <rect x="52" y="6" width="16" height="16" rx="3" transform="rotate(45 60 60)" />
              <rect x="52" y="98" width="16" height="16" rx="3" transform="rotate(45 60 60)" />
              <rect x="6" y="52" width="16" height="16" rx="3" transform="rotate(45 60 60)" />
              <rect x="98" y="52" width="16" height="16" rx="3" transform="rotate(45 60 60)" />
              <circle cx="60" cy="60" r="40" />
            </g>

            {/* Cuerpo interno azul marino */}
            <circle cx="60" cy="60" r="28" fill="#072856" />

            {/* Tuerca hexagonal central */}
            <polygon
              points="60,39 78,49.5 78,70.5 60,81 42,70.5 42,49.5"
              fill="url(#untGoldGear)"
            />
            <circle cx="60" cy="60" r="10.5" fill="#072856" />
          </svg>

          {/* Piñón secundario engranado (giro inverso) */}
          <svg
            viewBox="0 0 100 100"
            className="w-14 h-14 -ml-3.5 mt-11 drop-shadow-[0_6px_16px_rgba(0,0,0,0.3)] animate-splash-gear-ccw"
            aria-hidden="true"
          >
            <g fill="#E2E8F0">
              <rect x="43" y="6" width="14" height="15" rx="3" />
              <rect x="43" y="79" width="14" height="15" rx="3" />
              <rect x="6" y="43" width="15" height="14" rx="3" />
              <rect x="79" y="43" width="15" height="14" rx="3" />
              <rect x="43" y="6" width="14" height="15" rx="3" transform="rotate(45 50 50)" />
              <rect x="43" y="79" width="14" height="15" rx="3" transform="rotate(45 50 50)" />
              <rect x="6" y="43" width="15" height="14" rx="3" transform="rotate(45 50 50)" />
              <rect x="79" y="43" width="15" height="14" rx="3" transform="rotate(45 50 50)" />
              <circle cx="50" cy="50" r="32" />
            </g>
            <polygon
              points="50,31 66.5,40.5 66.5,59.5 50,69 33.5,59.5 33.5,40.5"
              fill="#072856"
            />
            <circle cx="50" cy="50" r="8" fill="#FDE68A" />
          </svg>
        </div>
      </div>

      {/* Identidad Institucional */}
      <div className="relative text-center px-6 animate-splash-fade-up">
        <p className="text-[11px] font-semibold tracking-[0.26em] text-amber-300/95 uppercase mb-1.5">
          Universidad Nacional de Trujillo
        </p>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Escuela de Ingeniería Industrial
        </h1>
        <p className="text-xs sm:text-sm text-blue-100/80 mt-1 font-medium">
          Sistema de Gestión de Tesistas
        </p>
      </div>

      {/* Barra de progreso fluida (~1.65 s) */}
      <div className="relative mt-7 w-48 sm:w-56 h-1.5 rounded-full bg-white/15 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200 animate-splash-progress"
          style={{ animationDuration: `${durationMs}ms` }}
        />
      </div>
    </div>
  );
};
