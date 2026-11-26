import React, { useState, useMemo } from 'react';
import {
  SeguimientoTesisItem,
  SustentacionJuevesItem,
  DudaTesistaPendiente,
  ConfigColacion,
  ESTACIONES_LOGISTICAS
} from '../../data/mockLogisticaSecretaria';
import {
  calcularDiasEnEstacion,
  calcularDiasRestantesDesaprobado
} from '../../data/officialKnowledgeBase';
import { PushStatsInfo } from '../../services/pushClientService';
import {
  CheckCircle2,
  Calendar,
  AlertTriangle,
  MessageCircleQuestion,
  ArrowRight,
  Bell,
  BellRing,
  Sparkles,
  Clock,
  GraduationCap,
  Send
} from 'lucide-react';

interface SecretariaHoyTabProps {
  seguimientos: SeguimientoTesisItem[];
  sustentaciones: SustentacionJuevesItem[];
  dudasPendientes: DudaTesistaPendiente[];
  configColacion: ConfigColacion;
  pushStats: PushStatsInfo;
  onPrepararJueves: (seg?: SeguimientoTesisItem, sust?: SustentacionJuevesItem) => void;
  onIrATramitesConFiltro: (filtro: 'todos' | 'incidencia' | 'atencion' | 'operativo') => void;
  onIrAColacion: () => void;
  onResponderYGuardarDuda: (duda: DudaTesistaPendiente, respuesta: string) => Promise<void>;
  onActivarPushSecretaria: () => Promise<void>;
}

