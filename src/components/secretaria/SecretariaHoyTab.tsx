import React, { useState, useMemo } from 'react';
import {
  SeguimientoTesisItem,
  SustentacionJuevesItem
} from '../../data/mockLogisticaSecretaria';
import { PushStatsInfo } from '../../services/pushClientService';
import {
  CheckCircle2,
  Calendar,
  ArrowRight,
  Bell,
  BellRing,
  Sparkles,
  Users,
  Send
} from 'lucide-react';

interface SecretariaHoyTabProps {
  seguimientos: SeguimientoTesisItem[];
  sustentaciones: SustentacionJuevesItem[];
  pushStats: PushStatsInfo;
  onPrepararJueves: (seg?: SeguimientoTesisItem, sust?: SustentacionJuevesItem) => void;
  onIrATramitesConFiltro: (filtro: 'todos' | 'pendiente' | 'aprobado' | 'desaprobado') => void;
  onIrAAgenda: () => void;
  onActivarPushSecretaria: () => Promise<void>;
}

export const SecretariaHoyTab: React.FC<SecretariaHoyTabProps> = ({
  seguimientos,
  sustentaciones,
  pushStats,
  onPrepararJueves,
  onIrATramitesConFiltro,
  onIrAAgenda,
  onActivarPushSecretaria
}) => {
  const [activandoPush, setActivandoPush] = useState<boolean>(false);

  // Sustentaciones próximas (hoy en adelante)
  const proximasSustentaciones = useMemo(() => {
    const hoyIso = new Date().toISOString().slice(0, 10);
    return sustentaciones
      .filter((s) => s.estado === 'Programada' && s.fecha >= hoyIso)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [sustentaciones]);

  const conteosResultados = useMemo(() => {
    const c = { total: seguimientos.length, pendiente: 0, aprobado: 0, desaprobado: 0 };
    seguimientos.forEach((s) => {
      const r1 = s.resultadoTesista1 || 'pendiente';
      const r2 = s.tesista2Nombre ? s.resultadoTesista2 || 'pendiente' : null;
      if (r1 === 'desaprobado' || r2 === 'desaprobado') c.desaprobado += 1;
      else if (r1 === 'aprobado' && (!r2 || r2 === 'aprobado')) c.aprobado += 1;
      else c.pendiente += 1;
    });
    return c;
  }, [seguimientos]);

  return (
    <div className="space-y-5">
      {/* Cabecera limpia de Hoy */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0C4D96]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Resumen del Día · Secretaría Ing. Industrial
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
            {proximasSustentaciones.length > 0
              ? `${proximasSustentaciones.length} sustentación${proximasSustentaciones.length > 1 ? 'es' : ''} programada${proximasSustentaciones.length > 1 ? 's' : ''}`
              : 'Todo al día · Sin sustentaciones pendientes'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Agenda tus jueves, genera el flyer oficial y envía los correos pre-redactados para jurados y tesistas en 1 clic.
          </p>
        </div>

        <button
          type="button"
          disabled={activandoPush}
          onClick={async () => {
            setActivandoPush(true);
            try {
              await onActivarPushSecretaria();
            } finally {
              setActivandoPush(false);
            }
          }}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
            pushStats.secretariaSuscrita
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-[#082F64] hover:bg-[#0C4D96] text-white border-[#082F64]'
          }`}
        >
          {pushStats.secretariaSuscrita ? (
            <>
              <BellRing className="w-3.5 h-3.5 text-emerald-600" />
              <span>Alertas activas en esta PC</span>
            </>
          ) : (
            <>
              <Bell className="w-3.5 h-3.5 text-amber-300" />
              <span>{activandoPush ? 'Activando...' : 'Activar alertas en esta PC'}</span>
            </>
          )}
        </button>
      </div>

      {/* 2 Tarjetas Limpias: Próximas Sustentaciones + Resumen de Tesistas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tarjeta 1: Próximas Sustentaciones de Jueves */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#082F64] border border-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Próximas Sustentaciones</h3>
                  <p className="text-[11px] text-slate-500">Agenda de Jueves · Auditorio / Aulas</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                  proximasSustentaciones.length > 0
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {proximasSustentaciones.length > 0
                  ? `${proximasSustentaciones.length} agendada${proximasSustentaciones.length > 1 ? 's' : ''}`
                  : 'Libre'}
              </span>
            </div>

            {proximasSustentaciones.length > 0 ? (
              <div className="space-y-2">
                {proximasSustentaciones.slice(0, 4).map((sust) => {
                  const segMatch = seguimientos.find(
                    (t) =>
                      t.id === sust.tesistaId ||
                      (sust.tesistaCodigo && t.codigoMatricula === sust.tesistaCodigo) ||
                      t.tesistaNombre.toLowerCase() === sust.tesistaNombre.toLowerCase()
                  );
                  return (
                    <div
                      key={sust.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {sust.tesistaNombre}
                          {sust.tesista2Nombre ? ` y ${sust.tesista2Nombre}` : ''}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Jueves {sust.fecha} · {sust.horario} · {sust.aulaOAuditorio}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onPrepararJueves(segMatch, sust)}
                        className="px-3 py-1.5 rounded-lg bg-[#082F64] hover:bg-[#0C4D96] text-white text-[11px] font-bold shrink-0 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3 text-amber-300" />
                        <span>Flyer y Correos</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>No hay sustentaciones pendientes por despachar en los próximos jueves.</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onIrAAgenda}
            className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Abrir Agenda de Jueves</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tarjeta 2: Resumen de Tesistas y Resultados */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Registro de Tesistas</h3>
                  <p className="text-[11px] text-slate-500">Datos para flyers, correos y resultado de sustentación</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-black">
                {conteosResultados.total} en padrón
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onIrATramitesConFiltro('pendiente')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center transition-colors cursor-pointer"
              >
                <div className="text-lg font-black text-slate-800">{conteosResultados.pendiente}</div>
                <div className="text-[11px] font-bold text-slate-500">Pendientes</div>
              </button>
              <button
                type="button"
                onClick={() => onIrATramitesConFiltro('aprobado')}
                className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-center transition-colors cursor-pointer"
              >
                <div className="text-lg font-black text-emerald-700">{conteosResultados.aprobado}</div>
                <div className="text-[11px] font-bold text-emerald-800">✓ Aprobados</div>
              </button>
              <button
                type="button"
                onClick={() => onIrATramitesConFiltro('desaprobado')}
                className="p-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-center transition-colors cursor-pointer"
              >
                <div className="text-lg font-black text-rose-700">{conteosResultados.desaprobado}</div>
                <div className="text-[11px] font-bold text-rose-800">✕ Desaprobados</div>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onIrATramitesConFiltro('todos')}
            className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Ir al Padrón de Tesistas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
