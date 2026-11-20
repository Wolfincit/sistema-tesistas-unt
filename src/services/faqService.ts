import { FaqItem } from '../types';
import { storageService } from './storageService';

const FAQ_STORAGE_KEY = 'unt_industrial_faqs_v1';

const INITIAL_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    pregunta: '¿Qué necesito para habilitar la reserva del auditorio?',
    respuesta: 'Debes subir primero tus 5 documentos obligatorios en la pestaña Gestión Documentaria. Una vez cargados los 5 archivos, el calendario de reservas se habilita automáticamente.',
    categoria: 'Auditorio',
    fechaActualizacion: '2026-11-19'
  },
  {
    id: 'faq-2',
    pregunta: '¿Cuál es el porcentaje máximo de similitud permitido en Turnitin?',
    respuesta: 'El reporte oficial de Turnitin debe registrar un porcentaje de similitud menor al 20% y contar con la firma de conformidad de tu docente asesor.',
    categoria: 'Requisitos',
    fechaActualizacion: '2026-11-19'
  },
  {
    id: 'faq-3',
    pregunta: '¿Qué ocurre con mi reserva si Secretaría observa uno de mis documentos?',
    respuesta: 'Si alguno de tus 5 documentos es observado, el turno pre-reservado se libera hasta que subsanes el documento observado y vuelvas a contar con los 5 requisitos en regla.',
    categoria: 'Expediente',
    fechaActualizacion: '2026-11-19'
  },
  {
    id: 'faq-4',
    pregunta: '¿Dónde descargo las plantillas oficiales (FUT y declaraciones)?',
    respuesta: 'En la pestaña Gestión Documentaria encontrarás en la parte superior todos los formatos oficiales subidos por Secretaría listos para descargar.',
    categoria: 'Formatos',
    fechaActualizacion: '2026-11-19'
  }
];

export const faqService = {
  async getFaqs(): Promise<FaqItem[]> {
    return storageService.get<FaqItem[]>(FAQ_STORAGE_KEY, INITIAL_FAQS);
  },

  async agregarFaq(datos: { pregunta: string; respuesta: string; categoria?: string }): Promise<FaqItem> {
    const lista = await this.getFaqs();
    const nueva: FaqItem = {
      id: `faq-${Date.now()}`,
      pregunta: datos.pregunta.trim(),
      respuesta: datos.respuesta.trim(),
      categoria: datos.categoria?.trim() || 'General',
      fechaActualizacion: new Date().toISOString().slice(0, 10)
    };
    const actualizada = [nueva, ...lista];
    storageService.set(FAQ_STORAGE_KEY, actualizada);
    return nueva;
  },

  async editarFaq(id: string, datos: { pregunta: string; respuesta: string; categoria?: string }): Promise<FaqItem> {
    const lista = await this.getFaqs();
    let editada: FaqItem | null = null;
    const actualizada = lista.map((item) => {
      if (item.id === id) {
        editada = {
          ...item,
          pregunta: datos.pregunta.trim(),
          respuesta: datos.respuesta.trim(),
          categoria: datos.categoria?.trim() || item.categoria || 'General',
          fechaActualizacion: new Date().toISOString().slice(0, 10)
        };
        return editada;
      }
      return item;
    });
    if (!editada) throw new Error('Pregunta frecuente no encontrada');
    storageService.set(FAQ_STORAGE_KEY, actualizada);
    return editada;
  },

  async eliminarFaq(id: string): Promise<void> {
    const lista = await this.getFaqs();
    const actualizada = lista.filter((item) => item.id !== id);
    storageService.set(FAQ_STORAGE_KEY, actualizada);
  }
};
