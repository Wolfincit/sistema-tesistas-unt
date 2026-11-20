import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DOCUMENTOS_REQUERIDOS } from '../data/mockDocumentos';
import { TipoDocumentoId, DocumentoExpediente, DocumentoRequerido } from '../types';
import { ProgressBanner } from '../components/documentos/ProgressBanner';
import { DocumentCard } from '../components/documentos/DocumentCard';
import { DocumentUploadModal } from '../components/documentos/DocumentUploadModal';
import { FileText, Download } from 'lucide-react';

export const DocumentosPage: React.FC = () => {
  const { documentos, usuario, formatos, agregarToast } = useApp();
  const [modalTipoId, setModalTipoId] = useState<TipoDocumentoId | null>(null);

  // Filtrar documentos del tesista activo
  const misDocs = documentos.filter((d: DocumentoExpediente) => d.tesistaId === usuario?.id);

  return (
    <div className="space-y-6">
      {/* Banner Superior de Progreso con alerta institucional */}
      <ProgressBanner documentos={misDocs} />

      {/* Formatos Oficiales Subidos por Secretaría disponibles para el Tesista */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-unt-blue" />
            <span>Formatos Oficiales</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {formatos.map((fmt) => (
            <div
              key={fmt.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-2.5 shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-unt-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {fmt.tipo}
                  </span>
                  <span className="font-mono text-slate-500">
                    {fmt.formato} • {fmt.peso}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                  {fmt.nombre}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                  {fmt.descripcion}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const contenido = `UNIVERSIDAD NACIONAL DE TRUJILLO\nFACULTAD DE INGENIERIA\nESCUELA PROFESIONAL DE INGENIERIA INDUSTRIAL\n\nPLANTILLA OFICIAL: ${fmt.nombre}\nArchivo: ${fmt.archivoNombre}\nTipo: ${fmt.tipo}\n\nDescripcion:\n${fmt.descripcion}\n\nInstrucciones:\nComplete este formato con sus datos de matricula y adjuntelo en PDF en el modulo de Gestion Documentaria.\n`;
                  const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = fmt.archivoNombre || `${fmt.nombre.replace(/\s+/g, '_')}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  agregarToast(
                    'success',
                    'Descarga Iniciada',
                    `Se descargó la plantilla oficial: "${fmt.nombre}".`
                  );
                }}
                className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 text-unt-blue border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Formato ({fmt.formato})</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de los 5 Requisitos Documentarios */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Lista de Requisitos para Obtención del Título Profesional
          </h3>
          <span className="text-xs text-slate-500">
            Escuela Profesional de Ingeniería Industrial
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOCUMENTOS_REQUERIDOS.map((req: DocumentoRequerido) => {
            const docSubido = misDocs.find((d: DocumentoExpediente) => d.tipoId === req.id);
            return (
              <DocumentCard
                key={req.id}
                requisito={req}
                documento={docSubido}
                onAbrirUpload={(tipoId: string) => setModalTipoId(tipoId as TipoDocumentoId)}
              />
            );
          })}
        </div>
      </div>

      {/* Modal de Carga de Archivos */}
      <DocumentUploadModal
        isOpen={modalTipoId !== null}
        onClose={() => setModalTipoId(null)}
        tipoId={modalTipoId}
      />
    </div>
  );
};
