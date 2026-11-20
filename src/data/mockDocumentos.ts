import { DocumentoRequerido, DocumentoExpediente } from '../types';

export const DOCUMENTOS_REQUERIDOS: DocumentoRequerido[] = [
  {
    id: 'fut',
    nombre: 'Formato Único de Trámite (FUT)',
    descripcion: 'Solicitud formal dirigida al Director de la Escuela Profesional de Ingeniería Industrial solicitando fecha y hora de sustentación.',
    requerido: true,
    orden: 1
  },
  {
    id: 'egresado',
    nombre: 'Constancia de Egresado',
    descripcion: 'Expedida por la Oficina de Registro Técnico de la UNT, acreditando la culminación del plan curricular de estudios.',
    requerido: true,
    orden: 2
  },
  {
    id: 'turnitin',
    nombre: 'Reporte de Similitud Turnitin (< 20%)',
    descripcion: 'Reporte integral de originalidad emitido por la Unidad de Investigación con porcentaje de similitud menor al 20%, firmado digitalmente por el asesor.',
    requerido: true,
    orden: 3
  },
  {
    id: 'resolucion',
    nombre: 'Resolución Decanal de Aprobación de Proyecto',
    descripcion: 'Copia digital de la resolución de Consejo de Facultad que aprueba el proyecto de tesis y designa al jurado dictaminador.',
    requerido: true,
    orden: 4
  },
  {
    id: 'no_adeudo',
    nombre: 'Constancia de No Adeudo Centralizada',
    descripcion: 'Certificado de no adeudo económico, biblioteca central ni laboratorios especializados de la Facultad de Ingeniería.',
    requerido: true,
    orden: 5
  }
];

// Expedientes iniciales vacíos: listo para recepción real de tesistas
export const INITIAL_EXPEDIENTES: DocumentoExpediente[] = [];
