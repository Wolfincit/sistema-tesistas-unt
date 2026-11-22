import { FaqItem } from '../types';
import { storageService } from './storageService';
import { driveApiService } from './driveApiService';

const FAQ_STORAGE_KEY = 'unt_industrial_faqs_v2';

const INITIAL_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    pregunta: '¿Qué parte del trámite de sustentación es física y qué parte es virtual?',
    respuesta: 'La entrega inicial del expediente (FUT, voucher TUPA, reporte Turnitin < 20% firmado por el asesor, constancia de prácticas, resolución de proyecto y 3 ejemplares de tesis) se realiza en FÍSICO en la Secretaría de Escuela (Srta. Celia). El seguimiento logístico del expediente puedes consultarlo virtualmente en la pestaña "Instrucciones y Seguimiento", y tras sustentar, la Carpeta de Titulación se sube virtualmente en tramites-uraa.unitru.edu.pe.',
    categoria: 'Trámite Físico y Virtual',
    fechaActualizacion: '2026-11-22'
  },
  {
    id: 'faq-2',
    pregunta: '¿Qué días y en qué horario se realizan las sustentaciones de tesis en Ingeniería Industrial?',
    respuesta: 'Las sustentaciones de tesis en la Escuela Profesional de Ingeniería Industrial UNT se programan exclusivamente los días JUEVES de 11:00 a.m. a 1:00 p.m., una vez que los 3 miembros del Jurado Evaluador (Presidente, Secretario y Vocal) han firmado el dictamen favorable.',
    categoria: 'Sustentación (Jueves 11-1 PM)',
    fechaActualizacion: '2026-11-22'
  },
  {
    id: 'faq-3',
    pregunta: '¿Por qué puede demorar mi trámite si ya entregué mi folder físico en Secretaría de Escuela?',
    respuesta: 'En la Secretaría de Escuela (Srta. Celia) el expediente se procesa y deriva en 24 a 48 horas. Los cuellos de botella ocurren en instancias externas a la Escuela: (1) Emisión y firma de Resolución de Jurado en Decanato de Facultad, o (2) Plazo de revisión de los 3 ejemplares por los miembros del Jurado Evaluador (15 a 30 días). Puedes verificar en qué estación exacta está tu trámite con tu Código de Matrícula.',
    categoria: 'Logística y Cuellos de Botella',
    fechaActualizacion: '2026-11-22'
  },
  {
    id: 'faq-4',
    pregunta: '¿Cuál es el porcentaje máximo de similitud permitido en Turnitin?',
    respuesta: 'El reporte oficial de originalidad Turnitin debe registrar un porcentaje de similitud menor al 20% y contar con la firma física de conformidad de tu docente asesor.',
    categoria: 'Requisitos',
    fechaActualizacion: '2026-11-22'
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
    await driveApiService.saveCollection('faqs', actualizada);
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
    await driveApiService.saveCollection('faqs', actualizada);
    return editada;
  },

  async eliminarFaq(id: string): Promise<void> {
    const lista = await this.getFaqs();
    const actualizada = lista.filter((item) => item.id !== id);
    storageService.set(FAQ_STORAGE_KEY, actualizada);
    await driveApiService.saveCollection('faqs', actualizada);
  }
};
