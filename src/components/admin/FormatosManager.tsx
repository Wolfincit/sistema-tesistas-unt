import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FormatoInstitucional } from '../../types';
import { 
  FileText, 
  UploadCloud, 
  Download, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const FormatosManager: React.FC = () => {
  const { formatos, subirFormato, eliminarFormato, agregarToast } = useApp();
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [nombre, setNombre] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [formato, setFormato] = useState<'PDF' | 'DOCX' | 'XLSX'>('PDF');
  const [tipo, setTipo] = useState<string>('Documento Obligatorio');
  const [archivoNombre, setArchivoNombre] = useState<string>('');
  const [enviando, setEnviando] = useState<boolean>(false);

  const handleDescargar = (fmt: FormatoInstitucional) => {
    agregarToast('success', 'Descargando Formato', `Descargando plantilla oficial: "${fmt.nombre}".`);
  };

  const handleCrearFormato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setEnviando(true);
    await subirFormato({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || 'Plantilla oficial aprobada por la Escuela de Ingeniería Industrial UNT.',
      formato,
      archivoNombre: archivoNombre.trim() || `${nombre.trim().replace(/\s+/g, '_')}.${formato.toLowerCase()}`,
      peso: '420 KB',
      tipo
    });
    setEnviando(false);
    setNombre('');
    setDescripcion('');
    setArchivoNombre('');
    setModalAbierto(false);
  };

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-unt-blue" />
            <span>Gestor de Formatos y Plantillas Oficiales UNT</span>
          </h3>
          <p className="text-xs text-slate-500">
            Suba y actualice los formatos que los tesistas tendrán disponibles para descarga inmediata (FUT, Turnitin, Reglamentos).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-unt-blue hover:bg-unt-blue-light rounded-xl shadow-2xs transition-colors cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>+ Subir Nuevo Formato Oficial</span>
        </button>
      </div>

      {/* Grid de Formatos Disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {formatos.map((fmt) => (
          <div
            key={fmt.id}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-unt-blue px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                  {fmt.tipo}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                  {fmt.formato} • {fmt.peso}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 leading-snug">
                {fmt.nombre}
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {fmt.descripcion}
              </p>
              <div className="text-[10px] text-slate-400 font-mono">
                Archivo: {fmt.archivoNombre} • Actualizado: {fmt.fechaSubida}
              </div>
            </div>

            {/* Acciones de Secretaría */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleDescargar(fmt)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-unt-blue hover:underline cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar copia</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (confirm(`¿Eliminar la plantilla "${fmt.nombre}"?`)) {
                    await eliminarFormato(fmt.id);
                  }
                }}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Eliminar este formato"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para Subir Nuevo Formato */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-[#082F64] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-bold tracking-tight">Subir Nuevo Formato Oficial UNT</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearFormato} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nombre Oficial del Formato:
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Declaración Jurada de Originalidad Turnitin 2026"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Descripción o Instrucción para el Tesista:
                </label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Plantilla obligatoria que debe contar con firma digital del asesor..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Formato de Archivo:</label>
                  <select
                    value={formato}
                    onChange={(e) => setFormato(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="PDF">PDF (Documento Oficial)</option>
                    <option value="DOCX">DOCX (Plantilla Editable)</option>
                    <option value="XLSX">XLSX (Hoja de Cálculo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Categoría:</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  >
                    <option value="Documento Obligatorio">Documento Obligatorio</option>
                    <option value="Directiva Académica">Directiva Académica</option>
                    <option value="Plantilla Editable">Plantilla Editable</option>
                    <option value="Normativa UNT">Normativa UNT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nombre del archivo cargado:
                </label>
                <input
                  type="text"
                  value={archivoNombre}
                  onChange={(e) => setArchivoNombre(e.target.value)}
                  placeholder={`Ej: plantilla_turnitin_2026.${formato.toLowerCase()}`}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="px-4 py-2 bg-unt-blue hover:bg-unt-blue-light text-white font-bold rounded-xl shadow-2xs"
                >
                  {enviando ? 'Publicando...' : 'Publicar Formato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
