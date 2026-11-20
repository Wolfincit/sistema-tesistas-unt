import { ConsultaTesista } from '../types';
import { INITIAL_CONSULTAS } from '../data/mockConsultas';
import { storageService } from './storageService';

const CONSULTAS_KEY = 'unt_industrial_consultas';

export const consultasService = {
  async getConsultas(): Promise<ConsultaTesista[]> {
    return storageService.get<ConsultaTesista[]>(CONSULTAS_KEY, INITIAL_CONSULTAS);
  },

  async saveConsultas(consultas: ConsultaTesista[]): Promise<void> {
    storageService.set(CONSULTAS_KEY, consultas);
  },

  async crearConsulta(datos: {
    tesistaId: string;
    tesistaNombre: string;
    tesistaCodigo: string;
    asunto: string;
    mensaje: string;
  }): Promise<ConsultaTesista> {
    const consultas = await this.getConsultas();
    const now = new Date();
    const fechaHora = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const nueva: ConsultaTesista = {
      id: `c-${Date.now()}`,
      tesistaId: datos.tesistaId,
      tesistaNombre: datos.tesistaNombre,
      tesistaCodigo: datos.tesistaCodigo,
      asunto: datos.asunto,
      mensaje: datos.mensaje,
      fechaEnvio: fechaHora,
      estado: 'Pendiente'
    };

    const actualizadas = [nueva, ...consultas];
    await this.saveConsultas(actualizadas);
    return nueva;
  },

  async responderConsulta(params: {
    id: string;
    respuestaTexto?: string;
    respuestaAudioDuracion?: string;
    respuestaAudioUrl?: string;
    respondidoPor: string;
  }): Promise<ConsultaTesista> {
    const consultas = await this.getConsultas();
    const idx = consultas.findIndex((c) => c.id === params.id);
    if (idx === -1) {
      throw new Error('Consulta no encontrada');
    }

    const now = new Date();
    const fechaHora = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const mensajes = [...(consultas[idx].mensajesSeguimiento || [])];
    if (params.respuestaTexto || params.respuestaAudioDuracion) {
      mensajes.push({
        id: `seg-sec-${Date.now()}`,
        remitente: 'secretaria',
        autor: params.respondidoPor,
        fecha: fechaHora,
        mensajeTexto: params.respuestaTexto || 'Nota de voz explicativa adjunta.',
        audioUrl: params.respuestaAudioUrl,
        audioDuracion: params.respuestaAudioDuracion
      });
    }

    const updated: ConsultaTesista = {
      ...consultas[idx],
      estado: 'Resuelta',
      conformidadTesista: 'pendiente_confirmacion',
      respuestaTexto: params.respuestaTexto || consultas[idx].respuestaTexto,
      respuestaAudioUrl: params.respuestaAudioUrl || (params.respuestaAudioDuracion ? `audio-${Date.now()}.mp3` : consultas[idx].respuestaAudioUrl),
      respuestaAudioDuracion: params.respuestaAudioDuracion || consultas[idx].respuestaAudioDuracion,
      fechaRespuesta: fechaHora,
      respondidoPor: params.respondidoPor,
      mensajesSeguimiento: mensajes
    };

    consultas[idx] = updated;
    await this.saveConsultas(consultas);
    return updated;
  },

  async evaluarResolucion(params: {
    id: string;
    conforme: boolean;
    repreguntaTexto?: string;
  }): Promise<ConsultaTesista> {
    const consultas = await this.getConsultas();
    const idx = consultas.findIndex((c) => c.id === params.id);
    if (idx === -1) {
      throw new Error('Consulta no encontrada');
    }

    const consulta = consultas[idx];
    const now = new Date();
    const fechaHora = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const intentosActuales = consulta.intentosReapertura || 0;

    let nuevoEstado: 'Resuelta' | 'Reabierta' | 'Cerrada' = 'Resuelta';
    let nuevaConformidad: 'conforme' | 'no_conforme' = 'conforme';
    let nuevosIntentos = intentosActuales;
    const mensajes = [...(consulta.mensajesSeguimiento || [])];

    if (params.conforme) {
      nuevoEstado = 'Resuelta';
      nuevaConformidad = 'conforme';
    } else {
      nuevaConformidad = 'no_conforme';
      nuevosIntentos = intentosActuales + 1;

      if (params.repreguntaTexto) {
        mensajes.push({
          id: `seg-tes-${Date.now()}`,
          remitente: 'tesista',
          autor: consulta.tesistaNombre,
          fecha: fechaHora,
          mensajeTexto: params.repreguntaTexto
        });
      }

      if (nuevosIntentos >= 2) {
        nuevoEstado = 'Cerrada';
      } else {
        nuevoEstado = 'Reabierta';
      }
    }

    const updated: ConsultaTesista = {
      ...consulta,
      estado: nuevoEstado,
      conformidadTesista: nuevaConformidad,
      intentosReapertura: nuevosIntentos,
      repreguntaTexto: params.repreguntaTexto || consulta.repreguntaTexto,
      fechaRepregunta: params.repreguntaTexto ? fechaHora : consulta.fechaRepregunta,
      mensajesSeguimiento: mensajes
    };

    consultas[idx] = updated;
    await this.saveConsultas(consultas);
    return updated;
  },

  async eliminarConsulta(id: string): Promise<void> {
    const consultas = await this.getConsultas();
    const filtradas = consultas.filter((c) => c.id !== id);
    await this.saveConsultas(filtradas);
  }
};
