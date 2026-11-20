import React, { useState } from 'react';
import { TimeSlot, ReservaAuditorio, BloqueoFecha } from '../../types';
import { TIME_SLOTS } from '../../data/mockAuditorio';
import { useApp } from '../../context/AppContext';
import { 
  Clock, 
  CheckCircle2, 
  Ban, 
  X, 
  Check, 
  ShieldCheck,
  Edit3,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  Settings2,
  AlertTriangle,
  User,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { PredictiveAdvisorInput } from '../common/PredictiveAdvisorInput';

interface SlotDrawerProps {
  fecha: string | null;
  onClose: () => void;
  bloqueo?: BloqueoFecha;
  reservasDelDia: ReservaAuditorio[];
  modoAdmin?: boolean;
  onIrARevision?: (tesistaId: string) => void;
}

// Utilidad para ordenar bloques horarios cronológicamente según la hora de inicio
const ordenarBloquesHorarios = (bloques: string[]): string[] => {
  return [...bloques].sort((a, b) => {
    const extraerMinutos = (slot: string) => {
      const match = slot.trim().match(/^(\d{1,2}):(\d{2})/);
      if (!match) return 9999;
      const horas = parseInt(match[1], 10);
      const minutos = parseInt(match[2], 10);
      return horas * 60 + minutos;
    };
    return extraerMinutos(a) - extraerMinutos(b);
  });
};

export const SlotDrawer: React.FC<SlotDrawerProps> = ({
  fecha,
  onClose,
  reservasDelDia,
  modoAdmin = false,
  onIrARevision
}) => {
  const { 
    usuario, 
    crearPreReserva, 
    fechasHabilitadas, 
    toggleHabilitarFecha,
    getSlotsFecha,
    actualizarSlotsFecha,
    restablecerSlotsFecha,
    slotsPorFecha,
    documentos,
    cambiarEstadoReserva,
    liberarReserva
  } = useApp();

  const [horarioSeleccionado, setHorarioSeleccionado] = useState<TimeSlot | null>(null);
  const [codigoMatricula, setCodigoMatricula] = useState<string>(usuario?.codigoMatricula || '');
  const [nombreCompleto, setNombreCompleto] = useState<string>(usuario?.nombre || '');
  const [tituloTesis, setTituloTesis] = useState<string>('');
  const [asesor, setAsesor] = useState<string>('');
  const [enviando, setEnviando] = useState<boolean>(false);

  // Validación de documentos del tesista para permitir reservar
  const misDocs = documentos.filter((d) => d.tesistaId === usuario?.id);
  const reqsSubidos = misDocs.filter((d) => d.estado !== 'Pendiente').length;
  const puedeReservar = reqsSubidos === 5;

  // Estados para modificación de horarios por Secretaría
  const [modoEdicionHorario, setModoEdicionHorario] = useState<boolean>(false);
  const [slotsBorrador, setSlotsBorrador] = useState<string[]>([]);
  const [nuevoInicio, setNuevoInicio] = useState<string>('09:00');
  const [nuevoFin, setNuevoFin] = useState<string>('11:00');

  if (!fecha) return null;

  const esHabilitado = fechasHabilitadas.includes(fecha);
  const rawSlots = getSlotsFecha ? getSlotsFecha(fecha) : TIME_SLOTS;
  const slotsDelDia = ordenarBloquesHorarios(rawSlots);
  const esHorarioPersonalizado = Boolean(slotsPorFecha && slotsPorFecha[fecha] && slotsPorFecha[fecha].length > 0);

  // Formato legible en español
  const parsearFechaLegible = (fechaStr: string) => {
    const [y, m, d] = fechaStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSubmitPreReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!horarioSeleccionado || !tituloTesis.trim() || !asesor.trim()) return;

    setEnviando(true);
    await crearPreReserva({
      fecha,
      horario: horarioSeleccionado,
      codigoMatricula,
      tituloTesis,
      asesor
    });
    setEnviando(false);
    setHorarioSeleccionado(null);
  };

  const handleToggleEstadoDia = async () => {
    await toggleHabilitarFecha(fecha);
  };

  // Handlers para gestionar bloques de horarios ordenados automáticamente
  const handleIniciarEdicion = () => {
    setSlotsBorrador(ordenarBloquesHorarios([...slotsDelDia]));
    setModoEdicionHorario(true);
  };

  const handleUpdateSlotItem = (index: number, valor: string) => {
    const clon = [...slotsBorrador];
    clon[index] = valor;
    setSlotsBorrador(clon);
  };

  const handleEliminarSlotItem = (index: number) => {
    const clon = slotsBorrador.filter((_, i) => i !== index);
    setSlotsBorrador(ordenarBloquesHorarios(clon));
  };

  const handleAgregarNuevoSlot = () => {
    if (!nuevoInicio || !nuevoFin) return;
    const nuevoSlot = `${nuevoInicio} - ${nuevoFin}`;
    if (!slotsBorrador.includes(nuevoSlot)) {
      setSlotsBorrador(ordenarBloquesHorarios([...slotsBorrador, nuevoSlot]));
    }
  };

  const handleGuardarHorarios = async () => {
    const validos = ordenarBloquesHorarios(slotsBorrador.map((s) => s.trim()).filter(Boolean));
    if (validos.length === 0) return;
    await actualizarSlotsFecha(fecha, validos);
    setModoEdicionHorario(false);
  };

  const handleRestablecerEstandar = async () => {
    await restablecerSlotsFecha(fecha);
    setSlotsBorrador(ordenarBloquesHorarios([...TIME_SLOTS]));
    setModoEdicionHorario(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
      {/* Header del Panel */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-unt-blue">
              Auditorio de Ingeniería Industrial
            </span>
            {esHabilitado ? (
              <Badge variant="success" size="sm">
                Día Habilitado
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                Día Inhabilitado
              </Badge>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900 capitalize mt-0.5">
            {parsearFechaLegible(fecha)}
          </h3>
          <p className="text-xs text-slate-500 font-mono">{fecha}</p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Contenido del Panel */}
      <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-6">
        
        {/* BOTÓN RÁPIDO PARA SECRETARÍA (1 CLIC SIN FORMULARIOS NI MOTIVOS) */}
        {modoAdmin && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Estado del Día en el Sistema
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                esHabilitado ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {esHabilitado ? 'Habilitado para reservas' : 'Inhabilitado'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleEstadoDia}
              className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs ${
                esHabilitado
                  ? 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {esHabilitado ? (
                <>
                  <Ban className="w-4 h-4 text-rose-500" />
                  <span>Inhabilitar este día</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Habilitar este día</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Notificación si el día está inhabilitado para el tesista */}
        {!modoAdmin && !esHabilitado && (
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center space-y-2">
            <Ban className="w-6 h-6 text-slate-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700">Día no habilitado para atención</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Secretaría Académica no ha habilitado este día para sustentaciones. Por favor, selecciona una fecha en verde.
            </p>
          </div>
        )}

        {/* Si está habilitado (o si es secretaría): mostrar los bloques horarios o editor */}
        {(esHabilitado || modoAdmin) && (
          <>
            {/* PANEL DE EDICIÓN DE HORARIOS PARA SECRETARÍA */}
            {modoAdmin && modoEdicionHorario ? (
              <div className="p-4 rounded-xl border border-unt-blue/30 bg-blue-50/20 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Settings2 className="w-4 h-4 text-unt-blue" />
                      Modificar Horarios de Sustentación
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Ajusta los bloques horarios para esta jornada ({fecha})
                    </p>
                  </div>
                  {esHorarioPersonalizado && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                      Personalizado
                    </span>
                  )}
                </div>

                {/* Lista de bloques en edición */}
                <div className="space-y-2">
                  {slotsBorrador.map((slot, idx) => {
                    const reserva = reservasDelDia.find((r) => r.horario === slot);
                    const tieneReserva = !!reserva;

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs"
                      >
                        <span className="text-xs font-mono font-bold text-slate-400 w-5">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={slot}
                          onChange={(e) => handleUpdateSlotItem(idx, e.target.value)}
                          placeholder="Ej. 08:00 - 10:00"
                          className="flex-1 text-xs font-mono font-semibold text-slate-800 border border-slate-200 rounded px-2.5 py-1.5 focus:border-unt-blue focus:outline-hidden"
                        />
                        {tieneReserva ? (
                          <span
                            className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded font-semibold whitespace-nowrap"
                            title={`Reserva de ${reserva?.tesistaNombre}`}
                          >
                            Con reserva
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEliminarSlotItem(idx)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Eliminar este bloque"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Añadir nuevo bloque horario */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700">Añadir nuevo bloque:</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={nuevoInicio}
                      onChange={(e) => setNuevoInicio(e.target.value)}
                      className="text-xs border border-slate-200 rounded p-1.5 bg-slate-50 font-mono"
                    />
                    <span className="text-xs text-slate-400">a</span>
                    <input
                      type="time"
                      value={nuevoFin}
                      onChange={(e) => setNuevoFin(e.target.value)}
                      className="text-xs border border-slate-200 rounded p-1.5 bg-slate-50 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAgregarNuevoSlot}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Añadir
                    </button>
                  </div>
                </div>

                {/* Botones de acción del editor */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleRestablecerEstandar}
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" /> Restaurar 4 bloques estándar
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModoEdicionHorario(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleGuardarHorarios}
                      className="px-4 py-1.5 bg-unt-blue hover:bg-unt-blue-light text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" /> Guardar Horarios
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-unt-blue" /> Bloques Horarios
                    </h4>
                    {esHorarioPersonalizado && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium inline-block mt-0.5">
                        Horario adaptado ({slotsDelDia.length} bloques)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {modoAdmin && (
                      <button
                        type="button"
                        onClick={handleIniciarEdicion}
                        className="px-2.5 py-1 text-xs font-semibold text-unt-blue bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modificar Horarios</span>
                      </button>
                    )}
                    {!modoAdmin && (
                      <span className="text-[11px] text-slate-400">{slotsDelDia.length} bloques por jornada</span>
                    )}
                  </div>
                </div>

                {!modoAdmin && !puedeReservar && esHabilitado && (
                  <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block leading-tight">
                        Reserva bloqueada ({reqsSubidos}/5 requisitos subidos)
                      </span>
                      <span className="text-[11px] text-amber-800">
                        Para reservar un turno, primero debe adjuntar sus 5 documentos obligatorios en Gestión Documentaria.
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  {slotsDelDia.map((slot) => {
                    const reserva = reservasDelDia.find((r) => r.horario === slot && r.estado !== 'rechazada');
                    const ocupado = !!reserva;
                    const seleccionado = horarioSeleccionado === slot;

                    let badgeVariant: 'success' | 'warning' | 'danger' = 'success';
                    let estadoTexto = 'Disponible';

                    if (reserva) {
                      if (reserva.estado === 'confirmada') {
                        badgeVariant = 'danger';
                        estadoTexto = 'Ocupado / Confirmado';
                      } else {
                        badgeVariant = 'warning';
                        estadoTexto = 'Pre-reserva Pendiente';
                      }
                    }

                    // Cotejo del expediente del tesista para el horario ocupado
                    let docsTesista = reserva
                      ? documentos.filter(
                          (d) => d.tesistaId === reserva.tesistaId || d.tesistaCodigo === reserva.codigoMatricula
                        )
                      : [];
                    const reqsAprobados = docsTesista.filter((d) => d.estado === 'Aprobado').length;
                    const reqsObservados = docsTesista.filter((d) => d.estado === 'Observado');
                    const expedienteConforme = reqsAprobados === 5;

                    return (
                      <div
                        key={slot}
                        onClick={() => {
                          if (!ocupado && !modoAdmin && esHabilitado && puedeReservar) {
                            setHorarioSeleccionado(slot);
                          }
                        }}
                        className={`p-3.5 rounded-xl border transition-all text-xs ${
                          seleccionado
                            ? 'border-unt-blue bg-blue-50/70 ring-1 ring-unt-blue shadow-2xs'
                            : ocupado
                            ? 'border-slate-200 bg-slate-50 opacity-95'
                            : !esHabilitado
                            ? 'border-slate-200 bg-slate-50/50'
                            : !puedeReservar && !modoAdmin
                            ? 'border-slate-200 bg-slate-50 opacity-80 cursor-not-allowed'
                            : 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-800 text-sm">
                            {slot}
                          </span>
                          <Badge variant={badgeVariant} size="sm">
                            {estadoTexto}
                          </Badge>
                        </div>

                        {/* Detalles si ya está reservado: Se prioriza el nombre del tesista */}
                        {reserva && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
                            <div>
                              <div className="font-bold text-unt-blue text-xs flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-unt-blue shrink-0" />
                                  <span>{reserva.tesistaNombre}</span>
                                </div>
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Mat: {reserva.codigoMatricula}
                                </span>
                              </div>
                              <div className="text-slate-600 text-[11px] italic line-clamp-1 mt-0.5">
                                "{reserva.tituloTesis}"
                              </div>
                            </div>

                            {/* Validación de Expediente: Conforme (5/5) vs Observado con Enlace Directo a Revisión */}
                            {expedienteConforme ? (
                              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>✓ Expediente 100% Conforme (5/5 Requisitos Aprobados) · Apto para Sustentar</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClose();
                                  if (onIrARevision) {
                                    onIrARevision(reserva.tesistaId);
                                  }
                                }}
                                className="w-full p-2 rounded-lg bg-amber-50 hover:bg-amber-100/90 border border-amber-300 text-amber-900 flex items-center justify-between text-left transition-colors cursor-pointer group shadow-2xs"
                                title="Clic para cotejar y dictaminar el expediente completo de este graduando"
                              >
                                <div className="flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span className="font-bold text-xs text-amber-900">
                                    ⚠️ Falta subsanar ({reqsAprobados}/5 requisitos aprobados)
                                  </span>
                                </div>
                                <span className="text-[11px] font-bold text-unt-blue underline flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                                  Revisar expediente →
                                </span>
                              </button>
                            )}

                            {/* Control para que Secretaría modifique o revierta el estado por error humano */}
                            {modoAdmin && (
                              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  Corrección de Estado:
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {reserva.estado === 'confirmada' ? (
                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await cambiarEstadoReserva(reserva.id, 'pre-reserva');
                                      }}
                                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                      title="Revertir a Pre-reserva por error o falta de regularización"
                                    >
                                      <RotateCcw className="w-3 h-3" /> Revertir a Pre-reserva
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await cambiarEstadoReserva(reserva.id, 'confirmada');
                                      }}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                      title="Confirmar sustentación de forma oficial"
                                    >
                                      <CheckCircle2 className="w-3 h-3" /> Confirmar Sustentación
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (confirm(`¿Liberar este bloque horario y cancelar la reserva de ${reserva.tesistaNombre}?`)) {
                                        await liberarReserva(reserva.id);
                                      }
                                    }}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                    title="Liberar el bloque de inmediato"
                                  >
                                    <Trash2 className="w-3 h-3" /> Liberar Horario
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {!ocupado && !seleccionado && !modoAdmin && esHabilitado && (
                          <div className="mt-2 text-right">
                            <span className="text-[11px] text-unt-blue font-semibold hover:underline">
                              + Seleccionar este bloque
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Formulario de Reserva para Tesista */}
            {horarioSeleccionado && !modoAdmin && esHabilitado && (
              <form
                onSubmit={handleSubmitPreReserva}
                className="p-4 rounded-xl bg-white border border-unt-blue/30 shadow-xs space-y-3.5 animate-in fade-in"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-unt-blue font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Confirmar Solicitud de Bloque</span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-blue-100 text-unt-blue px-2 py-0.5 rounded">
                    {horarioSeleccionado}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Código de Matrícula
                    </label>
                    <input
                      type="text"
                      required
                      value={codigoMatricula}
                      onChange={(e) => setCodigoMatricula(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-slate-600 font-semibold mb-1">
                    Título Definitivo del Proyecto de Tesis
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={tituloTesis}
                    onChange={(e) => setTituloTesis(e.target.value)}
                    placeholder="Ej. Optimización de la cadena logística de frío para exportación..."
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="text-xs">
                  <label className="block text-slate-600 font-semibold mb-1">
                    Docente Asesor de Tesis (Búsqueda Predictiva)
                  </label>
                  <PredictiveAdvisorInput
                    value={asesor}
                    onChange={setAsesor}
                    placeholder="Escriba nombre o apellido del asesor (ej. Hermes, Sifuentes, Ana...)"
                    required
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-snug">
                  <strong>Nota importante:</strong> Esta acción generará una{' '}
                  <span className="font-semibold underline">Pre-reserva</span> inmediata en el auditorio. La confirmación definitiva está supeditada a que su expediente documentario (5/5 requisitos) haya sido aprobado por Secretaría.
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setHorarioSeleccionado(null)}
                    className="w-1/3 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviando}
                    className="flex-1 py-2 bg-unt-blue hover:bg-unt-blue-light text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {enviando ? 'Guardando...' : 'Confirmar Pre-reserva'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};