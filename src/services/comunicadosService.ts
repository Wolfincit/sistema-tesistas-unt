import { ComunicadoGeneral } from '../types';
import { storageService } from './storageService';

const COMUNICADOS_KEY = 'unt_industrial_comunicados_generales';

// Comunicados iniciales vacíos: Secretaría emite las circulares oficiales con nota de voz
export const INITIAL_COMUNICADOS: ComunicadoGeneral[] = [];

export const comunicadosService = {
  async getComunicados(): Promise<ComunicadoGeneral[]> {
    return storageService.get<ComunicadoGeneral[]>(COMUNICADOS_KEY, INITIAL_COMUNICADOS);
  },

  async saveComunicados(comunicados: ComunicadoGeneral[]): Promise<void> {
    storageService.set(COMUNICADOS_KEY, comunicados);
  },

  async emitirComunicado(datos: {
    titulo: string;
    mensaje: string;
    audioUrl?: string;
    audioDuracion?: string;
    autor: string;
  }): Promise<ComunicadoGeneral> {
    const actuales = await this.getComunicados();
    const now = new Date();
    const fechaHora = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const nuevo: ComunicadoGeneral = {
      id: `com-${Date.now()}`,
      titulo: datos.titulo.trim(),
      mensaje: datos.mensaje.trim(),
      audioUrl: datos.audioUrl,
      audioDuracion: datos.audioDuracion || '0:25',
      fecha: fechaHora,
      autor: datos.autor,
      leido: false,
      leidoPor: []
    };

    const actualizados = [nuevo, ...actuales];
    await this.saveComunicados(actualizados);
    return nuevo;
  },

  async marcarLeido(id: string, usuarioId?: string): Promise<void> {
    const actuales = await this.getComunicados();
    const actualizados = actuales.map((c) => {
      if (c.id !== id) return c;
      if (usuarioId) {
        const previos = c.leidoPor || [];
        const leidoPor = previos.includes(usuarioId) ? previos : [...previos, usuarioId];
        return { ...c, leidoPor };
      }
      return { ...c, leido: true };
    });
    await this.saveComunicados(actualizados);
  },

  async eliminarComunicado(id: string): Promise<void> {
    const actuales = await this.getComunicados();
    const objetivo = actuales.find((c) => c.id === id);
    if (objetivo?.audioUrl?.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(objetivo.audioUrl);
      } catch (_) {}
    }
    const actualizados = actuales.filter((c) => c.id !== id);
    await this.saveComunicados(actualizados);
  }
};
