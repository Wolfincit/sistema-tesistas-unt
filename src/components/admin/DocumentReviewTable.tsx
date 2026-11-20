import React, { useState, useMemo } from 'react';
import { DocumentoExpediente, DocumentoEstado, DocumentoRequerido } from '../../types';
import { DOCUMENTOS_REQUERIDOS } from '../../data/mockDocumentos';
import { useApp } from '../../context/AppContext';
import { 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Search, 
  User, 
  ArrowLeft, 
  Eye, 
  Download, 
  Check, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  BookOpen,
  GraduationCap,
  Sparkles,
  X,
  Trash2,
  FolderOpen,
  ExternalLink
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { ObservationModal } from './ObservationModal';

interface DocumentReviewTableProps {
  documentos: DocumentoExpediente[];
  tesistaInicialId?: string | null;
}

interface TesistaResumen {
  tesistaId: string;
  tesistaNombre: string;
  tesistaCodigo: string;
  tituloTesis: string;
  asesor: string;
  documentos: DocumentoExpediente[];
  totalAprobados: number;
  totalObservados: number;
  totalEnRevision: number;
  totalPendientes: number;
  esAptoParaSustentar: boolean;
  tieneObservaciones: boolean;
  enRevision: boolean;
  documentosObservados: DocumentoExpediente[];
  fechaUltimaCarga: string;
}

export const DocumentReviewTable: React.FC<DocumentReviewTableProps> = ({ 
  documentos,
  tesistaInicialId = null
}) => {
  const { revisarDocumento, eliminarExpedienteTesistaCompleto, reservas, agregarToast } = useApp();
  const [filtroEstado, setFiltroEstado] = useState<'En revisión' | 'Observados' | 'Aptos para Sustentar' | 'TODOS'>('En revisión');
  const [busqueda, setBusqueda] = useState<string>('');
  const [tesistaSeleccionadoId, setTesistaSeleccionadoId] = useState<string | null>(tesistaInicialId);
  const [docAObservar, setDocAObservar] = useState<DocumentoExpediente | null>(null);
  const [docAPrevisualizar, setDocAPrevisualizar] = useState<DocumentoExpediente | null>(null);
  const [tesistaAEliminarDrive, setTesistaAEliminarDrive] = useState<TesistaResumen | null>(null);
  const [eliminandoDrive, setEliminandoDrive] = useState<boolean>(false);

  React.useEffect(() => {
    if (tesistaInicialId) {
      setTesistaSeleccionadoId(tesistaInicialId);
    }
  }, [tesistaInicialId]);

  // Mapeo y agrupación de documentos por Tesista
  const tesistasResumen = useMemo<TesistaResumen[]>(() => {
    const mapa = new Map<string, DocumentoExpediente[]>();

    // Agrupar todos los documentos por tesistaId
    documentos.forEach((doc) => {
      if (!mapa.has(doc.tesistaId)) {
        mapa.set(doc.tesistaId, []);
      }
      mapa.get(doc.tesistaId)!.push(doc);
    });

    const lista: TesistaResumen[] = [];

    mapa.forEach((docs, tId) => {
      const primerDoc = docs[0];
      const tNombre = primerDoc.tesistaNombre;
      const tCodigo = primerDoc.tesistaCodigo;

      // Buscar si tiene título de tesis y asesor registrado en reservas o usar datos institucionales UNT
      const reserva = reservas.find((r) => r.tesistaId === tId || r.codigoMatricula === tCodigo);

      const tituloTesis =
        reserva?.tituloTesis ||
        'Proyecto de Tesis — Escuela Profesional de Ingeniería Industrial UNT';
      const asesor = reserva?.asesor || 'Por asignar / Según Resolución Decanal';

      const totalAprobados = docs.filter((d) => d.estado === 'Aprobado').length;
      const totalObservados = docs.filter((d) => d.estado === 'Observado').length;
      const totalEnRevision = docs.filter((d) => d.estado === 'En revisión').length;
      const totalPendientes = Math.max(0, 5 - (totalAprobados + totalObservados + totalEnRevision));

      const esAptoParaSustentar = totalAprobados === 5;
      const tieneObservaciones = totalObservados > 0;
      const enRevision = totalEnRevision > 0 && !tieneObservaciones;
      const documentosObservados = docs.filter((d) => d.estado === 'Observado');

      // Buscar última fecha de carga
      const fechas = docs.map((d) => d.fechaSubida).filter(Boolean) as string[];
      fechas.sort().reverse();
      const fechaUltimaCarga = fechas[0] || 'Sin fecha';

      lista.push({
        tesistaId: tId,
        tesistaNombre: tNombre,
        tesistaCodigo: tCodigo,
        tituloTesis,
        asesor,
        documentos: docs,
        totalAprobados,
        totalObservados,
        totalEnRevision,
        totalPendientes,
        esAptoParaSustentar,
        tieneObservaciones,
        enRevision,
        documentosObservados,
        fechaUltimaCarga
      });
    });

    return lista;
  }, [documentos, reservas]);

  // Filtrado de Tesistas según pestaña y término de búsqueda
  const tesistasFiltrados = useMemo(() => {
    return tesistasResumen.filter((t) => {
      // Filtro de Pestañas
      if (filtroEstado === 'Aptos para Sustentar') {
        if (!t.esAptoParaSustentar) return false;
      } else if (filtroEstado === 'Observados') {
        if (!t.tieneObservaciones) return false;
      } else if (filtroEstado === 'En revisión') {
        if (t.totalEnRevision === 0 || t.tieneObservaciones || t.esAptoParaSustentar) return false;
      }

      // Filtro de Búsqueda
      if (busqueda.trim() !== '') {
        const q = busqueda.toLowerCase().trim();
        const matchNombre = t.tesistaNombre.toLowerCase().includes(q);
        const matchCodigo = t.tesistaCodigo.toLowerCase().includes(q);
        const matchTitulo = t.tituloTesis.toLowerCase().includes(q);
        const matchAsesor = t.asesor.toLowerCase().includes(q);
        if (!matchNombre && !matchCodigo && !matchTitulo && !matchAsesor) return false;
      }

      return true;
    });
  }, [tesistasResumen, filtroEstado, busqueda]);

  // Conteos para las pestañas
  const conteoEnRevision = tesistasResumen.filter((t) => t.totalEnRevision > 0 && !t.tieneObservaciones && !t.esAptoParaSustentar).length;
  const conteoObservados = tesistasResumen.filter((t) => t.tieneObservaciones).length;
  const conteoAptos = tesistasResumen.filter((t) => t.esAptoParaSustentar).length;
  const conteoTodos = tesistasResumen.length;

  // Acciones de dictamen para Secretaría
  const handleAprobarDirecto = async (id: string) => {
    await revisarDocumento(id, 'Aprobado');
  };

  const handleConfirmarObservacion = async (id: string, motivo: string) => {
    await revisarDocumento(id, 'Observado', motivo);
  };

  // Aprobar en bloque todos los documentos de un tesista
  const handleAprobarTodoElExpediente = async (t: TesistaResumen) => {
    const pendientes = t.documentos.filter((d) => d.estado !== 'Aprobado');
    for (const d of pendientes) {
      await revisarDocumento(d.id, 'Aprobado');
    }
    agregarToast('success', 'Expediente Conforme', `Se aprobaron los 5 requisitos de ${t.tesistaNombre}. Queda Apto para Sustentar.`);
  };

  const badgeVariants: Record<DocumentoEstado, 'success' | 'warning' | 'danger' | 'neutral'> = {
    Aprobado: 'success',
    'En revisión': 'warning',
    Observado: 'danger',
    Pendiente: 'neutral'
  };

  // Tesista actualmente seleccionado para vista de detalle
  const tesistaActivo = tesistasResumen.find((t) => t.tesistaId === tesistaSeleccionadoId);

  // ==========================================
  // VISTA DE DETALLE: EXPEDIENTE DEL TESISTA
  // ==========================================
  if (tesistaActivo) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Barra Superior con botón para volver + Carpeta Drive + Borrar al Titularse */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setTesistaSeleccionadoId(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-unt-blue bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Lista de Tesistas</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {tesistaActivo.documentos.find((d) => d.driveFolderUrl)?.driveFolderUrl && (
              <a
                href={tesistaActivo.documentos.find((d) => d.driveFolderUrl)?.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-unt-blue bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-2xs transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-amber-500" />
                <span>Carpeta en Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {!tesistaActivo.esAptoParaSustentar && tesistaActivo.documentos.length > 0 && (
              <button
                type="button"
                onClick={() => handleAprobarTodoElExpediente(tesistaActivo)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-2xs transition-colors cursor-pointer w-fit"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprobar Todos (5/5)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setTesistaAEliminarDrive(tesistaActivo)}
              title="Cuando el tesista ya se tituló: elimina su carpeta individual y todos sus PDFs de Google Drive para liberar espacio"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-2xs transition-colors cursor-pointer w-fit"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Titulado · Borrar del Drive</span>
            </button>
          </div>
        </div>

        {/* Ficha Institucional del Tesista */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#082F64] to-[#0C4D96] rounded-2xl text-white shadow-md border border-white/10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-blue-200">
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                <span>Expediente de Titulación Profesional · Ing. Industrial UNT</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>{tesistaActivo.tesistaNombre}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/20 text-blue-100 font-normal">
                  Cód: {tesistaActivo.tesistaCodigo}
                </span>
              </h2>
              <p className="text-xs text-blue-100/90 italic max-w-3xl leading-relaxed">
                "{tesistaActivo.tituloTesis}"
              </p>
              <div className="text-[11px] text-blue-200 flex items-center gap-2 pt-1">
                <span className="font-semibold text-white">Docente Asesor:</span>
                <span>{tesistaActivo.asesor}</span>
              </div>
            </div>

            {/* Badge de Estado del Expediente */}
            <div className="shrink-0">
              {tesistaActivo.esAptoParaSustentar ? (
                <div className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Apto para Sustentar
                    </div>
                    <div className="text-[11px] text-emerald-100">
                      5 de 5 Requisitos 100% Conformes
                    </div>
                  </div>
                </div>
              ) : tesistaActivo.tieneObservaciones ? (
                <div className="px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-rose-300">
                      Expediente Observado
                    </div>
                    <div className="text-[11px] text-rose-100">
                      Requiere subsanación del graduando
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-300 shrink-0" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      En Revisión
                    </div>
                    <div className="text-[11px] text-amber-100">
                      {tesistaActivo.totalEnRevision} requisito(s) por dictaminar
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Barra de progreso de los 5 requisitos */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-blue-100">
              <span>Progreso Documentario Oficial:</span>
              <span className="font-bold text-white">
                {tesistaActivo.totalAprobados} de 5 Requisitos Aprobados ({Math.round((tesistaActivo.totalAprobados / 5) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  tesistaActivo.esAptoParaSustentar
                    ? 'bg-emerald-400'
                    : tesistaActivo.tieneObservaciones
                    ? 'bg-rose-400'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${(tesistaActivo.totalAprobados / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Alerta de Observaciones Pendientes si las hay */}
        {tesistaActivo.tieneObservaciones && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Documentos Observados que impiden la programación de sustentación:</span>
            </div>
            <ul className="space-y-1.5 pl-6 text-xs text-rose-700 list-disc">
              {tesistaActivo.documentosObservados.map((doc) => (
                <li key={doc.id} className="leading-relaxed">
                  <span className="font-bold text-rose-900">{doc.nombreDocumento}:</span>{' '}
                  <span className="italic">"{doc.observacion || 'Observado por incumplimiento reglamentario'}"</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Lista de los 5 Requisitos Oficiales para Cotejo Individual */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Cotejo de los 5 Requisitos Oficiales de Grados y Títulos
              </h3>
              <p className="text-xs text-slate-500">
                Evalúe la validez de cada archivo cargado. Solo cuando los 5 requisitos figuren aprobados el graduando quedará Apto para Sustentar.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const subidos = tesistaActivo.documentos.filter((d) => d.nombreArchivo);
                agregarToast(
                  'success',
                  'Descarga en Lote',
                  `Generando descarga de ${subidos.length} documento(s) oficial(es) de ${tesistaActivo.tesistaNombre}.`
                );
              }}
              className="px-3.5 py-2 bg-unt-blue hover:bg-unt-blue-light text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-2 transition-colors cursor-pointer shrink-0"
              title="Descargar todos los archivos del expediente en un solo paquete"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Descargar Expediente en Lote</span>
            </button>
          </div>

          <div className="space-y-3">
            {DOCUMENTOS_REQUERIDOS.map((req: DocumentoRequerido) => {
              const doc = tesistaActivo.documentos.find((d) => d.tipoId === req.id);
              const subido = !!doc && !!doc.nombreArchivo;
              const estado: DocumentoEstado = doc ? doc.estado : 'Pendiente';

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-xl border transition-all ${
                    estado === 'Aprobado'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : estado === 'Observado'
                      ? 'border-rose-200 bg-rose-50/30'
                      : estado === 'En revisión'
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Información del requisito */}
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-unt-blue text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {req.orden}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">
                          {req.nombre}
                        </h4>
                        <Badge variant={badgeVariants[estado]} size="sm">
                          {estado}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed pl-7">
                        {req.descripcion}
                      </p>

                      {/* Archivo adjunto */}
                      {subido ? (
                        <div className="flex items-center gap-3 pl-7 pt-1 text-xs">
                          <button
                            type="button"
                            onClick={() => setDocAPrevisualizar(doc)}
                            className="inline-flex items-center gap-1.5 text-unt-blue hover:text-unt-blue-light font-semibold hover:underline cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>{doc.nombreArchivo}</span>
                            <span className="text-[10px] text-slate-400">({doc.archivoTamano || '1.2 MB'})</span>
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Cargado: {doc.fechaSubida}
                          </span>
                        </div>
                      ) : (
                        <div className="pl-7 pt-1 text-[11px] text-slate-400 italic">
                          El graduando aún no ha cargado este requisito.
                        </div>
                      )}

                      {/* Observación previa si la hay */}
                      {estado === 'Observado' && doc?.observacion && (
                        <div className="ml-7 mt-2 p-2.5 rounded-lg bg-rose-100/70 border border-rose-200 text-xs text-rose-800">
                          <span className="font-bold">Observación registrada:</span> "{doc.observacion}"
                        </div>
                      )}
                    </div>

                    {/* Acciones de Dictamen para Secretaría */}
                    <div className="shrink-0 flex items-center justify-end gap-1.5 pt-2 md:pt-0">
                      {subido && (
                        <>
                          <button
                            type="button"
                            onClick={() => setDocAPrevisualizar(doc)}
                            className="px-2.5 py-1.5 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs hover:bg-slate-50"
                            title="Previsualizar documento"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Ver PDF</span>
                          </button>

                          {doc.archivoUrl ? (
                            <a
                              href={`${doc.archivoUrl}?download=1&name=${encodeURIComponent(doc.nombreArchivo || 'documento.pdf')}`}
                              download={doc.nombreArchivo || 'documento.pdf'}
                              className="p-1.5 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs hover:bg-slate-50"
                              title={`Descargar archivo real: ${doc.nombreArchivo}`}
                            >
                              <Download className="w-3.5 h-3.5 text-unt-blue" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                agregarToast(
                                  'info',
                                  'Sin PDF binario adjunto',
                                  `Este registro antiguo solo contiene metadatos ("${doc.nombreArchivo}"). Los nuevos PDFs subidos se descargan directo desde Drive.`
                                );
                              }}
                              className="p-1.5 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs hover:bg-slate-50"
                              title={`Descargar archivo individual: ${doc.nombreArchivo}`}
                            >
                              <Download className="w-3.5 h-3.5 text-unt-blue" />
                            </button>
                          )}
                        </>
                      )}

                      {subido && estado !== 'Aprobado' && (
                        <button
                          type="button"
                          onClick={() => handleAprobarDirecto(doc.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aprobar</span>
                        </button>
                      )}

                      {/* Siempre disponible la opción de observar o editar la observación si ya existe */}
                      {subido && (
                        <button
                          type="button"
                          onClick={() => setDocAObservar(doc)}
                          className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs ${
                            estado === 'Observado'
                              ? 'border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100'
                              : 'border-rose-300 text-rose-700 hover:bg-rose-50 bg-white'
                          }`}
                          title={
                            estado === 'Observado'
                              ? 'Actualizar o emitir nueva observación'
                              : 'Observar requisito'
                          }
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{estado === 'Observado' ? 'Editar Obs.' : 'Observar'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal de Observación */}
        <ObservationModal
          isOpen={docAObservar !== null}
          onClose={() => setDocAObservar(null)}
          documento={docAObservar}
          onConfirmar={handleConfirmarObservacion}
        />

        {/* Modal Confirmación: Eliminar Expediente y Carpeta Completa de Google Drive (Alumno Titulado) */}
        {tesistaAEliminarDrive && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in"
            onClick={() => !eliminandoDrive && setTesistaAEliminarDrive(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 bg-rose-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-200" />
                  <h3 className="text-sm font-bold">Eliminar Expediente y Carpeta de Drive</h3>
                </div>
                <button
                  type="button"
                  disabled={eliminandoDrive}
                  onClick={() => setTesistaAEliminarDrive(null)}
                  className="p-1 text-white/80 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs text-slate-700">
                <p className="leading-relaxed">
                  ¿Confirma que <strong>{tesistaAEliminarDrive.tesistaNombre}</strong> (Cód:{' '}
                  <span className="font-mono">{tesistaAEliminarDrive.tesistaCodigo}</span>) ya se tituló o desea eliminar todo su expediente?
                </p>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1 leading-relaxed">
                  <span className="font-bold block">Esta acción eliminará definitivamente:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    <li>La carpeta individual del alumno en <strong>Google Drive</strong> y todos sus PDFs subidos.</li>
                    <li>Su registro de documentos en revisión y su turno en el calendario del auditorio.</li>
                  </ul>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={eliminandoDrive}
                    onClick={() => setTesistaAEliminarDrive(null)}
                    className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={eliminandoDrive}
                    onClick={async () => {
                      setEliminandoDrive(true);
                      await eliminarExpedienteTesistaCompleto({
                        tesistaId: tesistaAEliminarDrive.tesistaId,
                        tesistaNombre: tesistaAEliminarDrive.tesistaNombre,
                        tesistaCodigo: tesistaAEliminarDrive.tesistaCodigo
                      });
                      setEliminandoDrive(false);
                      setTesistaAEliminarDrive(null);
                      setTesistaSeleccionadoId(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{eliminandoDrive ? 'Eliminando de Drive...' : 'Sí, borrar todo y del Drive'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Visualizador PDF */}
        {docAPrevisualizar && (
          <PDFPreviewModal
            documento={docAPrevisualizar}
            onClose={() => setDocAPrevisualizar(null)}
            onAprobar={async (id) => {
              await handleAprobarDirecto(id);
              setDocAPrevisualizar(null);
            }}
            onObservar={() => {
              const d = docAPrevisualizar;
              setDocAPrevisualizar(null);
              setDocAObservar(d);
            }}
          />
        )}
      </div>
    );
  }

  // ==========================================
  // VISTA PRINCIPAL: LISTA DE TESISTAS
  // ==========================================
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Mesa de Partes y Revisión de Requisitos de Titulación</span>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {conteoTodos} graduandos registrados
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Cotejo documental por tesista. Selecciona a un graduando para auditar sus 5 requisitos oficiales.
          </p>
        </div>

        {/* Buscador de Tesistas */}
        <div className="relative sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por tesista, código o tema..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Pestañas de Filtro según Especificación Oficial */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100 text-xs">
        <button
          onClick={() => setFiltroEstado('En revisión')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
            filtroEstado === 'En revisión'
              ? 'bg-unt-blue text-white shadow-2xs font-bold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>En revisión</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filtroEstado === 'En revisión'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {conteoEnRevision}
          </span>
        </button>

        <button
          onClick={() => setFiltroEstado('Observados')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
            filtroEstado === 'Observados'
              ? 'bg-rose-700 text-white shadow-2xs font-bold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Observados</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filtroEstado === 'Observados'
                ? 'bg-white/20 text-white'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {conteoObservados}
          </span>
        </button>

        <button
          onClick={() => setFiltroEstado('Aptos para Sustentar')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
            filtroEstado === 'Aptos para Sustentar'
              ? 'bg-emerald-700 text-white shadow-2xs font-bold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
          <span>Aptos para Sustentar (5/5 Conformes)</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filtroEstado === 'Aptos para Sustentar'
                ? 'bg-white/20 text-white'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {conteoAptos}
          </span>
        </button>

        <button
          onClick={() => setFiltroEstado('TODOS')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
            filtroEstado === 'TODOS'
              ? 'bg-unt-blue text-white shadow-2xs font-bold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Todos los Tesistas</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filtroEstado === 'TODOS'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {conteoTodos}
          </span>
        </button>
      </div>

      {/* Tabla Agrupada por Tesista (1 Fila por Graduando) */}
      {tesistasFiltrados.length > 0 ? (
        <div className="overflow-x-auto border border-slate-200/70 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Tesista Graduando</th>
                <th className="p-3.5">Tema de Tesis / Modalidad</th>
                <th className="p-3.5">Avance de Requisitos</th>
                <th className="p-3.5">Estado del Expediente</th>
                <th className="p-3.5">Última Carga</th>
                <th className="p-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tesistasFiltrados.map((t) => (
                <tr
                  key={t.tesistaId}
                  onClick={() => setTesistaSeleccionadoId(t.tesistaId)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Datos del Graduando */}
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 group-hover:text-unt-blue transition-colors">
                      <User className="w-3.5 h-3.5 text-unt-blue shrink-0" />
                      <span>{t.tesistaNombre}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                      Cód: {t.tesistaCodigo}
                    </span>
                  </td>

                  {/* Título de Tesis */}
                  <td className="p-3.5 max-w-xs">
                    <div className="text-slate-700 line-clamp-2 leading-relaxed italic">
                      "{t.tituloTesis}"
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Asesor: {t.asesor}
                    </div>
                  </td>

                  {/* Avance de los 5 requisitos */}
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">
                          {t.totalAprobados}/5 Aprobados
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {Math.round((t.totalAprobados / 5) * 100)}%
                        </span>
                      </div>
                      <div className="w-28 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            t.esAptoParaSustentar
                              ? 'bg-emerald-500'
                              : t.tieneObservaciones
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${(t.totalAprobados / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Estado y Subsanación */}
                  <td className="p-3.5">
                    {t.esAptoParaSustentar ? (
                      <div>
                        <Badge variant="success" size="sm">
                          ✓ Apto para Sustentar
                        </Badge>
                        <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                          5/5 Requisitos Conformes
                        </span>
                      </div>
                    ) : t.tieneObservaciones ? (
                      <div>
                        <Badge variant="danger" size="sm">
                          Observado
                        </Badge>
                        <span className="text-[10px] text-rose-700 font-bold block mt-1 leading-tight">
                          ⚠️ Falta subsanar: {t.documentosObservados.map((d) => d.nombreDocumento.split('(')[0].trim()).join(', ')}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <Badge variant="warning" size="sm">
                          En revisión
                        </Badge>
                        <span className="text-[10px] text-amber-700 font-medium block mt-1">
                          {t.totalEnRevision} requisito(s) pendientes
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Fecha de Carga */}
                  <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {t.fechaUltimaCarga}
                  </td>

                  {/* Botón de Acción */}
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTesistaSeleccionadoId(t.tesistaId);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-unt-blue hover:bg-unt-blue-light text-white text-xs font-bold transition-all shadow-2xs group-hover:translate-x-0.5 cursor-pointer"
                    >
                      <span>Revisar Expediente (5 Docs)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl space-y-1">
          <BookOpen className="w-6 h-6 mx-auto text-slate-300" />
          <p className="font-semibold text-slate-600">No se encontraron tesistas en esta sección.</p>
          <p className="text-[11px] text-slate-400">Intente seleccionando otra pestaña de filtro o borrando el término de búsqueda.</p>
        </div>
      )}

      {/* Modal de Observación */}
      <ObservationModal
        isOpen={docAObservar !== null}
        onClose={() => setDocAObservar(null)}
        documento={docAObservar}
        onConfirmar={handleConfirmarObservacion}
      />
    </div>
  );
};

// ==========================================
// MODAL VISUALIZADOR DE PDF OFICIAL UNT
// ==========================================
interface PDFPreviewModalProps {
  documento: DocumentoExpediente;
  onClose: () => void;
  onAprobar: (id: string) => Promise<void>;
  onObservar: () => void;
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  documento,
  onClose,
  onAprobar,
  onObservar
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera del Visor */}
        <div className="p-4 bg-[#082F64] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white leading-tight">
                {documento.nombreDocumento}
              </h3>
              <p className="text-[11px] text-blue-200">
                Graduando: {documento.tesistaNombre} (Cód: {documento.tesistaCodigo})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Visual: PDF Real desde Google Drive / Servidor (o ficha de respaldo si es registro antiguo) */}
        <div className="p-4 sm:p-5 overflow-y-auto bg-slate-100 flex-1">
          {documento.archivoUrl ? (
            <div className="space-y-3 h-full flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-unt-blue shrink-0" />
                  <span className="font-bold text-slate-800 truncate">{documento.nombreArchivo}</span>
                  <span className="text-[11px] text-slate-400 shrink-0">({documento.archivoTamano || 'PDF'})</span>
                  {documento.almacenamiento === 'google-drive' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                      Google Drive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {documento.driveFileUrl && (
                    <a
                      href={documento.driveFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-unt-blue font-bold text-[11px]"
                    >
                      <span>Abrir en Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <a
                    href={`${documento.archivoUrl}?download=1&name=${encodeURIComponent(documento.nombreArchivo || 'documento.pdf')}`}
                    download={documento.nombreArchivo || 'documento.pdf'}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px]"
                  >
                    <Download className="w-3 h-3" />
                    <span>Descargar PDF</span>
                  </a>
                </div>
              </div>

              <iframe
                src={documento.archivoUrl}
                title={documento.nombreArchivo || documento.nombreDocumento}
                className="w-full h-[60vh] min-h-[460px] rounded-xl border border-slate-300 bg-white shadow-inner"
              />
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl shadow-xs border border-slate-200 max-w-2xl mx-auto space-y-6 relative overflow-hidden min-h-[420px]">
              <div className="border-b-2 border-unt-blue pb-4 flex items-center justify-between text-left">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-unt-blue">
                    Universidad Nacional de Trujillo
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-700">
                    Facultad de Ingeniería · Escuela Profesional de Ingeniería Industrial
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                  EXP-2026-{documento.tesistaCodigo.slice(-4)}
                </span>
              </div>

              <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                <div className="text-center py-2">
                  <span className="font-bold uppercase tracking-wide text-slate-900 text-sm">
                    {documento.nombreDocumento}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                  <div><span className="font-bold">Archivo:</span> {documento.nombreArchivo || 'documento_valido.pdf'}</div>
                  <div><span className="font-bold">Fecha de Presentación:</span> {documento.fechaSubida}</div>
                  <div><span className="font-bold">Tamaño de Archivo:</span> {documento.archivoTamano || '1.8 MB'}</div>
                  <div><span className="font-bold">Estado Actual:</span> {documento.estado}</div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                  Este registro fue cargado sin archivo PDF real adjunto. Cuando el tesista sube un archivo PDF real desde su equipo, aquí se visualiza el documento PDF completo directamente desde Google Drive.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra de Acciones del Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Documento autenticado en el sistema institucional UNT</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onObservar}
              className="px-3.5 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Observar Documento
            </button>
            <button
              type="button"
              onClick={() => onAprobar(documento.id)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aprobar Requisito</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
