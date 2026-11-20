import React from 'react';
import { DocumentoExpediente } from '../../types';
import { CheckCircle2, Clock, AlertTriangle, FileQuestion, ShieldAlert } from 'lucide-react';

interface ProgressBannerProps {
  documentos: DocumentoExpediente[];
}

export const ProgressBanner: React.FC<ProgressBannerProps> = ({ documentos }) => {
  const total = 5;
  const aprobados = documentos.filter((d) => d.estado === 'Aprobado').length;
  const enRevision = documentos.filter((d) => d.estado === 'En revisión').length;
  const observados = documentos.filter((d) => d.estado === 'Observado').length;
  const pendientes = total - (aprobados + enRevision + observados);

  const porcentaje = Math.round((aprobados / total) * 100);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-unt-blue">
              Expediente de Graduación
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              5 Requisitos
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
            Estado de Validación Documentaria
          </h2>
        </div>

        <div className="flex items-baseline gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200/60 self-start sm:self-center">
          <span className="text-2xl font-black text-unt-blue">{porcentaje}%</span>
          <span className="text-xs text-slate-500 font-semibold">({aprobados}/5 Aprobados)</span>
        </div>
      </div>

      {/* Barra de Progreso */}
      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            porcentaje === 100
              ? 'bg-emerald-500'
              : porcentaje >= 60
              ? 'bg-unt-blue'
              : 'bg-unt-gold'
          }`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      {/* Cifras de Estado Concisas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
        <div className="p-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold text-slate-900">{aprobados} Aprobados</div>
            <div className="text-[11px] text-emerald-700">Conformes</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl border border-sky-100 bg-sky-50/50 flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-sky-600 shrink-0" />
          <div>
            <div className="font-bold text-slate-900">{enRevision} En revisión</div>
            <div className="text-[11px] text-sky-700">Por secretaría</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl border border-rose-100 bg-rose-50/50 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <div>
            <div className="font-bold text-slate-900">{observados} Observados</div>
            <div className="text-[11px] text-rose-700">Subsanar</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-2.5">
          <FileQuestion className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <div className="font-bold text-slate-900">{pendientes} Pendientes</div>
            <div className="text-[11px] text-slate-500">Por adjuntar</div>
          </div>
        </div>
      </div>
    </div>
  );
};
