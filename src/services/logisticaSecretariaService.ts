import {
  SeguimientoTesisItem,
  IngenieroJuradoItem,
  SustentacionJuevesItem,
  DespachoChatAnuncioItem,
  InstruccionPasoItem,
  INITIAL_SEGUIMIENTO_LOGISTICO,
  INITIAL_DIRECTORIO_JURADO,
  INITIAL_SUSTENTACIONES_JUEVES,
  INITIAL_HISTORIAL_DESPACHOS,
  INITIAL_INSTRUCCIONES_PASOS
} from '../data/mockLogisticaSecretaria';
import { storageService } from './storageService';
import { driveApiService } from './driveApiService';

const SEGUIMIENTO_KEY = 'unt_industrial_seguimiento_logistico_v2';
const JURADO_KEY = 'unt_industrial_directorio_jurado_v2';
const SUSTENTACIONES_JUEVES_KEY = 'unt_industrial_sustentaciones_jueves_v2';
const HISTORIAL_DESPACHOS_KEY = 'unt_industrial_historial_despachos_v1';
const INSTRUCCIONES_PASOS_KEY = 'unt_industrial_instrucciones_pasos_v1';
const TITULO_SUSTENTACIONES_KEY = 'unt_industrial_titulo_sustentaciones_v1';

export interface EmailConfigStatus {
  configured: boolean;
  senderEmail: string;
  senderName: string;
  smtpHost: string;
}

export const logisticaSecretariaService = {
  getSeguimientos(): SeguimientoTesisItem[] {
    return storageService.get<SeguimientoTesisItem[]>(SEGUIMIENTO_KEY, INITIAL_SEGUIMIENTO_LOGISTICO);
  },

  async saveSeguimientos(items: SeguimientoTesisItem[]): Promise<void> {
    storageService.set(SEGUIMIENTO_KEY, items);
    await driveApiService.saveCollection('seguimientoLogistico', items);
  },

  getDirectorioJurado(): IngenieroJuradoItem[] {
    return storageService.get<IngenieroJuradoItem[]>(JURADO_KEY, INITIAL_DIRECTORIO_JURADO);
  },

  async saveDirectorioJurado(items: IngenieroJuradoItem[]): Promise<void> {
    storageService.set(JURADO_KEY, items);
    await driveApiService.saveCollection('directorioJurado', items);
  },

  getSustentacionesJueves(): SustentacionJuevesItem[] {
    return storageService.get<SustentacionJuevesItem[]>(SUSTENTACIONES_JUEVES_KEY, INITIAL_SUSTENTACIONES_JUEVES);
  },

  async saveSustentacionesJueves(items: SustentacionJuevesItem[]): Promise<void> {
    storageService.set(SUSTENTACIONES_JUEVES_KEY, items);
    await driveApiService.saveCollection('sustentacionesJueves', items);
  },

  getHistorialDespachos(): DespachoChatAnuncioItem[] {
    return storageService.get<DespachoChatAnuncioItem[]>(HISTORIAL_DESPACHOS_KEY, INITIAL_HISTORIAL_DESPACHOS);
  },

  async saveHistorialDespachos(items: DespachoChatAnuncioItem[]): Promise<void> {
    storageService.set(HISTORIAL_DESPACHOS_KEY, items);
    await driveApiService.saveCollection('historialDespachos', items);
  },

  getInstruccionesPasos(): InstruccionPasoItem[] {
    return storageService.get<InstruccionPasoItem[]>(INSTRUCCIONES_PASOS_KEY, INITIAL_INSTRUCCIONES_PASOS);
  },

  async saveInstruccionesPasos(items: InstruccionPasoItem[]): Promise<void> {
    storageService.set(INSTRUCCIONES_PASOS_KEY, items);
    await driveApiService.saveCollection('instruccionesSustentacion', items);
  },

  getTituloSustentaciones(): { titulo: string; subtitulo: string; horario: string } {
    return storageService.get(TITULO_SUSTENTACIONES_KEY, {
      titulo: 'Sustentaciones Programadas',
      subtitulo: 'Fechas agendadas por Secretaría de Escuela',
      horario: 'Jueves de 11:00 a.m. a 1:00 p.m.'
    });
  },

  saveTituloSustentaciones(datos: { titulo: string; subtitulo: string; horario: string }): void {
    storageService.set(TITULO_SUSTENTACIONES_KEY, datos);
  },

  async getEmailStatus(): Promise<EmailConfigStatus> {
    try {
      const res = await fetch('/api/correo/status');
      if (!res.ok) throw new Error('Error');
      return await res.json();
    } catch {
      return {
        configured: false,
        senderEmail: '',
        senderName: 'Srta. Celia — Secretaría Académica Ing. Industrial UNT',
        smtpHost: 'smtp.gmail.com'
      };
    }
  },

  async saveEmailConfig(params: {
    senderEmail: string;
    senderName: string;
    appPassword?: string;
    smtpHost?: string;
  }): Promise<EmailConfigStatus> {
    const res = await fetch('/api/correo/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo guardar la configuración de correo.');
    return data;
  },

  async enviarDespachoCorreo(params: {
    asunto: string;
    mensaje: string;
    tesistasCorreos: string[];
    juradoCorreos: string[];
    flyerDataUrl?: string;
    flyerNombre?: string;
  }): Promise<{
    ok: boolean;
    mode: 'smtp-direct' | 'assisted-gmail';
    recipientsCount: number;
    recipients: string[];
    message: string;
  }> {
    const res = await fetch('/api/correo/enviar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo procesar el envío.');
    return data;
  }
};
