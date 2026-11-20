import React, { useState } from 'react';
import { ReservaAuditorio } from '../../types';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, XCircle, Clock, Calendar, User, BookOpen, AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import { Badge } from '../common/Badge';

interface PreReservasTableProps {
  reservas: ReservaAuditorio[];
}

export const PreReservasTable: React.FC<PreReservasTableProps> = ({ reservas }) => {
  const { aprobarReserva, rechazarReserva, cambiarEstadoReserva, liberarReserva, documentos } = useApp();
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'pre-reserva' | 'confirmada'>('pre-reserva');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const reservasFiltradas = reservas.filter((r) => {
    if (filtroEstado === 'todas') return r.estado !== 'rechazada';
    return r.estado === filtroEstado;
  });

  const handleAprobar = async (id: string) => {
    setProcesandoId(id);
    await aprobarReserva(id);
    setProcesandoId(null);
  };

  const handleRechazar = async (id: string) => {
    if (confirm('¿Está seguro de que desea rechazar y liberar este horario en el auditorio?')) {
      setProcesandoId(id);
      await rechazarReserva(id, 'Rechazada por incumplimiento de requisitos documentarios');
      setProcesandoId(null);
    }
  };

  const totalPendientes = reservas.filter((r) => r.estado === 'pre-reserva').length;
  const totalConfirmadas = reservas.filter((r) => r.estado === 'confirmada').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-4 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Gestión y Dictamen de Reservas de Auditorio
          </h3>
          <p className="text-xs text-slate-500">
            Valide la programación horaria y apruebe las sustentaciones que cuenten con expediente expedito.
          </p>
        </div>

        {/* Filtros por Estado */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFiltroEstado('pre-reserva')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              filtroEstado === 'pre-reserva'
                ? 'bg-white text-unt-blue shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Pre-reservas</span>
            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] flex items-center justify-center font-bold">
              {totalPendientes}
            </span>
          </button>
          <button
            onClick={() => setFiltroEstado('confirmada')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              filtroEstado === 'confirmada'
                ? 'bg-white text-unt-blue shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Confirmadas</span>
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">
              {totalConfirmadas}
            </span>
          </button>
          <button
            onClick={() => setFiltroEstado('todas')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filtroEstado === 'todas'
                ? 'bg-white text-unt-blue shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas
          </button>
        </div>
      </div>

      {/* Tabla Responsiva */}
      {reservasFiltradas.length > 0 ? (
        <div className="overflow-x-auto border border-slate-200/70 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Fecha y Horario</th>
                <th className="p-3.5">Tesista y Código</th>
                <th className="p-3.5">Título del Proyecto</th>
                <th className="p-3.5">Docente Asesor</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservasFiltradas.map((r) => {
                const enProceso = procesandoId === r.id;

                // Validación documental del tesista para Secretaría
                const docsTesista = documentos.filter(
                  (d) => d.tesistaId === r.tesistaId || d.tesistaCodigo === r.codigoMatricula
                );
                const reqsAprobados = docsTesista.filter((d) => d.estado === 'Aprobado').length;
                const reqsObservados = docsTesista.filter((d) => d.estado === 'Observado');
                const esApto = reqsAprobados === 5;

                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-unt-blue" />
                        <span>{r.fecha}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{r.horario}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.tesistaNombre}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        Mat: {r.codigoMatricula}
                      </span>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <p className="line-clamp-2 text-slate-700 italic">"{r.tituloTesis}"</p>
                    </td>

                    <td className="p-3.5 whitespace-nowrap text-slate-600">
                      <span className="font-medium text-slate-800">{r.asesor}</span>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <div className="space-y-1">
                        <Badge
                          variant={r.estado === 'confirmada' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {r.estado === 'confirmada' ? 'Confirmada' : 'Pre-reserva'}
                        </Badge>

                        {/* Estado del Expediente Requerido */}
                        {esApto ? (
                          <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Expediente 5/5 Apto</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-700 font-medium">
                            <span className="font-bold">Expediente {reqsAprobados}/5</span>
                            {reqsObservados.length > 0 && (
                              <span className="block text-[9px] text-rose-600">
                                Falta: {reqsObservados[0].nombreDocumento.split('(')[0].trim()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      {r.estado === 'pre-reserva' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAprobar(r.id)}
                            disabled={enProceso || !esApto}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-colors shadow-2xs text-xs ${
                              esApto
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            }`}
                            title={
                              esApto
                                ? 'Aprobar y confirmar cupo de sustentación'
                                : 'Bloqueado: Requiere tener los 5 documentos aprobados'
                            }
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {esApto ? 'Aprobar' : 'Incompleto (5/5)'}
                          </button>
                          <button
                            onClick={() => handleRechazar(r.id)}
                            disabled={enProceso}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold transition-colors cursor-pointer text-xs"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Rechazar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={async () => {
                              await cambiarEstadoReserva(r.id, 'pre-reserva');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-amber-200 text-amber-800 hover:bg-amber-50 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Revertir a Pre-reserva por corrección de secretaría"
                          >
                            <RotateCcw className="w-3 h-3" /> Revertir
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`¿Liberar este horario y cancelar la reserva de ${r.tesistaNombre}?`)) {
                                await liberarReserva(r.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Liberar el bloque de inmediato"
                          >
                            <Trash2 className="w-3 h-3" /> Liberar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
          No hay reservas registradas en este estado.
        </div>
      )}
    </div>
  );
};
