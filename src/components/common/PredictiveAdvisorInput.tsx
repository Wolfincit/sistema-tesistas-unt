import React, { useState, useRef, useEffect, useMemo } from 'react';
import { UserCheck, Search, Check, GraduationCap } from 'lucide-react';
import { MOCK_TESIS } from '../../data/mockTesis';

export interface AdvisorOption {
  nombre: string;
  departamento: string;
  totalTesis: number;
}

// Normalizar texto para búsqueda insensible a tildes y mayúsculas
function normalizar(txt: string): string {
  return (txt || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// Construir catálogo dinámico de docentes asesores reales desde el repositorio UNT de Ingeniería Industrial
function construirCatalogoAsesoresUNT(): AdvisorOption[] {
  const mapa = new Map<string, { nombre: string; areas: Set<string>; total: number }>();

  MOCK_TESIS.filter((t) => t.universidad === 'Universidad Nacional de Trujillo').forEach((t) => {
    const raw = (t.asesor || '').trim();
    if (!raw || raw.startsWith('Docente Asesor')) return;
    const key = normalizar(raw);
    const actual = mapa.get(key);
    if (actual) {
      actual.total += 1;
      actual.areas.add(t.area);
    } else {
      mapa.set(key, { nombre: raw, areas: new Set([t.area]), total: 1 });
    }
  });

  // Asegurar docentes referentes adicionales de la Escuela Profesional de Ingeniería Industrial UNT
  const baseReferentes: { nombre: string; area: string }[] = [
    { nombre: 'Dr. Sifuentes Inostroza, Hermes Roberto', area: 'Logística y Cadena de Suministro' },
    { nombre: 'Dra. Calderón Cruz, Ana María', area: 'Gestión de la Calidad' },
    { nombre: 'Ing. Vásquez Alfaro, Carlos Alberto', area: 'Producción y Operaciones' },
    { nombre: 'Dr. Reyes Cruzado, Jorge Luis', area: 'Simulación y Operaciones' }
  ];

  baseReferentes.forEach((ref) => {
    const key = normalizar(ref.nombre);
    if (!mapa.has(key)) {
      mapa.set(key, { nombre: ref.nombre, areas: new Set([ref.area]), total: 1 });
    }
  });

  return Array.from(mapa.values())
    .map((entry) => ({
      nombre: entry.nombre,
      departamento: Array.from(entry.areas).join(' · '),
      totalTesis: entry.total
    }))
    .sort((a, b) => b.totalTesis - a.totalTesis || a.nombre.localeCompare(b.nombre));
}

export const ASESORES_OFICIALES_UNT: AdvisorOption[] = construirCatalogoAsesoresUNT();

interface PredictiveAdvisorInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
}

export const PredictiveAdvisorInput: React.FC<PredictiveAdvisorInputProps> = ({
  value,
  onChange,
  placeholder = 'Escriba el apellido o nombre del docente asesor...',
  required = false,
  className = '',
  label
}) => {
  const [dropdownAbierto, setDropdownAbierto] = useState<boolean>(false);
  const [indiceResaltado, setIndiceResaltado] = useState<number>(-1);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const coincidencias = useMemo(() => {
    const query = normalizar(value);
    if (!query) return [];
    return ASESORES_OFICIALES_UNT.filter((asesor) => {
      return normalizar(asesor.nombre).includes(query) || normalizar(asesor.departamento).includes(query);
    }).slice(0, 10);
  }, [value]);

  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setDropdownAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const handleSeleccionar = (asesorNombre: string) => {
    onChange(asesorNombre);
    setDropdownAbierto(false);
    setIndiceResaltado(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownAbierto || coincidencias.length === 0) {
      if (e.key === 'ArrowDown' && coincidencias.length > 0) {
        setDropdownAbierto(true);
        setIndiceResaltado(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceResaltado((prev) => (prev < coincidencias.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceResaltado((prev) => (prev > 0 ? prev - 1 : coincidencias.length - 1));
    } else if (e.key === 'Enter') {
      if (indiceResaltado >= 0 && indiceResaltado < coincidencias.length) {
        e.preventDefault();
        handleSeleccionar(coincidencias[indiceResaltado].nombre);
      }
    } else if (e.key === 'Escape') {
      setDropdownAbierto(false);
    }
  };

  return (
    <div ref={contenedorRef} className="relative w-full space-y-1">
      {label && (
        <label className="block text-slate-700 font-bold text-xs">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setDropdownAbierto(true);
            setIndiceResaltado(-1);
          }}
          onFocus={() => {
            if (value.trim()) setDropdownAbierto(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full p-2.5 pr-8 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-medium focus:ring-2 focus:ring-unt-blue/20 focus:border-unt-blue focus:outline-hidden transition-all ${className}`}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
      </div>

      {/* Menú Flotante Predictivo con Coincidencias Reales del Repositorio UNT */}
      {dropdownAbierto && coincidencias.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1">
          <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Asesores en Repositorio UNT ({coincidencias.length})</span>
            <span className="text-[9px] text-unt-blue font-normal">Enter o clic para seleccionar</span>
          </div>

          {coincidencias.map((item, idx) => {
            const resaltado = idx === indiceResaltado;
            const esSeleccionadoExacto = normalizar(item.nombre) === normalizar(value);

            return (
              <div
                key={item.nombre}
                onMouseEnter={() => setIndiceResaltado(idx)}
                onClick={() => handleSeleccionar(item.nombre)}
                className={`p-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                  resaltado
                    ? 'bg-blue-50/90 text-unt-blue'
                    : esSeleccionadoExacto
                    ? 'bg-emerald-50 text-emerald-900 font-semibold'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="font-bold flex items-center gap-1.5 text-xs truncate">
                    <UserCheck className="w-3.5 h-3.5 text-unt-blue shrink-0" />
                    <span className="truncate">{item.nombre}</span>
                    {esSeleccionadoExacto && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate pl-5">
                    {item.departamento}
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200">
                    <GraduationCap className="w-3 h-3 text-unt-blue" />
                    <span>{item.totalTesis} tesis</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dropdownAbierto && value.trim().length >= 3 && coincidencias.length === 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg z-50 text-xs text-slate-500">
          <p className="text-[11px] leading-snug">
            No se halló a "<strong>{value}</strong>" en el repositorio. Puede continuar escribiendo el nombre completo según su Resolución Decanal.
          </p>
        </div>
      )}
    </div>
  );
};