export const SecretariaHoyTab: React.FC<SecretariaHoyTabProps> = ({
  seguimientos,
  sustentaciones,
  dudasPendientes,
  configColacion,
  pushStats,
  onPrepararJueves,
  onIrATramitesConFiltro,
  onIrAColacion,
  onResponderYGuardarDuda,
  onActivarPushSecretaria
}) => {
  const [respuestasDraft, setRespuestasDraft] = useState<Record<string, string>>({});
  const [enviandoDudaId, setEnviandoDudaId] = useState<string | null>(null);
  const [activandoPush, setActivandoPush] = useState<boolean>(false);

  const pendientesDudas = useMemo(
    () => dudasPendientes.filter((d) => d.estado === 'pendiente'),
    [dudasPendientes]
  );

  // 1. Sustentaciones programadas pendientes de preparar/enviar flyer
  const juevesPendientesFlyer = useMemo(() => {
    const hoyIso = new Date().toISOString().slice(0, 10);
    return sustentaciones
      .filter((s) => s.estado === 'Programada' && s.fecha >= hoyIso)
      .filter((s) => {
        const segMatch = seguimientos.find(
          (t) =>
            t.id === s.tesistaId ||
            (s.tesistaCodigo && t.codigoMatricula === s.tesistaCodigo) ||
            t.tesistaNombre.toLowerCase() === s.tesistaNombre.toLowerCase()
        );
        return !segMatch?.flyerEnviado;
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [sustentaciones, seguimientos]);

  // 2. Expedientes atascados (superan SLA) o con alerta roja / cambio título / 30 días
  const expedientesConAlerta = useMemo(() => {
    return seguimientos
      .map((s) => {
        const meta = ESTACIONES_LOGISTICAS.find((e) => e.id === s.estacionActual);
        const dias = calcularDiasEnEstacion(s.fechaIngresoEstacion);
        const excedeSla = Boolean(meta && meta.slaDiasMax > 0 && dias > meta.slaDiasMax);
        const diasDesaprobado = calcularDiasRestantesDesaprobado(s.desaprobadoFecha);
        const esAlerta =
          s.semaforo === 'incidencia' ||
          s.cambioTituloActivo ||
          excedeSla ||
          (diasDesaprobado !== null && diasDesaprobado <= 5);
        return { item: s, meta, dias, excedeSla, diasDesaprobado, esAlerta };
      })
      .filter((x) => x.esAlerta);
  }, [seguimientos]);

  const diasParaColacion = useMemo(() => {
    const raw = String(configColacion.fechaLimiteCarpeta || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    const [y, m, d] = raw.split('-').map(Number);
    const hoy = new Date();
    const hoyMid = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const limMid = new Date(y, m - 1, d);
    return Math.round((limMid.getTime() - hoyMid.getTime()) / (24 * 3600 * 1000));
  }, [configColacion.fechaLimiteCarpeta]);

  const enColacionCount = useMemo(
    () => seguimientos.filter((s) => s.estacionActual >= 5).length,
    [seguimientos]
  );

  const todoEnOrden =
    juevesPendientesFlyer.length === 0 &&
    expedientesConAlerta.length === 0 &&
    pendientesDudas.length === 0;

  const handleEnviarRespuesta = async (duda: DudaTesistaPendiente) => {
    const texto = (respuestasDraft[duda.id] || '').trim();
    if (!texto) return;
    setEnviandoDudaId(duda.id);
    try {
      await onResponderYGuardarDuda(duda, texto);
      setRespuestasDraft((prev) => {
        const next = { ...prev };
        delete next[duda.id];
        return next;
      });
    } finally {
      setEnviandoDudaId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Cabecera serena: enfoque "Qué toca hoy" sin ruido visual */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0C4D96]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Resumen Inteligente · Secretaría Ing. Industrial
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
            {todoEnOrden
              ? `Todo al día · ${seguimientos.length} trámites en orden`
              : 'Tus pendientes clave para hoy'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Solo aparecen avisos que requieren tu atención. El sistema notifica automáticamente a los tesistas cuando avanzas una etapa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              pushStats.secretariaSuscrita
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-[#082F64] hover:bg-[#0C4D96] text-white border-[#082F64]'
            }`}
          >
            {pushStats.secretariaSuscrita ? (
              <>
                <BellRing className="w-3.5 h-3.5 text-emerald-600" />
                <span>Alertas activas aquí</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5 text-amber-300" />
                <span>{activandoPush ? 'Activando...' : 'Activar alertas en esta PC'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Estado ideal: 1 sola línea verde limpia */}
      {todoEnOrden ? (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-emerald-950">
                {seguimientos.length} trámites en orden y sin dudas pendientes
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Los tesistas pueden consultar su estado y dudas frecuentes solos desde su celular sin interrumpirte.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onIrATramitesConFiltro('todos')}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Ver Trámites</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Máximo 3 tarjetas priorizadas */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* TARJETA 1: JUEVES Y FLYERS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#082F64] border border-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                    juevesPendientesFlyer.length > 0
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {juevesPendientesFlyer.length > 0
                    ? `${juevesPendientesFlyer.length} por despachar`
                    : 'Al día'}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900">1. Jueves y Flyers</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {juevesPendientesFlyer.length > 0
                    ? 'Genera el flyer oficial, selecciona jurados + copias (Elmo, Estela, Rosita) y arma el WhatsApp en 1 clic.'
                    : 'Todas las sustentaciones próximas ya tienen su flyer y citación despachados.'}
                </p>
              </div>

              {juevesPendientesFlyer.length > 0 && (
                <div className="space-y-2">
                  {juevesPendientesFlyer.slice(0, 2).map((sust) => (
                    <div
                      key={sust.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {sust.tesistaNombre}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Jueves {sust.fecha} · {sust.horario}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const seg = seguimientos.find(
                            (t) =>
                              t.id === sust.tesistaId ||
                              (sust.tesistaCodigo && t.codigoMatricula === sust.tesistaCodigo)
                          );
                          onPrepararJueves(seg, sust);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#082F64] hover:bg-[#0C4D96] text-white text-[11px] font-bold shrink-0 cursor-pointer"
                      >
                        Preparar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onPrepararJueves()}
              className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Abrir Jueves y Flyers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TARJETA 2: TRÁMITES ATASCADOS / ALERTAS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                    expedientesConAlerta.length > 0
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {expedientesConAlerta.length > 0
                    ? `${expedientesConAlerta.length} con alerta`
                    : 'Sin atrasos'}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900">2. Expedientes Atascados</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {expedientesConAlerta.length > 0
                    ? 'Expedientes observados, con Cambio de Título o que superaron los días habituales en su etapa.'
                    : 'Ningún expediente supera el tiempo normal ni presenta observaciones abiertas.'}
                </p>
              </div>

              {expedientesConAlerta.length > 0 && (
                <div className="space-y-2">
                  {expedientesConAlerta.slice(0, 3).map(({ item, meta, dias, diasDesaprobado }) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/80 text-xs"
                    >
                      <div className="font-bold text-slate-900 truncate">{item.tesistaNombre}</div>
                      <div className="text-[11px] text-rose-800 mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span>{meta?.corto || `Etapa ${item.estacionActual}`}</span>
                        <span>·</span>
                        <span>{dias} días</span>
                        {item.cambioTituloActivo && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-950 font-bold text-[10px]">
                            Cambio de Título
                          </span>
                        )}
                        {diasDesaprobado !== null && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 font-bold text-[10px]">
                            {diasDesaprobado > 0 ? `Reprogramar en ${diasDesaprobado}d` : 'Listo para reprogramar'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onIrATramitesConFiltro(expedientesConAlerta.some((x) => x.item.semaforo === 'incidencia') ? 'incidencia' : 'todos')}
              className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Revisar en Trámites</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TARJETA 3: DUDAS QUE EL ASISTENTE NO PUDO RESPONDER */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                  <MessageCircleQuestion className="w-5 h-5" />
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                    pendientesDudas.length > 0
                      ? 'bg-amber-100 text-amber-950'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {pendientesDudas.length > 0
                    ? `${pendientesDudas.length} nueva${pendientesDudas.length > 1 ? 's' : ''}`
                    : '0 pendientes'}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900">3. Dudas Nuevas</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pendientesDudas.length > 0
                    ? 'Responde 1 sola vez: se guarda en Preguntas Frecuentes y avisa al tesista para no volver a recibirla.'
                    : 'El asistente oficial cubrió todas las consultas frecuentes de los tesistas.'}
                </p>
              </div>

              {pendientesDudas.length > 0 && (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {pendientesDudas.slice(0, 2).map((duda) => (
                    <div
                      key={duda.id}
                      className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2"
                    >
                      <div className="text-xs font-bold text-slate-900">
                        “{duda.pregunta}”
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {duda.tesistaNombre || 'Tesista'}{' '}
                        {duda.codigoMatricula ? `· Matrícula ${duda.codigoMatricula}` : ''} · {duda.fechaHora}
                      </div>
                      <textarea
                        rows={2}
                        value={respuestasDraft[duda.id] || ''}
                        onChange={(e) =>
                          setRespuestasDraft((prev) => ({ ...prev, [duda.id]: e.target.value }))
                        }
                        placeholder="Escribe la respuesta oficial (quedará guardada para futuros tesistas)..."
                        className="w-full p-2 text-xs rounded-lg border border-amber-300 bg-white focus:outline-hidden focus:border-[#082F64]"
                      />
                      <button
                        type="button"
                        disabled={enviandoDudaId === duda.id || !(respuestasDraft[duda.id] || '').trim()}
                        onClick={() => handleEnviarRespuesta(duda)}
                        className="w-full py-2 rounded-lg bg-[#082F64] hover:bg-[#0C4D96] disabled:opacity-50 text-white text-[11px] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-amber-300" />
                        <span>
                          {enviandoDudaId === duda.id
                            ? 'Guardando...'
                            : 'Responder y Guardar para siempre'}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
              Solo tú apruebas respuestas nuevas. El sistema nunca inventa requisitos ni montos.
            </div>
          </div>
        </div>
      )}

      {/* Franja compacta inferior: Colación y Tesistas con alertas móviles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onIrAColacion}
          className="bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">
                {configColacion.nombreColacion}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3 text-indigo-600" />
                <span>
                  Cierre carpeta: <strong>{configColacion.fechaLimiteCarpeta}</strong>
                  {diasParaColacion !== null &&
                    (diasParaColacion === 0
                      ? ' (cierre HOY)'
                      : diasParaColacion === 1
                      ? ' (falta 1 día)'
                      : diasParaColacion > 1
                      ? ` (faltan ${diasParaColacion} días)`
                      : ' (plazo vencido)')}
                </span>
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 text-[11px] font-black shrink-0">
            {enColacionCount} en post-sust. →
          </span>
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">
                Alertas Automáticas en Celulares
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Cada vez que cambias una etapa, el sistema avisa al celular del tesista sin que redactes nada.
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-black shrink-0">
            {pushStats.tesistasSuscritos} activo{pushStats.tesistasSuscritos === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  );
};
