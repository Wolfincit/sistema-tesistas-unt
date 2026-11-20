import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { DOCUMENTOS_REQUERIDOS } from '../../data/mockDocumentos';
import { TipoDocumentoId } from '../../types';
import { useApp } from '../../context/AppContext';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoId: TipoDocumentoId | null;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  tipoId
}) => {
  const { subirDocumento } = useApp();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [nombreArchivoEditado, setNombreArchivoEditado] = useState<string>('');
  const [enviando, setEnviando] = useState<boolean>(false);
  const [arrastrando, setArrastrando] = useState<boolean>(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const requisito = DOCUMENTOS_REQUERIDOS.find((r) => r.id === tipoId);

  // Prellenar nombre sugerido oficial cuando cambia el requisito
  useEffect(() => {
    if (requisito && !archivo) {
      setNombreArchivoEditado(`${requisito.id.toUpperCase()}_Industrial_UNT_2026.pdf`);
    }
    setErrorValidacion(null);
  }, [requisito, archivo]);

  if (!tipoId || !requisito) return null;

  const validarArchivo = (file: File): boolean => {
    setErrorValidacion(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorValidacion('Formato inválido: Únicamente se admiten documentos oficiales en formato PDF no editable.');
      return false;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorValidacion('El archivo excede el tamaño máximo permitido de 25 MB.');
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validarArchivo(file)) {
        setArchivo(file);
        setNombreArchivoEditado(file.name);
      } else {
        e.target.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validarArchivo(file)) {
        setArchivo(file);
        setNombreArchivoEditado(file.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!nombreArchivoEditado.trim() || nombreArchivoEditado.trim().length < 4) {
      setErrorValidacion('Debe especificar un nombre válido para el documento.');
      return;
    }

    setEnviando(true);

    const nombreFinal = nombreArchivoEditado.trim().endsWith('.pdf')
      ? nombreArchivoEditado.trim()
      : `${nombreArchivoEditado.trim()}.pdf`;

    const archivoAEnviar = archivo
      ? new File([archivo], nombreFinal, { type: archivo.type })
      : {
          name: nombreFinal,
          size: '1.8 MB'
        };

    await subirDocumento(tipoId, archivoAEnviar);
    setEnviando(false);
    setArchivo(null);
    setNombreArchivoEditado('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Carga de Documento: ${requisito.nombre}`}
      subtitle="El archivo debe estar en formato PDF no editable y con firmas legibles."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Alerta de Error de Validación */}
        {errorValidacion && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorValidacion}</span>
          </div>
        )}

        {/* Zona de Selección o Arrastre de Archivo */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            arrastrando
              ? 'border-unt-blue bg-blue-50/50'
              : archivo
              ? 'border-emerald-300 bg-emerald-50/30'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          {archivo ? (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{archivo.name}</p>
                <p className="text-[11px] text-slate-500">
                  {(archivo.size / (1024 * 1024)).toFixed(2)} MB • Archivo cargado correctamente
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setArchivo(null);
                  setNombreArchivoEditado(`${requisito.id.toUpperCase()}_Industrial_UNT_2026.pdf`);
                }}
                className="text-xs text-rose-600 hover:underline cursor-pointer"
              >
                Cambiar archivo seleccionado
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-unt-blue flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Arrastre su documento PDF aquí o
                </p>
                <label className="text-xs font-bold text-unt-blue hover:underline cursor-pointer inline-block mt-1">
                  examinar archivos locales
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <p className="text-[10px] text-slate-400">
                Límite máximo por archivo: 25 MB (formato PDF oficial)
              </p>
            </div>
          )}
        </div>

        {/* Cuadro editable con el título / nombre con el que se registrará el documento */}
        <div className="text-xs space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <label className="block text-slate-700 font-bold flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-unt-blue" />
            <span>Nombre del documento a registrar en su expediente:</span>
          </label>
          <input
            type="text"
            required
            value={nombreArchivoEditado}
            onChange={(e) => setNombreArchivoEditado(e.target.value)}
            placeholder={`Ej: ${requisito.id.toUpperCase()}_Ramos_Valeria_2026.pdf`}
            className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-unt-blue/20 focus:border-unt-blue"
          />
          <p className="text-[10px] text-slate-500">
            Se toma el nombre de su archivo. Puede editarlo o personalizarlo antes de remitirlo a Secretaría.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-unt-blue shrink-0 mt-0.5" />
          <span>
            Al enviar este documento, su expediente pasará inmediatamente a estado{' '}
            <strong className="text-slate-800">"En revisión"</strong> y se notificará al personal de Secretaría Académica para su cotejo.
          </span>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando || !nombreArchivoEditado.trim()}
            className="flex-1 py-2.5 bg-unt-blue hover:bg-unt-blue-light text-white rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {enviando ? 'Subiendo documento...' : 'Confirmar y Enviar a Revisión'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
