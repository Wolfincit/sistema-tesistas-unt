import React, { useState, useMemo } from 'react';
import {
  ESTACIONES_LOGISTICAS,
  SeguimientoTesisItem,
  SustentacionJuevesItem
} from '../data/mockLogisticaSecretaria';
import { logisticaSecretariaService } from '../services/logisticaSecretariaService';
import { useApp } from '../context/AppContext';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  Building2,
  Globe,
  FolderCheck,
  ShieldCheck,
  Layers,
  Info
} from 'lucide-react';

export const InstruccionesSustentacionPage: React.FC = () => {
  const { formatos, agregarToast } = useApp();
  const [busquedaTracking, setBusquedaTracking] = useState<string>('');
  const [seguimientos] = useState<SeguimientoTesisItem[]>(() =>
    logisticaSecretariaService.getSeguimientos()
  );
  const [sustentacionesJueves] = useState<SustentacionJuevesItem[]>(() =>
    logisticaSecretariaService.getSustentacionesJueves()
  );

  const resultadosTracking = useMemo(() => {
    const q = busquedaTracking.trim().toLowerCase();
    if (!q) return [];
    return seguimientos.filter(
      (s) =>
        s.codigoMatricula.toLowerCase().includes(q) ||
        s.tesistaNombre.toLowerCase().includes(q) ||
        s.tituloTesis.toLowerCase().includes(q)
    );
  }, [busquedaTracking, seguimientos]);

  const calcularDiasEnEstacion = (fechaIso: string) => {
    const inicio = new Date(fechaIso).getTime();
    const hoy = new Date('2026-11-22').getTime();
    if (isNaN(inicio)) return 1;
    return Math.max(1, Math.round((hoy - inicio) / (1000 * 60 * 60 * 24)));
  };

  const handleDescargarFormato = (nombre: string, archivoNombre: string, descripcion: string) => {
    const contenido = `UNIVERSIDAD NACIONAL DE TRUJILLO\nFACULTAD DE INGENIERÍA\nESCUELA PROFESIONAL DE INGENIERÍA INDUSTRIAL\n\nFORMATO OFICIAL PARA TRÁMITE DE SUSTENTACIÓN: ${nombre}\nArchivo: ${archivoNombre}\n\nInstrucciones Logísticas:\n${descripcion}\n\nNota: Presentar el expediente físico foliado en Secretaría de Escuela (Srta. Celia) para su registro y derivación a Decanato.\n`;
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = archivoNombre || `${nombre.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    agregarToast('success', 'Formato Descargado', `Se descargó "${nombre}".`);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Logística de Instrucciones y Trazabilidad */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-unt-blue text-[11px] font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>Cadena de Suministro Documentaria · Ingeniería Industrial UNT</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Instrucciones Oficiales y Rastreo Logístico de Sustentación de Tesis
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Conoce la ruta exacta (física y virtual) que sigue tu expediente de titulación, los requisitos que debes presentar en Secretaría de Escuela (Srta. Celia), las etapas donde intervienen instancias externas (Decanato, Jurado y URAA) y consulta en qué estación se encuentra tu trámite.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 shrink-0 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Horario Único de Sustentaciones:</span>
            </div>
            <p className="text-[11px] font-semibold">
              Todos los <strong>JUEVES de 11:00 a.m. a 1:00 p.m.</strong>
            </p>
            <p className="text-[10px] text-amber-800">
              Programación sujeta a dictamen favorable de los 3 miembros del Jurado.
            </p>
          </div>
        </div>
      </div>

      {/* Buscador Público de Rastreo Logístico del Expediente (Sin Login) */}
      <div className="bg-gradient-to-r from-[#082F64] to-[#0C4D96] rounded-2xl p-5 sm:p-6 text-white shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Trazabilidad en Tiempo Real (Tracking de Expediente)
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white">
              ¿Ya presentaste tu expediente físico en Secretaría? Consulta en qué estación va tu tesis
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-blue-200">
            <span>Ejemplos activos:</span>
            {['1021400219', '1021400315', '1021400342'].map((cod) => (
              <button
                key={cod}
                type="button"
                onClick={() => setBusquedaTracking(cod)}
                className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white font-mono font-bold cursor-pointer transition-colors"
              >
                {cod}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busquedaTracking}
            onChange={(e) => setBusquedaTracking(e.target.value)}
            placeholder="Ingresa tu Código de Matrícula (ej. 1021400219) o tus Apellidos para rastrear tu expediente..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-hidden shadow-xs"
          />
        </div>

        {busquedaTracking.trim() !== '' && (
          <div className="space-y-3 pt-1">
            {resultadosTracking.length > 0 ? (
              resultadosTracking.map((item) => {
                const estacionInfo =
                  ESTACIONES_LOGISTICAS.find((e) => e.id === item.estacionActual) ||
                  ESTACIONES_LOGISTICAS[0];
                const diasEnEstacion = calcularDiasEnEstacion(item.fechaIngresoEstacion);

                return (
                  <div
                    key={item.id}
                    className="bg-white text-slate-800 rounded-xl p-4 sm:p-5 shadow-md space-y-4 animate-in fade-in"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {item.tesistaNombre}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                            Matrícula: {item.codigoMatricula}
                          </span>
                          {item.esCuelloBotellaExterno ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              Retenido en Instancia Externa ({diasEnEstacion} días)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Flujo Normal ({diasEnEstacion}d / SLA {estacionInfo.slaDiasMax}d)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 italic mt-1">"{item.tituloTesis}"</p>
                      </div>

                      {item.fechaSustentacionProgramada && (
                        <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold shrink-0">
                          📅 Sustentación: Jueves {item.fechaSustentacionProgramada} (11:00 a.m. - 1:00 p.m.)
                        </div>
                      )}
                    </div>

                    {/* Línea de Tiempo de las 6 Estaciones Logísticas */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
                      {ESTACIONES_LOGISTICAS.map((est) => {
                        const completada = est.id < item.estacionActual;
                        const actual = est.id === item.estacionActual;
                        return (
                          <div
                            key={est.id}
                            className={`p-2.5 rounded-xl border transition-all ${
                              actual
                                ? item.esCuelloBotellaExterno
                                  ? 'border-rose-400 bg-rose-50 text-rose-950 ring-2 ring-rose-300'
                                  : 'border-unt-blue bg-blue-50 text-slate-900 ring-2 ring-blue-200'
                                : completada
                                ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                                : 'border-slate-200 bg-slate-50 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold mb-1">
                              <span>{est.codigo}</span>
                              {completada && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              {actual && <Clock className="w-3.5 h-3.5 text-unt-blue animate-pulse" />}
                            </div>
                            <div className="font-bold leading-snug line-clamp-2">{est.nombre}</div>
                            <div className="text-[10px] opacity-75 mt-1">{est.responsable}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Detalle de Ubicación, Jurado y Nota de Secretaría */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <div>
                          <span className="font-bold text-slate-700">Ubicación Actual del Expediente:</span>{' '}
                          <span className="text-unt-blue font-semibold">{item.ubicacionFisica}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">Jurado Asignado:</span>{' '}
                          <span className="text-slate-600">
                            Presidente: {item.juradoPresidente} · Secretario: {item.juradoSecretario} · Vocal: {item.juradoVocal}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div>
                          <span className="font-bold text-slate-700">Última anotación de Secretaría (Srta. Celia):</span>
                          <p className="text-slate-600 mt-0.5">{item.notasSecretaria}</p>
                        </div>
                        {item.esCuelloBotellaExterno && item.motivoRetrasoExterno && (
                          <div className="text-rose-700 font-semibold">
                            ⚠️ Diagnóstico Logístico: {item.motivoRetrasoExterno}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-xs text-blue-100">
                No se encontró un expediente con ese código o apellido. Si acabas de entregar tus documentos físicos, la Srta. Celia lo registrará en el sistema de seguimiento.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mapa Logístico de las 6 Estaciones: Físico vs. Virtual y Cuellos de Botella Externos */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-unt-blue" />
              <span>Ruta Logística del Trámite de Sustentación (6 Estaciones Oficiales UNT)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Identificación clara de qué etapas son físicas en Escuela, cuáles dependen de instancias externas (Decanato / Jurado) y cuáles son virtuales.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              ● Interno Escuela (Srta. Celia · 1 a 3 días)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
              ● Externo a Escuela (Decanato / Jurado / URAA)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ESTACIONES_LOGISTICAS.map((est) => {
            const esInterno = est.tipoFlujo === 'INTERNO_ESCUELA';
            const esExterno =
              est.tipoFlujo === 'EXTERNO_FACULTAD' ||
              est.tipoFlujo === 'EXTERNO_JURADO' ||
              est.tipoFlujo === 'EXTERNO_URAA';

            return (
              <div
                key={est.id}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                  esInterno
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : esExterno
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-blue-200 bg-blue-50/30'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#082F64] text-white font-mono text-[11px] font-bold">
                      Paso {est.id} · {est.codigo}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        est.modalidad.includes('Virtual')
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {est.modalidad}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{est.nombre}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{est.descripcion}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 truncate">{est.responsable}</span>
                  <span className="font-mono font-bold text-unt-blue shrink-0">
                    SLA: ≤ {est.slaDiasMax}d
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checklist de Requisitos Físicos vs. Virtuales + Próximas Sustentaciones Jueves 11-1 PM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Requisitos que debe presentar el Tesista */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FolderCheck className="w-4 h-4 text-unt-blue" />
            <span>Requisitos que el Tesista debe presentar para Sustentación</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            {[
              {
                num: '01',
                titulo: 'Formato Único de Trámite (FUT) dirigido al Decano / Dirección de Escuela',
                detalle: 'Solicitando Nombramiento de Jurado, Revisión y Fecha de Sustentación de Tesis.',
                tipo: 'Físico en Secretaría'
              },
              {
                num: '02',
                titulo: 'Recibo / Voucher de Pago por Derecho de Trámite (TUPA UNT)',
                detalle: 'Pago realizado en Tesorería UNT o Banco Interbank con el código TUPA vigente.',
                tipo: 'Físico (Original + Copia)'
              },
              {
                num: '03',
                titulo: 'Reporte de Originalidad Turnitin (< 20% de similitud) y Constancia firmada por el Asesor',
                detalle: 'Impreso y visado por el docente asesor acreditando cumplimiento del reglamento.',
                tipo: 'Físico + Digital'
              },
              {
                num: '04',
                titulo: 'Constancia de Prácticas Preprofesionales y/o Desempeño Laboral',
                detalle: 'Emitida y aprobada previamente por la Comisión de Prácticas de Ingeniería Industrial.',
                tipo: 'Físico en Folder'
              },
              {
                num: '05',
                titulo: 'Resolución Decanal de Aprobación de Proyecto de Tesis y Copia de Bachiller',
                detalle: 'Adjuntar resolución de ampliación o cambio de título si correspondiera.',
                tipo: 'Físico en Folder'
              },
              {
                num: '06',
                titulo: 'Tres (03) Ejemplares / Borradores de Tesis para el Jurado Evaluador',
                detalle: 'Para entrega a Presidente, Secretario y Vocal una vez emitida la Resolución de Decanato.',
                tipo: 'Físico (3 Anillados) / PDF'
              },
              {
                num: '07',
                titulo: 'Post-Sustentación: Carpeta Digital en Plataforma URAA y Repositorio UNT',
                detalle: 'Con el Acta de Sustentación firmada el día jueves, subir carpeta final en tramites-uraa.unitru.edu.pe.',
                tipo: '100% Virtual (URAA)'
              }
            ].map((req) => (
              <div
                key={req.num}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[#082F64] text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {req.num}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900">{req.titulo}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">{req.detalle}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-unt-blue border border-blue-200 text-[10px] font-bold shrink-0">
                  {req.tipo}
                </span>
              </div>
            ))}
          </div>

          {/* Formatos Oficiales para Descarga */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Formatos Oficiales Descargables
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {formatos.map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => handleDescargarFormato(fmt.nombre, fmt.archivoNombre, fmt.descripcion)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-unt-blue bg-white hover:bg-blue-50/40 text-left transition-all flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{fmt.nombre}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {fmt.formato} · {fmt.peso}
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-unt-blue shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cronograma Público de Próximas Sustentaciones (Jueves 11:00 a.m. - 1:00 p.m.) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-unt-blue" />
              <span>Cronograma de Sustentaciones (Jueves 11:00 a.m. – 1:00 p.m.)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Programación oficial publicada por Secretaría de Escuela (Srta. Celia).
            </p>
          </div>

          <div className="space-y-3">
            {sustentacionesJueves.length > 0 ? (
              sustentacionesJueves.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#082F64] text-amber-300 font-bold text-[11px]">
                      Jueves {s.fecha} · {s.horario}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {s.estado}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{s.tesistaNombre}</div>
                  <p className="text-[11px] text-slate-600 italic line-clamp-2">"{s.tituloTesis}"</p>
                  <div className="pt-2 border-t border-blue-100 text-[11px] text-slate-700 space-y-0.5">
                    <div>
                      <strong>Presidente:</strong> {s.juradoPresidente}
                    </div>
                    <div>
                      <strong>Secretario:</strong> {s.juradoSecretario}
                    </div>
                    <div>
                      <strong>Vocal:</strong> {s.juradoVocal}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No hay sustentaciones programadas para los próximos jueves.
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-unt-blue" />
              <span>Canales Oficiales UNT Vinculados:</span>
            </div>
            <div>
              • <strong>Carpeta Digital de Titulados:</strong>{' '}
              <a
                href="https://tramites-uraa.unitru.edu.pe/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-unt-blue font-bold underline"
              >
                tramites-uraa.unitru.edu.pe
              </a>
            </div>
            <div>
              • <strong>Repositorio Institucional UNT:</strong>{' '}
              <a
                href="https://repositorio.unitru.edu.pe/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-unt-blue font-bold underline"
              >
                repositorio.unitru.edu.pe
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
