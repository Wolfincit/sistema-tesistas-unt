import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PreReservasTable } from '../components/admin/PreReservasTable';
import { CalendarView } from '../components/auditorio/CalendarView';
import { SlotDrawer } from '../components/auditorio/SlotDrawer';
import { DocumentReviewTable } from '../components/admin/DocumentReviewTable';
import { ConsultasSecretaria } from '../components/admin/ConsultasSecretaria';
import { FormatosManager } from '../components/admin/FormatosManager';
import { ControlAccesos } from '../components/admin/ControlAccesos';
import { PreguntasFrecuentesPage } from './PreguntasFrecuentesPage';

interface AdminDashboardPageProps {
  subPestanaInicial?: 'auditorio' | 'documentos' | 'consultas' | 'formatos' | 'accesos' | 'faqs' | 'kpis';
  onCambiarPestana?: (pestana: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  subPestanaInicial = 'auditorio',
  onCambiarPestana
}) => {
  const { reservas, bloqueos, documentos } = useApp();
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [pestanaInterna, setPestanaInterna] = useState<string | null>(null);
  const [tesistaDirectoId, setTesistaDirectoId] = useState<string | null>(null);

  const pestanaActiva = pestanaInterna || subPestanaInicial;

  React.useEffect(() => {
    setPestanaInterna(null);
  }, [subPestanaInicial]);

  const bloqueoDelDia = bloqueos.find((b) => b.fecha === fechaSeleccionada);
  const reservasDelDia = reservas.filter((r) => r.fecha === fechaSeleccionada);

  return (
    <div className="space-y-5">
      {/* Módulo 1: Control de Auditorio */}
      {pestanaActiva === 'auditorio' && (
        <div className="space-y-5">
          <PreReservasTable reservas={reservas} />

          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Calendario de Salas
            </h3>

            <CalendarView
              reservas={reservas}
              bloqueos={bloqueos}
              fechaSeleccionada={fechaSeleccionada}
              onSelectFecha={(fecha: string) => setFechaSeleccionada(fecha)}
              modoAdmin={true}
            />
          </div>

          {fechaSeleccionada && (
            <SlotDrawer
              fecha={fechaSeleccionada}
              onClose={() => setFechaSeleccionada(null)}
              bloqueo={bloqueoDelDia}
              reservasDelDia={reservasDelDia}
              modoAdmin={true}
              onIrARevision={(tId) => {
                setTesistaDirectoId(tId);
                setPestanaInterna('documentos');
                if (onCambiarPestana) {
                  onCambiarPestana('admin-documentos');
                }
              }}
            />
          )}
        </div>
      )}

      {/* Módulo 2: Revisión de Expedientes (Mesa de Partes agrupada por Tesista) */}
      {pestanaActiva === 'documentos' && (
        <div className="space-y-5">
          <DocumentReviewTable documentos={documentos} tesistaInicialId={tesistaDirectoId} />
        </div>
      )}

      {/* Módulo 3: Buzón de Consultas y Preguntas en Tiempo Real */}
      {(pestanaActiva === 'consultas' || pestanaActiva === 'kpis') && (
        <div className="space-y-5">
          <ConsultasSecretaria />
        </div>
      )}

      {/* Módulo 4: Gestor de Formatos y Plantillas Oficiales */}
      {pestanaActiva === 'formatos' && (
        <div className="space-y-5">
          <FormatosManager />
        </div>
      )}

      {/* Módulo 5: Control de Accesos y Padrón de Egresados */}
      {pestanaActiva === 'accesos' && (
        <div className="space-y-5">
          <ControlAccesos />
        </div>
      )}

      {/* Módulo 6: Preguntas Frecuentes Editables por Secretaría */}
      {pestanaActiva === 'faqs' && (
        <div className="space-y-5">
          <PreguntasFrecuentesPage />
        </div>
      )}
    </div>
  );
};
