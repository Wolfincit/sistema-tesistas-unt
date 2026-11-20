import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { DocumentoExpediente } from '../../types';
import { AlertTriangle, Send } from 'lucide-react';

interface ObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  documento: DocumentoExpediente | null;
  onConfirmar: (id: string, motivo: string) => Promise<void>;
}

export const ObservationModal: React.FC<ObservationModalProps> = ({
  isOpen,
  onClose,
  documento,
  onConfirmar
}) => {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (!documento) return null;

  const plantillasComunes = [
    'El reporte de similitud Turnitin excede el límite del 20% normado por la UNT.',
    'Carece de la firma digital verificable del docente asesor en la página final.',
    'El FUT no especifica el título definitivo idéntico a la Resolución Decanal.',
    'Constancia no actualizada al semestre académico en curso.'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) return;
    setEnviando(true);
    await onConfirmar(documento.id, motivo.trim());
    setEnviando(false);
    setMotivo('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Observar Requisito Documentario"
      subtitle={`Tesista: ${documento.tesistaNombre} (${documento.tesistaCodigo})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <p className="font-semibold">Requisito a observar: {documento.nombreDocumento}</p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Archivo adjunto: {documento.nombreArchivo || 'Sin archivo'}
          </p>
        </div>

        {/* Plantillas Rápidas */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Plantillas de observación frecuente:
          </span>
          <div className="space-y-1">
            {plantillasComunes.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMotivo(p)}
                className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-700 border border-slate-200/60 transition-colors"
              >
                • {p}
              </button>
            ))}
          </div>
        </div>

        {/* Campo de Texto para la Observación */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Detalle de la Observación (visible para el tesista):
          </label>
          <textarea
            required
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Escriba claramente la causa técnica o administrativa de la observación para que el tesista pueda subsanarla..."
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando || !motivo.trim()}
            className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            {enviando ? 'Registrando...' : 'Emitir Observación'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
