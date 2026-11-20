import { FormatoInstitucional } from '../types';

export const INITIAL_FORMATOS: FormatoInstitucional[] = [
  {
    id: 'fmt-001',
    nombre: 'Formato Único de Trámite (FUT)',
    descripcion: 'Solicitud formal dirigida a la Dirección de Escuela para fijar fecha, hora y jurado dictaminador.',
    formato: 'PDF',
    archivoNombre: 'FUT_Oficial_UNT_2026.pdf',
    peso: '245 KB',
    tipo: 'Documento Obligatorio',
    fechaSubida: '2026-11-01',
    subidoPor: 'Secretaría Académica UNT'
  },
  {
    id: 'fmt-002',
    nombre: 'Guía y Estructura del Informe de Tesis',
    descripcion: 'Normas de estilo oficial APA 7ma edición, márgenes y lineamientos de la Escuela de Ing. Industrial.',
    formato: 'PDF',
    archivoNombre: 'Guia_Tesis_Ing_Industrial_UNT.pdf',
    peso: '1.2 MB',
    tipo: 'Directiva Académica',
    fechaSubida: '2026-11-01',
    subidoPor: 'Secretaría Académica UNT'
  },
  {
    id: 'fmt-003',
    nombre: 'Declaración Jurada de Originalidad Turnitin',
    descripcion: 'Plantilla editable visada por el tesista y docente asesor certificando similitud menor al 20%.',
    formato: 'DOCX',
    archivoNombre: 'DJ_Originalidad_Turnitin_Industrial.docx',
    peso: '85 KB',
    tipo: 'Plantilla Editable',
    fechaSubida: '2026-11-02',
    subidoPor: 'Secretaría Académica UNT'
  },
  {
    id: 'fmt-004',
    nombre: 'Reglamento General de Grados y Títulos',
    descripcion: 'Resolución de Consejo Universitario N° 0184-2022/UNT que norma la obtención del título profesional.',
    formato: 'PDF',
    archivoNombre: 'Reglamento_Grados_Titulos_UNT_0184_2022.pdf',
    peso: '560 KB',
    tipo: 'Normativa UNT',
    fechaSubida: '2026-11-01',
    subidoPor: 'Secretaría Académica UNT'
  },
  {
    id: 'fmt-005',
    nombre: 'Modelo de Solicitud de Designación de Jurado',
    descripcion: 'Plantilla de oficio para solicitar la confirmación de los 3 docentes evaluadores del tribunal.',
    formato: 'DOCX',
    archivoNombre: 'Solicitud_Designacion_Jurado_Tribunal.docx',
    peso: '92 KB',
    tipo: 'Plantilla Editable',
    fechaSubida: '2026-11-04',
    subidoPor: 'Secretaría Académica UNT'
  }
];
