import React, { useState, useMemo } from 'react';
import {
  SustentacionJuevesItem,
  InstruccionPasoItem,
  SeguimientoTesisItem
} from '../data/mockLogisticaSecretaria';
import { logisticaSecretariaService } from '../services/logisticaSecretariaService';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Download,
  Calendar,
  ClipboardList,
  CheckCircle2,
  Users,
  Mail,
  Award,
  Link2,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  X,
  Search,
  Package,
  Building2
} from 'lucide-react';

const ICONOS_DISPONIBLES: {
  id: InstruccionPasoItem['icono'];
  label: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'clipboard', label: 'Trámite', Icon: ClipboardList },
  { id: 'users', label: 'Jurado', Icon: Users },
  { id: 'calendar', label: 'Calendario', Icon: Calendar },
  { id: 'mail', label: 'Correo', Icon: Mail },
  { id: 'award', label: 'Sustentación', Icon: Award },
  { id: 'file', label: 'Documento', Icon: FileText },
  { id: 'check', label: 'Conformidad', Icon: CheckCircle2 },
  { id: 'link', label: 'Enlace', Icon: Link2 }
];

const PASOS_COURIER = [
  { id: 1, titulo: '1. Recibido', Icon: Package },
  { id: 2, titulo: '2. En Decanato', Icon: Building2 },
  { id: 3, titulo: '3. En Jurado', Icon: Users },
  { id: 4, titulo: '4. Listo Jueves', Icon: Award }
];

interface InstruccionesSustentacionPageProps {
  /** Solo true cuando se abre desde la pestaña 2 exclusiva del panel de Secretaría */
  modoEdicionSecretaria?: boolean;
}

