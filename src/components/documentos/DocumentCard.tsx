import React, { useState } from 'react';
import { DocumentoExpediente, DocumentoRequerido, DocumentoEstado } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileQuestion,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Edit3
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface DocumentCardProps {
  requisito: DocumentoRequerido;
  documento?: DocumentoExpediente;
  onAbrirUpload: (tipoId: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  requisito,
  documento,
  onAbrirUpload
}) => {
  const { eliminarDocumento } = useApp();
  const [eliminando, setEliminando] = useState(false);

  const estado: DocumentoEstado = documento ? documento.estado : 'Pendiente';

  const estadoBadgeVariant: Record<DocumentoEstado, 'success' | 'warning' | 'danger' | 'neutral'> = {
    Aprobado: 'success',
    'En revisión': 'warning',
    Observado: 'danger',
    Pendiente: 'neutral'
  };

  const handleEliminar = async () => {
    if (!documento) return;
    if (confirm(`¿Está seguro de eliminar el archivo cargado para "${requisito.nombre}"? Se retirará también de la bandeja de Secretaría y podrá adjuntar el documento correcto.`)) {
      setEliminando(true);
      await eliminarDocumento(documento.id);
      setEliminando(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs transition-all hover:border-slate-300 space-y-4">
      {/* Encabezado: Número y Estado */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-unt-blue text-white text-xs font-bold flex items-center justify-center">
            {requisito.orden}
          </span>
          <span className="text-xs font-mono font-semibold uppercase text-slate-400">
            Requisito Oficial #{requisito.orden}
          </span>
        </div>

        <Badge variant={estadoBadgeVariant[estado]} size="sm">
          {estado}
        </Badge>
      </div>

      {/* Título y Descripción del Requisito */}
      <div>
        <h3 className="text-base font-bold text-slate-900 leading-snug">
          {requisito.nombre}
        </h3>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          {requisito.descripcion}
        </p>
      </div>

      {/* Información del archivo cargado (si existe) */}
      {documento?.nombreArchivo && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 truncate">
            <FileText className="w-4 h-4 text-unt-blue shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-slate-800 truncate block">
                {documento.nombreArchivo}
              </span>
              <span className="text-[11px] text-slate-400">
                {documento.archivoTamano || '1.2 MB'} • Subido el {documento.fechaSubida}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => onAbrirUpload(requisito.id)}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-unt-blue flex items-center gap-1 transition-colors cursor-pointer"
              title="Reemplazar archivo o corregir nombre"
            >
              <Edit3 className="w-3 h-3" />
              <span>Editar</span>
            </button>
            <button
              type="button"
              disabled={eliminando}
              onClick={handleEliminar}
              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded text-[11px] font-semibold text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
              title="Eliminar este archivo de su expediente y de secretaría"
            >
              <Trash2 className="w-3 h-3 text-rose-600" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      )}

      {/* Bloque de Observación de Secretaría (si está Observado) */}
      {estado === 'Observado' && documento?.observacion && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Observación emitida por Secretaría Académica:</span>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed bg-white/70 p-3 rounded-lg border border-rose-100">
            "{documento.observacion}"
          </p>
          <div className="flex items-center justify-between text-[11px] text-rose-600 pt-1">
            <span>Revisor: {documento.revisadoPor || 'Secretaría Académica'}</span>
            <span>{documento.fechaRevision}</span>
          </div>
        </div>
      )}

      {/* Bloque de Aprobación */}
      {estado === 'Aprobado' && (
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verificado por: <strong>{documento?.revisadoPor || 'Secretaría Académica'}</strong></span>
          </div>
          <span className="text-[11px] text-emerald-700 font-mono">{documento?.fechaRevision}</span>
        </div>
      )}

      {/* Acciones del Tesista */}
      <div className="pt-2 flex items-center justify-between">
        {estado === 'Aprobado' ? (
          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Requisito Conforme
          </span>
        ) : estado === 'Observado' ? (
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <button
              onClick={() => onAbrirUpload(requisito.id)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Subsanar y Re-subir Archivo Corregido
            </button>
            <button
              type="button"
              disabled={eliminando}
              onClick={handleEliminar}
              className="px-3 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              title="Eliminar archivo observado"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Eliminar</span>
            </button>
          </div>
        ) : estado === 'En revisión' ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-amber-700 flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4" /> En cola de verificación
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAbrirUpload(requisito.id)}
                className="text-xs text-slate-600 hover:text-unt-blue underline cursor-pointer font-medium"
              >
                Reemplazar
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                disabled={eliminando}
                onClick={handleEliminar}
                className="text-xs text-rose-600 hover:text-rose-800 underline cursor-pointer font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onAbrirUpload(requisito.id)}
            className="w-full py-2.5 px-4 rounded-xl bg-unt-blue hover:bg-unt-blue-light text-white text-xs font-bold shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-unt-gold" /> Adjuntar Documento (PDF)
          </button>
        )}
      </div>
    </div>
  );
};
