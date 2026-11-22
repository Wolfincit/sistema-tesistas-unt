import {
  SeguimientoTesisItem,
  IngenieroJuradoItem,
  SustentacionJuevesItem,
  DespachoChatAnuncioItem,
  INITIAL_SEGUIMIENTO_LOGISTICO,
  INITIAL_DIRECTORIO_JURADO,
  INITIAL_SUSTENTACIONES_JUEVES,
  INITIAL_HISTORIAL_DESPACHOS
} from '../data/mockLogisticaSecretaria';
import { storageService } from './storageService';
import { driveApiService } from './driveApiService';

const SEGUIMIENTO_KEY = 'unt_industrial_seguimiento_logistico_v1';
const JURADO_KEY = 'unt_industrial_directorio_jurado_v1';
const SUSTENTACIONES_JUEVES_KEY = 'unt_industrial_sustentaciones_jueves_v1';
const HISTORIAL_DESPACHOS_KEY = 'unt_industrial_historial_despachos_v1';

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
