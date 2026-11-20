import { ReservaAuditorio, BloqueoFecha, TimeSlot } from '../types';

export const TIME_SLOTS: TimeSlot[] = [
  '08:00 - 10:00',
  '10:30 - 12:30',
  '15:00 - 17:00',
  '17:30 - 19:30'
];

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Sistema limpio listo para producción:
// Secretaría habilita las fechas oficiales de sustentación y los tesistas reservan conforme cumplan 5/5 requisitos.
export const INITIAL_FECHAS_HABILITADAS: string[] = [];
export const INITIAL_BLOQUEOS: BloqueoFecha[] = [];
export const INITIAL_RESERVAS: ReservaAuditorio[] = [];
