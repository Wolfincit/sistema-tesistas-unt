import {
  SeguimientoTesisItem,
  IngenieroJuradoItem,
  SustentacionJuevesItem,
  DespachoChatAnuncioItem,
  InstruccionPasoItem,
  DudaTesistaPendiente,
  ConfigColacion,
  ESTACIONES_LOGISTICAS,
  INITIAL_SEGUIMIENTO_LOGISTICO,
  INITIAL_DIRECTORIO_JURADO,
  INITIAL_SUSTENTACIONES_JUEVES,
  INITIAL_HISTORIAL_DESPACHOS,
  INITIAL_INSTRUCCIONES_PASOS
} from '../data/mockLogisticaSecretaria';
import { storageService } from './storageService';
import { driveApiService } from './driveApiService';
import { pushClientService } from './pushClientService';

export const SEGUIMIENTO_KEY = 'unt_industrial_seguimiento_logistico_v3';
export const JURADO_KEY = 'unt_industrial_directorio_jurado_v3';
export const SUSTENTACIONES_JUEVES_KEY = 'unt_industrial_sustentaciones_jueves_v2';
export const HISTORIAL_DESPACHOS_KEY = 'unt_industrial_historial_despachos_v1';
export const INSTRUCCIONES_PASOS_KEY = 'unt_industrial_instrucciones_pasos_v3';
export const TITULO_SUSTENTACIONES_KEY = 'unt_industrial_titulo_sustentaciones_v1';
export const DUDAS_PENDIENTES_KEY = 'unt_industrial_dudas_pendientes_v1';
export const CONFIG_COLACION_KEY = 'unt_industrial_config_colacion_v1';

const DEFAULT_CONFIG_COLACION: ConfigColacion = {
  nombreColacion: 'Colación Ordinaria — Ing. Industrial UNT',
  fechaLimiteCarpeta: '2026-12-15',
  fechaCeremonia: '2027-01-20'
};

export interface EmailConfigStatus {
  configured: boolean;
  serverTransportReady?: boolean;
  mode?: 'google-oauth' | 'cloud-https' | 'smtp' | 'unitru-prelinked';
  oauthConfigured?: boolean;
  oauthConnected?: boolean;
  oauthEmail?: string;
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

  getDudasPendientes(): DudaTesistaPendiente[] {
    return storageService.get<DudaTesistaPendiente[]>(DUDAS_PENDIENTES_KEY, []);
  },

  async saveDudasPendientes(items: DudaTesistaPendiente[]): Promise<void> {
    storageService.set(DUDAS_PENDIENTES_KEY, items);
    await driveApiService.saveCollection('dudasSinResponder', items);
  },

  async registrarDudaTesista(params: {
    codigoMatricula?: string;
    tesistaNombre?: string;
    pregunta: string;
    categoriaSugerida?: string;
  }): Promise<DudaTesistaPendiente> {
    const actuales = this.getDudasPendientes();
    const nueva: DudaTesistaPendiente = {
      id: `duda-${Date.now()}`,
      codigoMatricula: params.codigoMatricula?.replace(/\D/g, '').slice(0, 10) || undefined,
      tesistaNombre: params.tesistaNombre?.trim() || undefined,
      pregunta: params.pregunta.trim(),
      categoriaSugerida: params.categoriaSugerida?.trim() || 'Trámite',
      fechaHora: new Date().toLocaleString('es-PE', { hour12: false }),
      estado: 'pendiente'
    };
    await this.saveDudasPendientes([nueva, ...actuales]);
    pushClientService.notifySecretaria({
      title: '💬 Nueva duda de tesista sin respuesta oficial',
      body: nueva.pregunta.slice(0, 110),
      url: '/',
      tag: nueva.id
    });
    return nueva;
  },

  getConfigColacion(): ConfigColacion {
    return storageService.get<ConfigColacion>(CONFIG_COLACION_KEY, DEFAULT_CONFIG_COLACION);
  },

  async saveConfigColacion(cfg: ConfigColacion): Promise<void> {
    storageService.set(CONFIG_COLACION_KEY, cfg);
    await driveApiService.saveCollection('configColacion', cfg);
  },

  async notificarCambioEtapaAutomatico(item: SeguimientoTesisItem): Promise<number> {
    const estMeta = ESTACIONES_LOGISTICAS.find((e) => e.id === item.estacionActual);
    const nombreEtapa = estMeta ? estMeta.nombre : `Etapa ${item.estacionActual}`;
    const tituloCorto = item.tituloTesis.length > 72 ? `${item.tituloTesis.slice(0, 69)}...` : item.tituloTesis;
    const prefijo =
      item.semaforo === 'incidencia'
        ? '⚠️ Atención en tu tesis'
        : item.estacionActual === 4
        ? '🎓 ¡Tu tesis ya está lista para sustentar!'
        : item.estacionActual === 8
        ? '🎉 ¡Tu expediente está listo para Colación!'
        : `🎓 ¡Tu tesis avanzó a ${nombreEtapa}!`;

    const cuerpo =
      item.semaforo === 'incidencia' && item.notasSecretaria
        ? `${item.notasSecretaria} · "${tituloCorto}"`
        : `${estMeta?.descripcion || 'Revisa tu siguiente paso oficial en el sistema.'} · "${tituloCorto}"`;

    const res = await pushClientService.notifyThesisUpdate({
      codigoMatricula: item.codigoMatricula,
      title: prefijo,
      body: cuerpo.slice(0, 220),
      url: '/',
      tag: `tesis-${item.codigoMatricula}-est-${item.estacionActual}`,
      tipo: item.semaforo === 'incidencia' ? 'observacion' : 'estado',
      urgente: true
    });
    return res.pushedCount;
  },

  async getEmailStatus(): Promise<EmailConfigStatus> {
    try {
      const res = await fetch('/api/correo/status');
      if (!res.ok) throw new Error('Error');
      return await res.json();
    } catch {
      return {
        configured: true,
        serverTransportReady: false,
        mode: 'unitru-prelinked',
        senderEmail: 'cchau@unitru.edu.pe',
        senderName: 'Srta. Celia — Secretaría Académica Ing. Industrial UNT',
        smtpHost: 'smtp.gmail.com'
      };
    }
  },

  async getMailOAuthUrl(): Promise<{ authUrl: string; redirectUri: string }> {
    const res = await fetch('/api/correo/oauth-url');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falta activar GOOGLE_CLIENT_ID en el servidor.');
    return data;
  },

  async disconnectMailOAuth(): Promise<EmailConfigStatus> {
    const res = await fetch('/api/correo/oauth-disconnect', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo desconectar la cuenta.');
    return data;
  },

  async saveEmailConfig(params: {
    senderEmail: string;
    senderName: string;
    appPassword?: string;
    appsScriptUrl?: string;
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
    mode: 'smtp-direct' | 'registro-interno';
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
