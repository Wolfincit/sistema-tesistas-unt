import React, { useState, useMemo } from 'react';
import {
  SeguimientoTesisItem,
  EstacionLogisticaId,
  ConfigColacion,
  ESTACIONES_LOGISTICAS
} from '../../data/mockLogisticaSecretaria';
import { calcularDiasEnEstacion } from '../../data/officialKnowledgeBase';
import {
  GraduationCap,
  CheckSquare,
  Square,
  BellRing,
  Clock,
  Edit3,
  Check,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  Link2
} from 'lucide-react';

interface SecretariaColacionTabProps {
  seguimientos: SeguimientoTesisItem[];
  configColacion: ConfigColacion;
  onGuardarConfigColacion: (cfg: ConfigColacion) => Promise<void>;
  onMoverLoteEtapa: (ids: string[], nuevaEtapa: EstacionLogisticaId) => Promise<void>;
  onActualizarDatosColacion: (
    id: string,
    patch: { urlRepositorio?: string; codigoUra?: string; tipoTramite?: 'titulado' | 'bachiller' }
  ) => Promise<void>;
}

const ETAPAS_COLACION = ESTACIONES_LOGISTICAS.filter((e) => e.id >= 5);

export const SecretariaColacionTab: React.FC<SecretariaColacionTabProps> = ({
  seguimientos,
  configColacion,
  onGuardarConfigColacion,
  onMoverLoteEtapa,
  onActualizarDatosColacion
}) => {
  const [filtro, setFiltro] = useState<
    'todos' | 'titulado' | 'bachiller' | 'est5' | 'est6' | 'est7' | 'est8' | 'atrasados'
  >('todos');
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [etapaDestino, setEtapaDestino] = useState<EstacionLogisticaId>(6);
  const [moviendoLote, setMoviendoLote] = useState<boolean>(false);

  const [editandoConfig, setEditandoConfig] = useState<boolean>(false);
  const [cfgNombre, setCfgNombre] = useState<string>(configColacion.nombreColacion);
  const [cfgLimite, setCfgLimite] = useState<string>(configColacion.fechaLimiteCarpeta);
  const [cfgCeremonia, setCfgCeremonia] = useState<string>(configColacion.fechaCeremonia);

  const [editandoFilaId, setEditandoFilaId] = useState<string | null>(null);
  const [filaUrl, setFilaUrl] = useState<string>('');
  const [filaUra, setFilaUra] = useState<string>('');

  const diasRestantes = useMemo(() => {
    const raw = String(configColacion.fechaLimiteCarpeta || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    const [y, m, d] = raw.split('-').map(Number);
    const hoy = new Date();
    const hoyMid = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const limMid = new Date(y, m - 1, d);
    return Math.round((limMid.getTime() - hoyMid.getTime()) / (24 * 3600 * 1000));
  }, [configColacion.fechaLimiteCarpeta]);

  // Incluye expedientes ya en etapa >= 4 (listos para pasar a Ética) y todos los de Bachiller
  const candidatos = useMemo(() => {
    return seguimientos.filter((s) => s.estacionActual >= 4 || s.tipoTramite === 'bachiller');
  }, [seguimientos]);

  const filtrados = useMemo(() => {
    return candidatos.filter((s) => {
      if (filtro === 'titulado') return (s.tipoTramite || 'titulado') === 'titulado';
      if (filtro === 'bachiller') return s.tipoTramite === 'bachiller';
      if (filtro === 'est5') return s.estacionActual === 5;
      if (filtro === 'est6') return s.estacionActual === 6;
      if (filtro === 'est7') return s.estacionActual === 7;
      if (filtro === 'est8') return s.estacionActual === 8;
      if (filtro === 'atrasados') {
        const meta = ESTACIONES_LOGISTICAS.find((e) => e.id === s.estacionActual);
        const dias = calcularDiasEnEstacion(s.fechaIngresoEstacion);
        return Boolean(meta && meta.slaDiasMax > 0 && dias > meta.slaDiasMax) || s.semaforo === 'incidencia';
      }
      return true;
    });
  }, [candidatos, filtro]);

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleTodosVisibles = () => {
    const visiblesIds = filtrados.map((f) => f.id);
    const todosMarcados = visiblesIds.length > 0 && visiblesIds.every((id) => seleccionados.includes(id));
    if (todosMarcados) {
      setSeleccionados((prev) => prev.filter((id) => !visiblesIds.includes(id)));
    } else {
      setSeleccionados((prev) => Array.from(new Set([...prev, ...visiblesIds])));
    }
  };

  const handleEjecutarLote = async () => {
    if (seleccionados.length === 0) return;
    setMoviendoLote(true);
    try {
      await onMoverLoteEtapa(seleccionados, etapaDestino);
      setSeleccionados([]);
    } finally {
      setMoviendoLote(false);
    }
  };

  const conteos = useMemo(() => {
    return {
      est5: candidatos.filter((s) => s.estacionActual === 5).length,
      est6: candidatos.filter((s) => s.estacionActual === 6).length,
      est7: candidatos.filter((s) => s.estacionActual === 7).length,
      est8: candidatos.filter((s) => s.estacionActual === 8).length,
      bachiller: candidatos.filter((s) => s.tipoTramite === 'bachiller').length
    };
  }, [candidatos]);

  return (
    <div className="space-y-4">
      {/* Cabecera de Colación con fecha límite editable */}
      <div className="bg-gradient-to-r from-[#082F64] to-[#0C4D96] rounded-2xl p-5 text-white shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">{configColacion.nombreColacion}</h2>
              <p className="text-xs text-blue-200">
                Tablero masivo para Ética, Repositorio (Ing. Valerio), URA y Colación (Trujillo y Sedes).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {diasRestantes !== null && (
              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 ${
                  diasRestantes <= 7
                    ? 'bg-rose-500 text-white'
                    : 'bg-amber-400 text-slate-950'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {diasRestantes === 0
                  ? `Cierre HOY (${configColacion.fechaLimiteCarpeta})`
                  : diasRestantes === 1
                  ? `Falta 1 día para cierre (${configColacion.fechaLimiteCarpeta})`
                  : diasRestantes > 1
                  ? `Faltan ${diasRestantes} días para cierre (${configColacion.fechaLimiteCarpeta})`
                  : `Cierre pasado (${configColacion.fechaLimiteCarpeta})`}
              </span>
            )}
            <button
              type="button"
              onClick={() => setEditandoConfig((v) => !v)}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Fechas</span>
            </button>
          </div>
        </div>

        {editandoConfig && (
          <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
            <input
              type="text"
              value={cfgNombre}
              onChange={(e) => setCfgNombre(e.target.value)}
              placeholder="Nombre de la colación"
              className="px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold"
            />
            <label className="flex flex-col gap-0.5 text-[10px] text-blue-100">
              Fecha límite carpetas
              <input
                type="date"
                value={cfgLimite}
                onChange={(e) => setCfgLimite(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white text-slate-900 font-semibold text-xs"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[10px] text-blue-100">
              Fecha ceremonia colación
              <input
                type="date"
                value={cfgCeremonia}
                onChange={(e) => setCfgCeremonia(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white text-slate-900 font-semibold text-xs"
              />
            </label>
            <button
              type="button"
              onClick={async () => {
                await onGuardarConfigColacion({
                  nombreColacion: cfgNombre.trim() || configColacion.nombreColacion,
                  fechaLimiteCarpeta: cfgLimite,
                  fechaCeremonia: cfgCeremonia
                });
                setEditandoConfig(false);
              }}
              className="self-end py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar</span>
            </button>
          </div>
        )}
      </div>

      {/* Filtros rápidos de Colación */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'todos', label: `Todos (${candidatos.length})` },
            { id: 'est5', label: `5. Ética (${conteos.est5})` },
            { id: 'est6', label: `6. Repositorio (${conteos.est6})` },
            { id: 'est7', label: `7. URA (${conteos.est7})` },
            { id: 'est8', label: `8. Listos (${conteos.est8})` },
            { id: 'bachiller', label: `Bachiller rápido (${conteos.bachiller})` },
            { id: 'atrasados', label: 'Atrasados' }
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFiltro(btn.id as typeof filtro)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                filtro === btn.id
                  ? 'bg-[#082F64] text-white border-[#082F64]'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <a
          href="https://tramites-uraa.unitru.edu.pe/sign-in"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#082F64] border border-blue-200 text-xs font-bold"
        >
          <span>Abrir Portal URA</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Barra de Acción en Lote (aparece cuando marcas 1 o más expedientes) */}
      {seleccionados.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-black text-amber-950">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>
              {seleccionados.length} expediente{seleccionados.length > 1 ? 's' : ''} seleccionado
              {seleccionados.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={etapaDestino}
              onChange={(e) => setEtapaDestino(Number(e.target.value) as EstacionLogisticaId)}
              className="px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold text-slate-800"
            >
              {ETAPAS_COLACION.map((e) => (
                <option key={e.id} value={e.id}>
                  Mover a: {e.nombre}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={moviendoLote}
              onClick={handleEjecutarLote}
              className="px-4 py-2 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {moviendoLote ? 'Moviendo y avisando...' : 'Mover y notificar a todos'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Lista limpia de expedientes de Colación */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={toggleTodosVisibles}
            className="inline-flex items-center gap-2 hover:text-slate-900 cursor-pointer"
          >
            {filtrados.length > 0 && filtrados.every((f) => seleccionados.includes(f.id)) ? (
              <CheckSquare className="w-4 h-4 text-[#082F64]" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Seleccionar todos ({filtrados.length})</span>
          </button>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Marca varios para avanzar por bloque y notificar en 1 clic
          </span>
        </div>

        {filtrados.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No hay expedientes en este filtro todavía. Cuando un tesista llega a Jueves (Etapa 4) o es Bachiller aparece automáticamente aquí.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtrados.map((item) => {
              const marcado = seleccionados.includes(item.id);
              const meta = ESTACIONES_LOGISTICAS.find((e) => e.id === item.estacionActual);
              const dias = calcularDiasEnEstacion(item.fechaIngresoEstacion);
              const atrasado = Boolean(meta && meta.slaDiasMax > 0 && dias > meta.slaDiasMax);
              const esBachiller = item.tipoTramite === 'bachiller';

              return (
                <div
                  key={item.id}
                  className={`p-4 flex flex-col gap-2.5 transition-colors ${
                    marcado ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleSeleccion(item.id)}
                        className="mt-0.5 text-slate-500 hover:text-[#082F64] cursor-pointer shrink-0"
                        aria-label={`Seleccionar ${item.tesistaNombre}`}
                      >
                        {marcado ? (
                          <CheckSquare className="w-5 h-5 text-[#082F64]" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-900">
                            {item.tesistaNombre}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                            {item.codigoMatricula}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              esBachiller
                                ? 'bg-teal-100 text-teal-900'
                                : 'bg-blue-100 text-[#082F64]'
                            }`}
                          >
                            {esBachiller ? 'Bachiller (sin Ética/Repo)' : 'Titulado'}
                          </span>
                          {item.sede && item.sede !== 'Trujillo' && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-bold">
                              Sede {item.sede}
                            </span>
                          )}
                          {atrasado && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                              <AlertTriangle className="w-3 h-3" />
                              {dias} días
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                          <span>
                            Etapa actual: <strong className="text-slate-800">{meta?.nombre}</strong>
                          </span>
                          {item.urlRepositorio && (
                            <a
                              href={item.urlRepositorio}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#0C4D96] hover:underline font-semibold"
                            >
                              <Link2 className="w-3 h-3" />
                              URL Repositorio
                            </a>
                          )}
                          {item.codigoUra && (
                            <span className="font-mono text-[11px] text-indigo-700 font-bold">
                              URA: {item.codigoUra}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pl-8 sm:pl-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (editandoFilaId === item.id) {
                            setEditandoFilaId(null);
                          } else {
                            setEditandoFilaId(item.id);
                            setFilaUrl(item.urlRepositorio || '');
                            setFilaUra(item.codigoUra || '');
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold cursor-pointer"
                      >
                        URL / URA
                      </button>

                      {ETAPAS_COLACION.filter((e) => !esBachiller || e.id >= 7).map((etapa) => (
                        <button
                          key={etapa.id}
                          type="button"
                          onClick={() => onMoverLoteEtapa([item.id], etapa.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            item.estacionActual === etapa.id
                              ? 'bg-[#082F64] text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {etapa.corto}
                        </button>
                      ))}
                    </div>
                  </div>

                  {editandoFilaId === item.id && (
                    <div className="ml-8 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                      <input
                        type="url"
                        value={filaUrl}
                        onChange={(e) => setFilaUrl(e.target.value)}
                        placeholder="Pegar URL del Repositorio UNT (Ing. Valerio)..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={filaUra}
                        onChange={(e) => setFilaUra(e.target.value)}
                        placeholder="N° Carpeta / Cód. URA (opcional)"
                        className="sm:w-48 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await onActualizarDatosColacion(item.id, {
                            urlRepositorio: filaUrl.trim() || undefined,
                            codigoUra: filaUra.trim() || undefined
                          });
                          setEditandoFilaId(null);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#082F64] text-white font-bold cursor-pointer"
                      >
                        Guardar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