export const InstruccionesSustentacionPage: React.FC<InstruccionesSustentacionPageProps> = ({
  modoEdicionSecretaria = false
}) => {
  const { usuario, agregarToast } = useApp();
  // ESTRICTO: Solo permite editar si está autenticada la Secretaria Y está en su pestaña exclusiva de edición
  const puedeEditar = Boolean(usuario && usuario.rol === 'secretaria' && modoEdicionSecretaria);

  const [pasos, setPasos] = useState<InstruccionPasoItem[]>(() =>
    logisticaSecretariaService.getInstruccionesPasos()
  );
  const [sustentaciones, setSustentaciones] = useState<SustentacionJuevesItem[]>(() =>
    logisticaSecretariaService.getSustentacionesJueves()
  );
  const [seguimientos] = useState<SeguimientoTesisItem[]>(() =>
    logisticaSecretariaService.getSeguimientos()
  );
  const [configSust, setConfigSust] = useState(() =>
    logisticaSecretariaService.getTituloSustentaciones()
  );

  // Rastreador Tipo Olva Courier: exige el código de matrícula completo de 10 dígitos (ej. 1511300223)
  const [busquedaCourier, setBusquedaCourier] = useState<string>('');
  const codigoLimpio = busquedaCourier.replace(/\D/g, '').slice(0, 10);

  const resultadosCourier = useMemo(() => {
    if (codigoLimpio.length !== 10) return [];
    return seguimientos.filter((s) => s.codigoMatricula.trim() === codigoLimpio);
  }, [codigoLimpio, seguimientos]);

  // Modal para crear / editar una Instrucción (Exclusivo Secretaría)
  const [modalPasoAbierto, setModalPasoAbierto] = useState<boolean>(false);
  const [editandoPaso, setEditandoPaso] = useState<InstruccionPasoItem | null>(null);
  const [pPaso, setPPaso] = useState<string>('Paso 1');
  const [pIcono, setPIcono] = useState<InstruccionPasoItem['icono']>('clipboard');
  const [pTitulo, setPTitulo] = useState<string>('');
  const [pDescripcion, setPDescripcion] = useState<string>('');
  const [pImagenUrl, setPImagenUrl] = useState<string>('');
  const [pLinkTexto, setPLinkTexto] = useState<string>('');
  const [pLinkUrl, setPLinkUrl] = useState<string>('');
  const [pDocNombre, setPDocNombre] = useState<string>('');
  const [pDocDataUrl, setPDocDataUrl] = useState<string>('');
  const [pDocPeso, setPDocPeso] = useState<string>('');

  // Modal para crear / editar una Sustentación Programada (Exclusivo Secretaría)
  const [modalSustAbierto, setModalSustAbierto] = useState<boolean>(false);
  const [editandoSust, setEditandoSust] = useState<SustentacionJuevesItem | null>(null);
  const [sFecha, setSFecha] = useState<string>('2026-11-26');
  const [sHorario, setSHorario] = useState<string>('11:00 a.m. - 01:00 p.m.');
  const [sTesista, setSTesista] = useState<string>('');
  const [sTitulo, setSTitulo] = useState<string>('');
  const [sPresidente, setSPresidente] = useState<string>('');
  const [sSecretario, setSSecretario] = useState<string>('');
  const [sVocal, setSVocal] = useState<string>('');
  const [editandoCabeceraSust, setEditandoCabeceraSust] = useState<boolean>(false);

  const abrirEditorPaso = (item?: InstruccionPasoItem) => {
    if (!puedeEditar) return;
    if (item) {
      setEditandoPaso(item);
      setPPaso(item.paso);
      setPIcono(item.icono || 'clipboard');
      setPTitulo(item.titulo);
      setPDescripcion(item.descripcion);
      setPImagenUrl(item.imagenDataUrl || '');
      setPLinkTexto(item.linkTexto || '');
      setPLinkUrl(item.linkUrl || '');
      setPDocNombre(item.documentoNombre || '');
      setPDocDataUrl(item.documentoDataUrl || '');
      setPDocPeso(item.documentoPeso || '');
    } else {
      setEditandoPaso(null);
      setPPaso(`Paso ${pasos.length + 1}`);
      setPIcono('clipboard');
      setPTitulo('');
      setPDescripcion('');
      setPImagenUrl('');
      setPLinkTexto('');
      setPLinkUrl('');
      setPDocNombre('');
      setPDocDataUrl('');
      setPDocPeso('');
    }
    setModalPasoAbierto(true);
  };

  const handleSubirImagenPaso = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPImagenUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleSubirDocumentoPaso = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const pesoStr =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    const reader = new FileReader();
    reader.onload = () => {
      setPDocNombre(file.name);
      setPDocDataUrl(String(reader.result || ''));
      setPDocPeso(pesoStr);
    };
    reader.readAsDataURL(file);
  };

  const handleGuardarPaso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeEditar || !pTitulo.trim()) return;

    const nuevo: InstruccionPasoItem = {
      id: editandoPaso ? editandoPaso.id : `inst-${Date.now()}`,
      paso: pPaso.trim() || `Paso ${pasos.length + 1}`,
      icono: pIcono,
      titulo: pTitulo.trim(),
      descripcion: pDescripcion.trim(),
      imagenDataUrl: pImagenUrl || undefined,
      linkTexto: pLinkTexto.trim() || undefined,
      linkUrl: pLinkUrl.trim() || undefined,
      documentoNombre: pDocNombre.trim() || undefined,
      documentoDataUrl: pDocDataUrl || undefined,
      documentoPeso: pDocPeso || undefined
    };

    const actualizados = editandoPaso
      ? pasos.map((x) => (x.id === editandoPaso.id ? nuevo : x))
      : [...pasos, nuevo];

    setPasos(actualizados);
    await logisticaSecretariaService.saveInstruccionesPasos(actualizados);
    setModalPasoAbierto(false);
    agregarToast('success', 'Publicado en Interfaz Principal', 'El paso quedó publicado para los tesistas.');
  };

  const handleEliminarPaso = async (id: string, titulo: string) => {
    if (!puedeEditar) return;
    if (!confirm(`¿Eliminar "${titulo}"?`)) return;
    const actualizados = pasos.filter((x) => x.id !== id);
    setPasos(actualizados);
    await logisticaSecretariaService.saveInstruccionesPasos(actualizados);
    agregarToast('info', 'Eliminado', 'Se actualizó la interfaz principal.');
  };

  const handleDescargarDocPaso = (paso: InstruccionPasoItem) => {
    if (!paso.documentoNombre) return;
    if (paso.documentoDataUrl) {
      const a = document.createElement('a');
      a.href = paso.documentoDataUrl;
      a.download = paso.documentoNombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const texto = `UNIVERSIDAD NACIONAL DE TRUJILLO\nESCUELA DE INGENIERÍA INDUSTRIAL\n\nDOCUMENTO: ${paso.documentoNombre}\n${paso.titulo}\n\n${paso.descripcion}\n`;
      const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = paso.documentoNombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    agregarToast('success', 'Descargando', paso.documentoNombre);
  };

  const abrirEditorSustentacion = (item?: SustentacionJuevesItem) => {
    if (!puedeEditar) return;
    if (item) {
      setEditandoSust(item);
      setSFecha(item.fecha);
      setSHorario(item.horario);
      setSTesista(item.tesistaNombre);
      setSTitulo(item.tituloTesis);
      setSPresidente(item.juradoPresidente);
      setSSecretario(item.juradoSecretario);
      setSVocal(item.juradoVocal);
    } else {
      setEditandoSust(null);
      setSFecha('2026-11-26');
      setSHorario('11:00 a.m. - 01:00 p.m.');
      setSTesista('');
      setSTitulo('');
      setSPresidente('');
      setSSecretario('');
      setSVocal('');
    }
    setModalSustAbierto(true);
  };

  const handleGuardarSustentacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeEditar || !sTesista.trim()) return;

    const nueva: SustentacionJuevesItem = {
      id: editandoSust ? editandoSust.id : `jue-${Date.now()}`,
      fecha: sFecha,
      horario: sHorario.trim() || '11:00 a.m. - 01:00 p.m.',
      tesistaNombre: sTesista.trim(),
      tesistaCodigo: editandoSust?.tesistaCodigo || '',
      tesistaCorreo: editandoSust?.tesistaCorreo || '',
      tituloTesis: sTitulo.trim(),
      asesor: editandoSust?.asesor || '',
      juradoPresidente: sPresidente.trim(),
      juradoSecretario: sSecretario.trim(),
      juradoVocal: sVocal.trim(),
      aulaOAuditorio: 'Auditorio de Ingeniería Industrial UNT',
      estado: 'Programada'
    };

    const actualizadas = editandoSust
      ? sustentaciones.map((x) => (x.id === editandoSust.id ? nueva : x))
      : [...sustentaciones, nueva];

    setSustentaciones(actualizadas);
    await logisticaSecretariaService.saveSustentacionesJueves(actualizadas);
    setModalSustAbierto(false);
    agregarToast('success', 'Publicado', 'Sustentación actualizada en la interfaz principal.');
  };

  const handleEliminarSustentacion = async (id: string, nombre: string) => {
    if (!puedeEditar) return;
    if (!confirm(`¿Quitar la sustentación de ${nombre}?`)) return;
    const actualizadas = sustentaciones.filter((x) => x.id !== id);
    setSustentaciones(actualizadas);
    await logisticaSecretariaService.saveSustentacionesJueves(actualizadas);
  };

  return (
    <div className="space-y-6">
      {/* =====================================================================
          RASTREADOR VISUAL TIPO OLVA COURIER (EXCLUSIVO DE LA INTERFAZ PRINCIPAL PARA EL TESISTA)
         ===================================================================== */}
      {!puedeEditar && (
        <div className="bg-gradient-to-r from-[#082F64] to-[#0C4D96] rounded-2xl p-5 sm:p-6 text-white shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                  Rastrea el estado de tu Tesis
                </h2>
                <p className="text-xs text-blue-200">
                  Ingresa tu número de matrícula completo de 10 dígitos (ej. 1511300223)
                </p>
              </div>
            </div>

            <div className="text-[11px] font-mono text-amber-300 bg-white/10 px-3 py-1 rounded-lg">
              {codigoLimpio.length}/10 dígitos
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={codigoLimpio}
              onChange={(e) => setBusquedaCourier(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Ingresa tus 10 dígitos de matrícula (ej. 1511300223)..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-slate-900 text-xs sm:text-sm font-mono font-bold tracking-wider focus:outline-hidden shadow-xs"
            />
          </div>

          {codigoLimpio.length > 0 && codigoLimpio.length < 10 && (
            <div className="p-3 rounded-xl bg-white/10 text-xs text-amber-200 font-semibold">
              Completa los 10 dígitos de tu número de matrícula para consultar tu trámite ({codigoLimpio.length} de 10 dígitos ingresados).
            </div>
          )}

          {codigoLimpio.length === 10 && (
            <div className="space-y-3">
              {resultadosCourier.length > 0 ? (
                resultadosCourier.map((item) => {
                  const pasoActual = item.estacionActual > 4 ? 4 : item.estacionActual;
                  return (
                    <div
                      key={item.id}
                      className="bg-white text-slate-800 rounded-2xl p-5 shadow-md space-y-4 animate-in fade-in"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">
                              {item.tesistaNombre}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                              Matrícula: {item.codigoMatricula}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 italic mt-0.5">
                            "{item.tituloTesis}"
                          </div>
                        </div>
                        {item.fechaSustentacionProgramada && (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                            📅 Jueves {item.fechaSustentacionProgramada} (11:00 a.m. - 1:00 p.m.)
                          </span>
                        )}
                      </div>

                      {/* Barra Visual Secuencial Tipo Olva Courier (4 íconos grandes) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {PASOS_COURIER.map(({ id, titulo, Icon }) => {
                          const completado = pasoActual > id;
                          const activo = pasoActual === id;
                          return (
                            <div
                              key={id}
                              className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center gap-1.5 transition-all ${
                                activo
                                  ? 'border-[#082F64] bg-blue-50 text-[#082F64] font-black shadow-xs'
                                  : completado
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-bold'
                                  : 'border-slate-200 bg-slate-50 text-slate-400'
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  activo
                                    ? 'bg-[#082F64] text-amber-300'
                                    : completado
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 text-slate-400'
                                }`}
                              >
                                {completado ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <Icon className="w-5 h-5" />
                                )}
                              </div>
                              <span className="text-xs">{titulo}</span>
                            </div>
                          );
                        })}
                      </div>

                      {item.notasSecretaria && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                          <strong>Nota de Secretaría:</strong> {item.notasSecretaria}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-3.5 rounded-xl bg-white/10 text-xs text-blue-100">
                  No se encontró ese código o apellido en seguimiento.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          INSTRUCCIONES PASO A PASO + SUSTENTACIONES PROGRAMADAS
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA (7 cols): PASOS DE INSTRUCCIONES */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              {puedeEditar
                ? 'Editar Instrucciones (Se publican en la Interfaz Principal)'
                : 'Pasos para Sustentación de Tesis'}
            </h2>

            {puedeEditar && (
              <button
                type="button"
                onClick={() => abrirEditorPaso()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] text-white text-xs font-bold shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>+ Agregar Instrucción</span>
              </button>
            )}
          </div>

          <div className="space-y-3.5">
            {pasos.map((item) => {
              const IconObj =
                ICONOS_DISPONIBLES.find((i) => i.id === item.icono)?.Icon || ClipboardList;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#082F64] text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <IconObj className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-unt-blue">
                          {item.paso}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {item.titulo}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                          {item.descripcion}
                        </p>
                      </div>
                    </div>

                    {puedeEditar && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => abrirEditorPaso(item)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
                          title="Editar instrucción"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarPaso(item.id, item.titulo)}
                          className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 cursor-pointer"
                          title="Eliminar instrucción"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Imagen opcional si la Secretaria subió una */}
                  {item.imagenDataUrl && (
                    <div className="pl-13">
                      <img
                        src={item.imagenDataUrl}
                        alt={item.titulo}
                        className="max-h-56 rounded-xl border border-slate-200 object-contain"
                      />
                    </div>
                  )}

                  {/* Link opcional y/o Documento opcional */}
                  {(item.linkUrl || item.documentoNombre) && (
                    <div className="pl-13 flex flex-wrap items-center gap-2 pt-1">
                      {item.linkUrl && (
                        <a
                          href={item.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-unt-blue border border-blue-200 text-xs font-bold transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{item.linkTexto || 'Abrir enlace'}</span>
                        </a>
                      )}

                      {item.documentoNombre && (
                        <button
                          type="button"
                          onClick={() => handleDescargarDocPaso(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-unt-blue" />
                          <span>{item.documentoNombre}</span>
                          {item.documentoPeso && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({item.documentoPeso})
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNA DERECHA (5 cols): SUSTENTACIONES PROGRAMADAS */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4 h-fit">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-unt-blue" />
                <span>{configSust.titulo}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                <strong>{configSust.horario}</strong>
              </p>
            </div>

            {puedeEditar && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditandoCabeceraSust(!editandoCabeceraSust)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                  title="Editar título"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => abrirEditorSustentacion()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#082F64] text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  <span>Agregar</span>
                </button>
              </div>
            )}
          </div>

          {puedeEditar && editandoCabeceraSust && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <input
                type="text"
                value={configSust.titulo}
                onChange={(e) => {
                  const next = { ...configSust, titulo: e.target.value };
                  setConfigSust(next);
                  logisticaSecretariaService.saveTituloSustentaciones(next);
                }}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold"
              />
              <input
                type="text"
                value={configSust.horario}
                onChange={(e) => {
                  const next = { ...configSust, horario: e.target.value };
                  setConfigSust(next);
                  logisticaSecretariaService.saveTituloSustentaciones(next);
                }}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          )}

          <div className="space-y-3">
            {sustentaciones.length > 0 ? (
              sustentaciones.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl border border-blue-200 bg-blue-50/30 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#082F64] text-amber-300 font-bold text-[11px]">
                      {s.fecha} · {s.horario}
                    </span>

                    {puedeEditar && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => abrirEditorSustentacion(s)}
                          className="p-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarSustentacion(s.id, s.tesistaNombre)}
                          className="p-1 rounded bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="font-bold text-slate-900 text-sm">{s.tesistaNombre}</div>
                  <p className="text-[11px] text-slate-600 italic">"{s.tituloTesis}"</p>

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
                No hay sustentaciones programadas en este momento.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL PARA EDITAR / CREAR INSTRUCCIÓN (EXCLUSIVO SECRETARÍA) */}
      {puedeEditar && modalPasoAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setModalPasoAbierto(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#082F64] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editandoPaso ? 'Editar Instrucción' : 'Nueva Instrucción'}
              </h3>
              <button
                type="button"
                onClick={() => setModalPasoAbierto(false)}
                className="p-1 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarPaso} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paso:</label>
                  <input
                    type="text"
                    required
                    value={pPaso}
                    onChange={(e) => setPPaso(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Título:</label>
                  <input
                    type="text"
                    required
                    value={pTitulo}
                    onChange={(e) => setPTitulo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Ícono:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {ICONOS_DISPONIBLES.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPIcono(id)}
                      className={`p-2 rounded-xl border flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer ${
                        pIcono === id
                          ? 'bg-[#082F64] text-white border-[#082F64]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Texto:</label>
                <textarea
                  rows={3}
                  required
                  value={pDescripcion}
                  onChange={(e) => setPDescripcion(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nombre del Link (Opcional):
                  </label>
                  <input
                    type="text"
                    value={pLinkTexto}
                    onChange={(e) => setPLinkTexto(e.target.value)}
                    placeholder="Ej: Abrir enlace"
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    URL del Link (Opcional):
                  </label>
                  <input
                    type="url"
                    value={pLinkUrl}
                    onChange={(e) => setPLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-2">
                  <span className="font-bold text-slate-700 block">Imagen (Opcional):</span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-unt-blue font-bold cursor-pointer">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Subir imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSubirImagenPaso}
                      className="hidden"
                    />
                  </label>
                  {pImagenUrl && (
                    <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold">
                      <span>✓ Imagen lista</span>
                      <button
                        type="button"
                        onClick={() => setPImagenUrl('')}
                        className="text-rose-600 underline cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-2">
                  <span className="font-bold text-slate-700 block">Documento (Opcional):</span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-unt-blue font-bold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir documento</span>
                    <input type="file" onChange={handleSubirDocumentoPaso} className="hidden" />
                  </label>
                  {pDocNombre && (
                    <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold">
                      <span className="truncate max-w-[130px]">✓ {pDocNombre}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPDocNombre('');
                          setPDocDataUrl('');
                          setPDocPeso('');
                        }}
                        className="text-rose-600 underline cursor-pointer shrink-0"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalPasoAbierto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Publicar en Interfaz Principal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR / AGREGAR SUSTENTACIÓN PROGRAMADA (EXCLUSIVO SECRETARÍA) */}
      {puedeEditar && modalSustAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setModalSustAbierto(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#082F64] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editandoSust ? 'Editar Sustentación' : 'Agregar Sustentación'}
              </h3>
              <button
                type="button"
                onClick={() => setModalSustAbierto(false)}
                className="p-1 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarSustentacion} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha (Jueves):</label>
                  <input
                    type="date"
                    required
                    value={sFecha}
                    onChange={(e) => setSFecha(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Horario:</label>
                  <input
                    type="text"
                    required
                    value={sHorario}
                    onChange={(e) => setSHorario(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tesista:</label>
                <input
                  type="text"
                  required
                  value={sTesista}
                  onChange={(e) => setSTesista(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título de Tesis:</label>
                <textarea
                  rows={2}
                  required
                  value={sTitulo}
                  onChange={(e) => setSTitulo(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <input
                  type="text"
                  value={sPresidente}
                  onChange={(e) => setSPresidente(e.target.value)}
                  placeholder="Presidente del Jurado"
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
                <input
                  type="text"
                  value={sSecretario}
                  onChange={(e) => setSSecretario(e.target.value)}
                  placeholder="Secretario del Jurado"
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
                <input
                  type="text"
                  value={sVocal}
                  onChange={(e) => setSVocal(e.target.value)}
                  placeholder="Vocal del Jurado"
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalSustAbierto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer"
                >
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
