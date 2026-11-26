import { FaqItem } from '../types';
import { storageService } from './storageService';
import { driveApiService } from './driveApiService';

const FAQ_STORAGE_KEY = 'unt_industrial_faqs_v3';

const INITIAL_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    pregunta: '¿Qué parte del trámite de tesis es virtual y qué parte es física?',
    respuesta: 'El envío del Proyecto de Tesis (Opción 34 del FUT) y la solicitud de Jurado Evaluador (Opción 29 del FUT) se realizan virtualmente enviando los archivos PDF a mesadepartes_ingenieria@unitru.edu.pe. Una vez que el jurado aprueba el borrador, se entrega en físico en Secretaría de Escuela (48 horas antes) el Dictamen de Aprobación firmado por los 3 jurados junto con las evidencias impresas y los ejemplares.',
    categoria: 'Trámite',
    linkUrl: 'https://drive.google.com/drive/folders/18YKeZlbUeDuhdnFWn8TpgbtatF6-hve5',
    linkTexto: 'Abrir Carpeta Oficial de Formatos y Guías (Drive)',
    fechaActualizacion: '2026-11-26'
  },
  {
    id: 'faq-2',
    pregunta: '¿Qué días y en qué horario se realizan las sustentaciones?',
    respuesta: 'Las sustentaciones se programan los días jueves de 11:00 a.m. a 1:00 p.m. (turnos de 11:00 a.m. y 12:00 p.m.) en el Auditorio de Ingeniería Industrial (sin costo de derecho de uso) o en Aula asignada.',
    categoria: 'Sustentación',
    linkUrl: 'https://drive.google.com/file/d/132TLDEdbBulcduzKuHxcyOEM63PZ7hDi/view',
    linkTexto: 'Ver Guía N° 10 — Jurado y Sustentación (Drive)',
    fechaActualizacion: '2026-11-26'
  },
  {
    id: 'faq-3',
    pregunta: '¿Qué debo hacer si el jurado modifica u observa el título de mi tesis?',
    respuesta: 'Si el jurado solicita cambiar el título del borrador, antes de sustentar debes tramitar una nueva resolución enviando a mesadepartes_ingenieria@unitru.edu.pe un solo PDF con: FUT, recibo de S/ 5.00 (Cód. Interbank 005-166-01), carta del jurado justificando el nuevo título, proveído y resolución de jurado.',
    categoria: 'Expediente',
    linkUrl: 'https://drive.google.com/file/d/1RhrFx6Nm4c3MB7E-fOtRO71-cxLn4FIZ/view',
    linkTexto: 'Ver Guía de Cambio de Título y Procedimientos (Drive)',
    fechaActualizacion: '2026-11-26'
  },
  {
    id: 'faq-4',
    pregunta: '¿Cuál es el procedimiento después de aprobar la sustentación para obtener el título?',
    respuesta: '1) Solicitar al asesor el 2do Turnitin con recibo de depósito y subirlo al Sistema del Comité de Ética de la Facultad con el recibo de S/ 87.60 para obtener la Constancia de Originalidad.\n2) Enviar el PDF de la tesis con los 4 anexos al Ing. Valerio Ynfantes (vynfantes@unitru.edu.pe) para obtener el código URL y la Constancia de Repositorio.\n3) Pagar S/ 275.90 en Interbank (Cód. 005-166-17), subir la carpeta al Sistema URA (tramites-uraa.unitru.edu.pe), entregar 2 empastados (Biblioteca de Facultad y Escuela) y enviar el archivo T004_DNI_T.pdf a cchau@unitru.edu.pe.',
    categoria: 'Requisitos',
    linkUrl: 'https://tramites-uraa.unitru.edu.pe/sign-in',
    linkTexto: 'Ingresar al Portal Oficial URA',
    fechaActualizacion: '2026-11-26'
  }
];

export const faqService = {
  async getFaqs(): Promise<FaqItem[]> {
    return storageService.get<FaqItem[]>(FAQ_STORAGE_KEY, INITIAL_FAQS);
  },

  async agregarFaq(datos: {
    pregunta: string;
    respuesta: string;
    categoria?: string;
    linkUrl?: string;
    linkTexto?: string;
  }): Promise<FaqItem> {
    const lista = await this.getFaqs();
    const cleanUrl = String(datos.linkUrl || '').trim();
    const cleanTexto = String(datos.linkTexto || '').trim();
    const nueva: FaqItem = {
      id: `faq-${Date.now()}`,
      pregunta: datos.pregunta.trim(),
      respuesta: datos.respuesta.trim(),
      categoria: datos.categoria?.trim() || 'General',
      linkUrl: cleanUrl || undefined,
      linkTexto: cleanUrl ? cleanTexto || 'Abrir Guía / Formato en Drive' : undefined,
      fechaActualizacion: new Date().toISOString().slice(0, 10)
    };
    const actualizada = [nueva, ...lista];
    storageService.set(FAQ_STORAGE_KEY, actualizada);
    await driveApiService.saveCollection('faqs', actualizada);
    return nueva;
  },

  async editarFaq(
    id: string,
    datos: {
      pregunta: string;
      respuesta: string;
      categoria?: string;
      linkUrl?: string;
      linkTexto?: string;
    }
  ): Promise<FaqItem> {
    const lista = await this.getFaqs();
    const cleanUrl = String(datos.linkUrl || '').trim();
    const cleanTexto = String(datos.linkTexto || '').trim();
    let editada: FaqItem | null = null;
    const actualizada = lista.map((item) => {
      if (item.id === id) {
        editada = {
          ...item,
          pregunta: datos.pregunta.trim(),
          respuesta: datos.respuesta.trim(),
          categoria: datos.categoria?.trim() || item.categoria || 'General',
          linkUrl: cleanUrl || undefined,
          linkTexto: cleanUrl ? cleanTexto || 'Abrir Guía / Formato en Drive' : undefined,
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
