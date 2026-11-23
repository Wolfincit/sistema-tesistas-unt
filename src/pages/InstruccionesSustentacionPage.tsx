import React, { useState } from 'react';
import {
  SustentacionJuevesItem,
  InstruccionPasoItem
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
  X
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

export const InstruccionesSustentacionPage: React.FC = () => {
  const { usuario, agregarToast } = useApp();
  const esSecretaria = Boolean(usuario && usuario.rol === 'secretaria');

  const [pasos, setPasos] = useState<InstruccionPasoItem[]>(() =>
    logisticaSecretariaService.getInstruccionesPasos()
  );
  const [sustentaciones, setSustentaciones] = useState<SustentacionJuevesItem[]>(() =>
    logisticaSecretariaService.getSustentacionesJueves()
  );
  const [configSust, setConfigSust] = useState(() =>
    logisticaSecretariaService.getTituloSustentaciones()
  );

  // Modal para crear / editar una Instrucción (Texto, Ícono, Imagen opcional, Link opcional, Documento opcional)
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

  // Modal para crear / editar una Sustentación Programada directamente aquí
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
    reader.onload = () => {
      setPImagenUrl(String(reader.result || ''));
    };
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
    if (!pTitulo.trim()) return;

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
    agregarToast('success', 'Instrucción Guardada', 'Se actualizaron las instrucciones para los tesistas.');
  };

  const handleEliminarPaso = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar la instrucción "${titulo}"?`)) return;
    const actualizados = pasos.filter((x) => x.id !== id);
    setPasos(actualizados);
    await logisticaSecretariaService.saveInstruccionesPasos(actualizados);
    agregarToast('info', 'Instrucción Eliminada', 'Se quitó el paso seleccionado.');
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
    agregarToast('success', 'Descarga Iniciada', `Descargando "${paso.documentoNombre}".`);
  };

  const abrirEditorSustentacion = (item?: SustentacionJuevesItem) => {
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
    if (!sTesista.trim()) return;

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
    agregarToast('success', 'Sustentación Guardada', 'Se actualizó la lista de sustentaciones programadas.');
  };

  const handleEliminarSustentacion = async (id: string, nombre: string) => {
    if (!confirm(`¿Quitar la sustentación programada de ${nombre}?`)) return;
    const actualizadas = sustentaciones.filter((x) => x.id !== id);
    setSustentaciones(actualizadas);
    await logisticaSecretariaService.saveSustentacionesJueves(actualizadas);
    agregarToast('info', 'Sustentación Retirada', 'Se actualizó la programación.');
  };

  return (
    <div className="space-y-6">
      {/* Grid Principal: Instrucciones a la izquierda + Sustentaciones Programadas a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA (7 cols): INSTRUCCIONES PASO A PASO */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Instrucciones para Sustentación de Tesis
              </h2>
              <p className="text-xs text-slate-500">
                Pasos que debe seguir el tesista en la Escuela de Ingeniería Industrial UNT
              </p>
            </div>

            {esSecretaria && (
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

                    {esSecretaria && (
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

                  {/* Link opcional y/o Documento opcional (Solo se muestran si la Secretaria los subió en este paso) */}
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

        {/* COLUMNA DERECHA (5 cols): SUSTENTACIONES PROGRAMADAS (100% EDITABLE POR SECRETARÍA) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4 h-fit">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-unt-blue" />
                <span>{configSust.titulo}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {configSust.subtitulo} · <strong>{configSust.horario}</strong>
              </p>
            </div>

            {esSecretaria && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditandoCabeceraSust(!editandoCabeceraSust)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                  title="Editar título y horario"
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

          {esSecretaria && editandoCabeceraSust && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <input
                type="text"
                value={configSust.titulo}
                onChange={(e) => {
                  const next = { ...configSust, titulo: e.target.value };
                  setConfigSust(next);
                  logisticaSecretariaService.saveTituloSustentaciones(next);
                }}
                placeholder="Título del bloque"
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
                placeholder="Horario (ej. Jueves de 11:00 a.m. a 1:00 p.m.)"
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

                    {esSecretaria ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => abrirEditorSustentacion(s)}
                          className="p-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                          title="Editar sustentación"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarSustentacion(s.id, s.tesistaNombre)}
                          className="p-1 rounded bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Eliminar sustentación"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {s.estado}
                      </span>
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

      {/* MODAL PARA EDITAR / CREAR INSTRUCCIÓN (CON ÍCONOS, IMAGEN, LINK Y SUBIR DOCUMENTO OPCIONAL) */}
      {modalPasoAbierto && (
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
                {editandoPaso ? 'Editar Instrucción' : 'Nueva Instrucción para Tesistas'}
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
                  <label className="block font-bold text-slate-700 mb-1">N° de Paso:</label>
                  <input
                    type="text"
                    required
                    value={pPaso}
                    onChange={(e) => setPPaso(e.target.value)}
                    placeholder="Paso 1"
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
                    placeholder="Título de la instrucción"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              {/* Selector Visual de Ícono */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Elegir Ícono:</label>
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
                <label className="block font-bold text-slate-700 mb-1">Explicación / Texto:</label>
                <textarea
                  rows={3}
                  required
                  value={pDescripcion}
                  onChange={(e) => setPDescripcion(e.target.value)}
                  placeholder="Escriba los detalles de este paso..."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              {/* Link opcional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Texto del Link (Opcional):
                  </label>
                  <input
                    type="text"
                    value={pLinkTexto}
                    onChange={(e) => setPLinkTexto(e.target.value)}
                    placeholder="Ej: Ir a plataforma"
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

              {/* Subir Imagen Opcional y Subir Documento Opcional para esta instrucción */}
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
                      <span>✓ Imagen cargada</span>
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
                  <span className="font-bold text-slate-700 block">
                    Documento / Formato (Opcional):
                  </span>
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
                  className="px-5 py-2 rounded-xl bg-[#082F64] text-white font-bold cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR / AGREGAR SUSTENTACIÓN PROGRAMADA */}
      {modalSustAbierto && (
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
                {editandoSust ? 'Editar Sustentación Programada' : 'Agregar Sustentación Programada'}
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
                  placeholder="Nombre completo del tesista"
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título de la Tesis:</label>
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
                  className="px-5 py-2 rounded-xl bg-[#082F64] text-white font-bold cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
