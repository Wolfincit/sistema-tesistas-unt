import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { IngenieroJuradoItem } from '../../data/mockLogisticaSecretaria';

interface IngenieroComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: IngenieroJuradoItem[];
  placeholder?: string;
  accent?: 'default' | 'blue';
  excludeNames?: string[];
}

const normalizarBusqueda = (texto: string): string =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const IngenieroCombobox: React.FC<IngenieroComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar o escribir ingeniero...',
  accent = 'default',
  excludeNames = []
}) => {
  const [abierto, setAbierto] = useState(false);
  const [filtrarPorTexto, setFiltrarPorTexto] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAbierto(false);
        setFiltrarPorTexto(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const excluidosNorm = useMemo(
    () => new Set(excludeNames.map(normalizarBusqueda).filter(Boolean)),
    [excludeNames]
  );

  const valorNorm = normalizarBusqueda(value);

  const opcionesFiltradas = useMemo(() => {
    if (!filtrarPorTexto || !valorNorm) return options;
    return options.filter(
      (opt) =>
        normalizarBusqueda(opt.nombre).includes(valorNorm) ||
        normalizarBusqueda(opt.correo).includes(valorNorm)
    );
  }, [options, filtrarPorTexto, valorNorm]);

  const borderClass =
    accent === 'blue'
      ? 'border-blue-200 bg-blue-50/20 focus-within:border-[#082F64]'
      : 'border-slate-300 bg-white focus-within:border-[#082F64]';

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center rounded-xl border transition-colors ${borderClass}`}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onFocus={() => {
            setAbierto(true);
            setFiltrarPorTexto(false);
          }}
          onChange={(e) => {
            onChange(e.target.value);
            setAbierto(true);
            setFiltrarPorTexto(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setAbierto(false);
              setFiltrarPorTexto(false);
            } else if (e.key === 'ArrowDown' && !abierto) {
              setAbierto(true);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full px-2.5 py-2 bg-transparent text-xs text-slate-900 focus:outline-hidden min-w-0"
        />

        {value && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              onChange('');
              setFiltrarPorTexto(false);
              setAbierto(true);
              inputRef.current?.focus();
            }}
            aria-label="Limpiar"
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setAbierto((prev) => {
              const next = !prev;
              if (next) setFiltrarPorTexto(false);
              return next;
            });
          }}
          aria-label="Desplegar lista"
          className="px-2 py-2 text-slate-500 hover:text-[#082F64] cursor-pointer shrink-0 border-l border-slate-200/80"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${abierto ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {abierto && (
        <div className="absolute left-0 right-0 mt-1 z-50 bg-white rounded-xl border border-slate-200 shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
          {opcionesFiltradas.length === 0 ? (
            <div className="px-3 py-2.5 text-[11px] text-slate-500">
              No figura en la lista; se guardará el nombre escrito.
            </div>
          ) : (
            opcionesFiltradas.map((opt) => {
              const optNorm = normalizarBusqueda(opt.nombre);
              const seleccionado = optNorm === valorNorm;
              const yaEnOtroCargo = !seleccionado && excluidosNorm.has(optNorm);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(opt.nombre);
                    setAbierto(false);
                    setFiltrarPorTexto(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                    seleccionado
                      ? 'bg-blue-50 text-[#082F64]'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate flex items-center gap-1.5">
                      <span className="truncate">{opt.nombre}</span>
                      {yaEnOtroCargo && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-semibold shrink-0">
                          Asignado
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[10px] font-mono truncate ${
                        opt.correo ? 'text-emerald-700' : 'text-amber-600'
                      }`}
                    >
                      {opt.correo || 'Sin correo registrado'}
                    </div>
                  </div>
                  {seleccionado && (
                    <Check className="w-3.5 h-3.5 text-[#082F64] shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
