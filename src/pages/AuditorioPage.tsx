import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarView } from '../components/auditorio/CalendarView';
import { SlotDrawer } from '../components/auditorio/SlotDrawer';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2,
  Lock,
  Edit3,
  Trash2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { PredictiveAdvisorInput } from '../components/common/PredictiveAdvisorInput';
import { ReservaAuditorio } from '../types';

export const AuditorioPage: React.FC = () => {
  const { 
    reservas, 
    bloqueos, 
    usuario, 
    documentos, 
    rolActual, 
    editarReserva, 
    cancelarReservaPorTesista 
  } = useApp();

  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [reservaAEditar, setReservaAEditar] = useState<ReservaAuditorio | null>(null);
  const [editTitulo, setEditTitulo] = useState<string>('');
  const [editAsesor, setEditAsesor] = useState<string>('');
  const [guardandoEdicion, setGuardandoEdicion] = useState<boolean>(false);

  // Reservas activas del tesista actual
  const misReservas = reservas.filter((r) => r.tesistaId === usuario?.id);

  // Validación de los 5 requisitos para el tesista
  const misDocs = documentos.filter((d) => d.tesistaId === usuario?.id);
  const reqsSubidos = misDocs.filter((d) => d.estado !== 'Pendiente').length;
  const puedeReservar = reqsSubidos === 5;

  const bloqueoDelDia = bloqueos.find((b) => b.fecha === fechaSeleccionada);
  const reservasDelDia = reservas.filter(
    (r) => r.fecha === fechaSeleccionada && r.estado !== 'rechazada'
  );

  const handleAbrirEdicion = (res: ReservaAuditorio) => {
    setReservaAEditar(res);
    setEditTitulo(res.tituloTesis);
    setEditAsesor(res.asesor);
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaAEditar || !editTitulo.trim() || !editAsesor.trim()) return;
    setGuardandoEdicion(true);
    await editarReserva(reservaAEditar.id, {
      tituloTesis: editTitulo,
      asesor: editAsesor
    });
    setGuardandoEdicion(false);
    setReservaAEditar(null);
  };

  return (
    <div className="space-y-5">
      {/* Cabecera Limpia con Aviso de Sustentación (sin bloques fijos ni texto de relleno) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-unt-blue">
            Auditorio de Ingeniería Industrial
          </span>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Calendario de Sustentaciones
          </h2>
        </div>

        {misReservas.length > 0 && (
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Tienes sustentación programada el <strong>{misReservas[0].fecha}</strong> a las{' '}
              <strong>{misReservas[0].horario}</strong>. ¡No te olvides!
            </span>
          </div>
        )}
      </div>

      {/* Mi Solicitud Actual (si existe) */}
      {misReservas.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mi Reserva Programada</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Expediente: {usuario?.codigoMatricula}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {misReservas.map((res) => (
              <div
                key={res.id}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-unt-blue">
                    {res.fecha} • <span className="font-mono text-slate-700">{res.horario}</span>
                  </span>
                  <Badge
                    variant={res.estado === 'confirmada' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {res.estado === 'confirmada' ? 'Confirmada' : 'Pre-reserva'}
                  </Badge>
                </div>

                <p className="text-xs font-medium text-slate-800 line-clamp-1">
                  "{res.tituloTesis}"
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>Asesor: {res.asesor}</span>
                  <span className="text-amber-800 font-medium">Sujeto a 5/5 requisitos</span>
                </div>

                {/* Acciones para evitar errores: Corregir o Cancelar Reserva */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => handleAbrirEdicion(res)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-unt-blue flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    title="Corregir título de tesis o docente asesor"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Corregir Datos</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        confirm(
                          `¿Está seguro de cancelar y eliminar su reserva para el ${res.fecha} (${res.horario})? El bloque quedará disponible inmediatamente para otros graduandos.`
                        )
                      ) {
                        await cancelarReservaPorTesista(res.id);
                      }
                    }}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-semibold text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Cancelar y liberar este cupo en el auditorio"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>Eliminar Reserva</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerta Institucional si el Tesista no ha subido los 5 requisitos */}
      {rolActual === 'tesista' && !puedeReservar && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-2">
                <span>Reserva de Auditorio Bloqueada ({reqsSubidos}/5 Documentos Subidos)</span>
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Para solicitar fecha y turno de sustentación, primero debe adjuntar sus 5 documentos obligatorios en <strong>Gestión Documentaria</strong>. Una vez cargados los 5 requisitos, se habilitará la reserva.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calendario Interactivo Principal */}
      <CalendarView
        reservas={reservas}
        bloqueos={bloqueos}
        fechaSeleccionada={fechaSeleccionada}
        onSelectFecha={(fecha) => setFechaSeleccionada(fecha)}
      />

      {/* Panel Lateral Desplegable (Drawer) */}
      {fechaSeleccionada && (
        <SlotDrawer
          fecha={fechaSeleccionada}
          onClose={() => setFechaSeleccionada(null)}
          bloqueo={bloqueoDelDia}
          reservasDelDia={reservasDelDia}
        />
      )}

      {/* Modal para Editar/Corregir Reserva del Tesista */}
      {reservaAEditar && (
        <Modal
          isOpen={true}
          onClose={() => setReservaAEditar(null)}
          title="Corregir Datos de la Reserva"
          subtitle={`Ajuste el título definitivo del proyecto o asesor para el ${reservaAEditar.fecha} (${reservaAEditar.horario}).`}
          maxWidth="md"
        >
          <form onSubmit={handleGuardarEdicion} className="space-y-4">
            <div className="space-y-1.5 text-xs">
              <label className="block text-slate-700 font-bold">
                Título del Proyecto de Tesis:
              </label>
              <textarea
                required
                rows={3}
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
                placeholder="Ingrese el título oficial según Resolución Decanal..."
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-unt-blue/20 focus:border-unt-blue focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block text-slate-700 font-bold">
                Docente Asesor:
              </label>
              <PredictiveAdvisorInput
                value={editAsesor}
                onChange={setEditAsesor}
                placeholder="Escriba el nombre o apellido del docente asesor (ej. Hermes, Sifuentes, Ana...)"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReservaAEditar(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoEdicion || !editTitulo.trim() || !editAsesor.trim()}
                className="px-4 py-2 bg-unt-blue hover:bg-unt-blue-light text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {guardandoEdicion ? 'Guardando...' : 'Guardar Corrección'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
