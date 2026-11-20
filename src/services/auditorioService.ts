import { ReservaAuditorio, BloqueoFecha, TimeSlot } from '../types';
import { INITIAL_RESERVAS, INITIAL_BLOQUEOS, INITIAL_FECHAS_HABILITADAS, TIME_SLOTS, formatDateISO } from '../data/mockAuditorio';
import { storageService } from './storageService';
import { driveApiService } from './driveApiService';

const RESERVAS_KEY = 'unt_industrial_reservas';
const BLOQUEOS_KEY = 'unt_industrial_bloqueos';
const FECHAS_HABILITADAS_KEY = 'unt_industrial_fechas_habilitadas';
const SLOTS_BY_DATE_KEY = 'unt_industrial_slots_by_date';
const SLOTS_DEFAULT_KEY = 'unt_industrial_slots_default';

export const auditorioService = {
  async getReservas(): Promise<ReservaAuditorio[]> {
    return storageService.get<ReservaAuditorio[]>(RESERVAS_KEY, INITIAL_RESERVAS);
  },

  async saveReservas(reservas: ReservaAuditorio[]): Promise<void> {
    storageService.set(RESERVAS_KEY, reservas);
    await driveApiService.saveCollection('reservas', reservas);
  },

  async getBloqueos(): Promise<BloqueoFecha[]> {
    return storageService.get<BloqueoFecha[]>(BLOQUEOS_KEY, INITIAL_BLOQUEOS);
  },

  async saveBloqueos(bloqueos: BloqueoFecha[]): Promise<void> {
    storageService.set(BLOQUEOS_KEY, bloqueos);
    await driveApiService.saveCollection('bloqueos', bloqueos);
  },

  // Gestión de días habilitados por Secretaría (por defecto todo inhabilitado)
  async getFechasHabilitadas(): Promise<string[]> {
    return storageService.get<string[]>(FECHAS_HABILITADAS_KEY, INITIAL_FECHAS_HABILITADAS);
  },

  async saveFechasHabilitadas(fechas: string[]): Promise<void> {
    storageService.set(FECHAS_HABILITADAS_KEY, fechas);
    await driveApiService.saveCollection('fechasHabilitadas', fechas);
  },

  // Utilidad para ordenar bloques horarios cronológicamente según la hora de inicio
  ordenarBloquesHorarios(bloques: string[]): string[] {
    return [...bloques].sort((a, b) => {
      const extraerMinutos = (slot: string) => {
        const match = slot.trim().match(/^(\d{1,2}):(\d{2})/);
        if (!match) return 9999;
        return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      };
      return extraerMinutos(a) - extraerMinutos(b);
    });
  },

  // Gestión de bloques horarios modificables por Secretaría
  async getSlotsByDate(): Promise<Record<string, string[]>> {
    return storageService.get<Record<string, string[]>>(SLOTS_BY_DATE_KEY, {});
  },

  async getDefaultSlots(): Promise<string[]> {
    const slots = storageService.get<string[]>(SLOTS_DEFAULT_KEY, [...TIME_SLOTS]);
    return this.ordenarBloquesHorarios(slots);
  },

  async saveDefaultSlots(slots: string[]): Promise<string[]> {
    const ordenados = this.ordenarBloquesHorarios(slots);
    storageService.set(SLOTS_DEFAULT_KEY, ordenados);
    await driveApiService.saveCollection('defaultSlots', ordenados);
    return ordenados;
  },

  async saveSlotsForFecha(fecha: string, slots: string[]): Promise<Record<string, string[]>> {
    const mapa = await this.getSlotsByDate();
    mapa[fecha] = this.ordenarBloquesHorarios(slots);
    storageService.set(SLOTS_BY_DATE_KEY, mapa);
    await driveApiService.saveCollection('slotsPorFecha', mapa);
    return mapa;
  },

  async resetSlotsForFecha(fecha: string): Promise<Record<string, string[]>> {
    const mapa = await this.getSlotsByDate();
    delete mapa[fecha];
    storageService.set(SLOTS_BY_DATE_KEY, mapa);
    await driveApiService.saveCollection('slotsPorFecha', mapa);
    return mapa;
  },

  async getSlotsForFecha(fecha: string): Promise<string[]> {
    const mapa = await this.getSlotsByDate();
    if (mapa[fecha] && mapa[fecha].length > 0) {
      return this.ordenarBloquesHorarios(mapa[fecha]);
    }
    const def = await this.getDefaultSlots();
    return this.ordenarBloquesHorarios(def && def.length > 0 ? def : [...TIME_SLOTS]);
  },

  async toggleHabilitarFecha(fecha: string): Promise<boolean> {
    const fechas = await this.getFechasHabilitadas();
    const idx = fechas.indexOf(fecha);
    let nuevoEstadoHabilitado = false;
    if (idx >= 0) {
      fechas.splice(idx, 1);
      nuevoEstadoHabilitado = false;
    } else {
      fechas.push(fecha);
      nuevoEstadoHabilitado = true;
    }
    await this.saveFechasHabilitadas(fechas);
    return nuevoEstadoHabilitado;
  },

  async habilitarTodosMes(year: number, month: number): Promise<string[]> {
    const ultimoDia = new Date(year, month + 1, 0).getDate();
    const fechasMes: string[] = [];
    for (let d = 1; d <= ultimoDia; d++) {
      const fechaObj = new Date(year, month, d);
      // Incluir días laborables (excluyendo domingo)
      if (fechaObj.getDay() !== 0) {
        fechasMes.push(formatDateISO(fechaObj));
      }
    }
    const actuales = await this.getFechasHabilitadas();
    const combinadas = Array.from(new Set([...actuales, ...fechasMes]));
    await this.saveFechasHabilitadas(combinadas);
    return combinadas;
  },

  async inhabilitarTodosMes(year: number, month: number): Promise<string[]> {
    const ultimoDia = new Date(year, month + 1, 0).getDate();
    const fechasMesSet = new Set<string>();
    for (let d = 1; d <= ultimoDia; d++) {
      fechasMesSet.add(formatDateISO(new Date(year, month, d)));
    }
    const actuales = await this.getFechasHabilitadas();
    const filtradas = actuales.filter((f) => !fechasMesSet.has(f));
    await this.saveFechasHabilitadas(filtradas);
    return filtradas;
  },

  async getReservasByFecha(fecha: string): Promise<ReservaAuditorio[]> {
    const reservas = await this.getReservas();
    return reservas.filter((r) => r.fecha === fecha && r.estado !== 'rechazada');
  },

  async crearPreReserva(datos: {
    fecha: string;
    horario: TimeSlot;
    tesistaId: string;
    tesistaNombre: string;
    codigoMatricula: string;
    tituloTesis: string;
    asesor: string;
  }): Promise<ReservaAuditorio> {
    const reservas = await this.getReservas();

    // Validar si el horario ya está tomado en la fecha
    const ocupado = reservas.some(
      (r) =>
        r.fecha === datos.fecha &&
        r.horario === datos.horario &&
        r.estado !== 'rechazada'
    );

    if (ocupado) {
      throw new Error('El bloque horario seleccionado ya no se encuentra disponible.');
    }

    const nueva: ReservaAuditorio = {
      id: `res-${Date.now()}`,
      fecha: datos.fecha,
      horario: datos.horario,
      estado: 'pre-reserva',
      tesistaId: datos.tesistaId,
      tesistaNombre: datos.tesistaNombre,
      codigoMatricula: datos.codigoMatricula,
      tituloTesis: datos.tituloTesis,
      asesor: datos.asesor,
      fechaSolicitud: new Date().toISOString().split('T')[0]
    };

    const actualizadas = [nueva, ...reservas];
    await this.saveReservas(actualizadas);
    return nueva;
  },

  async cambiarEstadoReserva(
    id: string,
    nuevoEstado: 'confirmada' | 'rechazada' | 'pre-reserva',
    comentario?: string
  ): Promise<ReservaAuditorio> {
    const reservas = await this.getReservas();
    const idx = reservas.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new Error('Reserva no encontrada.');
    }

    const updated: ReservaAuditorio = {
      ...reservas[idx],
      estado: nuevoEstado,
      comentarioAdmin: comentario || reservas[idx].comentarioAdmin
    };

    reservas[idx] = updated;
    await this.saveReservas(reservas);
    return updated;
  },

  async editarReserva(
    id: string,
    datos: { tituloTesis: string; asesor: string }
  ): Promise<ReservaAuditorio> {
    const reservas = await this.getReservas();
    const idx = reservas.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new Error('Reserva no encontrada.');
    }
    const updated: ReservaAuditorio = {
      ...reservas[idx],
      tituloTesis: datos.tituloTesis.trim(),
      asesor: datos.asesor.trim()
    };
    reservas[idx] = updated;
    await this.saveReservas(reservas);
    return updated;
  },

  async liberarReserva(id: string): Promise<void> {
    const reservas = await this.getReservas();
    const filtradas = reservas.filter((r) => r.id !== id);
    await this.saveReservas(filtradas);
  },

  async toggleBloqueoFecha(
    fecha: string,
    motivo: string = 'Bloqueado por Secretaría',
    bloqueadoPor: string = 'Secretaría Académica'
  ): Promise<{ bloqueado: boolean; motivo?: string }> {
    const bloqueos = await this.getBloqueos();
    const existeIdx = bloqueos.findIndex((b) => b.fecha === fecha);

    if (existeIdx >= 0) {
      // Desbloquear
      bloqueos.splice(existeIdx, 1);
      await this.saveBloqueos(bloqueos);
      return { bloqueado: false };
    } else {
      // Bloquear
      const nuevoBloqueo: BloqueoFecha = {
        fecha,
        motivo,
        bloqueadoPor,
        fechaRegistro: new Date().toISOString().split('T')[0]
      };
      bloqueos.push(nuevoBloqueo);
      await this.saveBloqueos(bloqueos);
      return { bloqueado: true, motivo };
    }
  }
};
