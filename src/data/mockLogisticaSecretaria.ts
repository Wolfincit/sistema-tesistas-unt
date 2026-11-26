/**
 * Datos Iniciales del Sistema de Logística Documentaria y Gestión de Sustentaciones
 * Escuela Profesional de Ingeniería Industrial — Universidad Nacional de Trujillo (Srta. Celia)
 */

export type EstacionLogisticaId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type SemaforoEstadoId = 'operativo' | 'atencion' | 'incidencia';
export type TipoTramiteId = 'titulado' | 'bachiller';

export interface EstacionLogisticaMeta {
  id: EstacionLogisticaId;
  codigo: string;
  nombre: string;
  corto: string;
  fase: 'sustentacion' | 'colacion';
  responsable: string;
  tipoFlujo: 'INTERNO_ESCUELA' | 'EXTERNO_FACULTAD' | 'EXTERNO_JURADO' | 'ACTO_PUBLICO' | 'EXTERNO_URAA';
  modalidad: 'Físico en Escuela' | 'Físico / Derivación Externa' | 'Mixto (Físico + Virtual)' | 'Virtual (Plataforma UNT)';
  slaDiasMax: number;
  descripcion: string;
}

export const ESTACIONES_LOGISTICAS: EstacionLogisticaMeta[] = [
  {
    id: 1,
    codigo: 'EST-01',
    nombre: 'Recibido en Escuela',
    corto: '1. Recibido',
    fase: 'sustentacion',
    responsable: 'Secretaría de Escuela (Srta. Celia)',
    tipoFlujo: 'INTERNO_ESCUELA',
    modalidad: 'Mixto (Físico + Virtual)',
    slaDiasMax: 2,
    descripcion: 'Recepción del expediente remitido por Mesa de Partes (FUT Opción 29 / Proyecto) y registro en la matriz de la Escuela.'
  },
  {
    id: 2,
    codigo: 'EST-02',
    nombre: 'En Decanato (Resolución)',
    corto: '2. Decanato',
    fase: 'sustentacion',
    responsable: 'Decanato / Facultad de Ingeniería',
    tipoFlujo: 'EXTERNO_FACULTAD',
    modalidad: 'Virtual (Plataforma UNT)',
    slaDiasMax: 7,
    descripcion: 'Emisión y firma de la Resolución Decanal de nombramiento de Jurado Evaluador (o nueva resolución por Cambio de Título).'
  },
  {
    id: 3,
    codigo: 'EST-03',
    nombre: 'Revisión de Jurado (10 días)',
    corto: '3. Jurado',
    fase: 'sustentacion',
    responsable: 'Jurado Evaluador (Presidente, Secretario, Vocal)',
    tipoFlujo: 'EXTERNO_JURADO',
    modalidad: 'Mixto (Físico + Virtual)',
    slaDiasMax: 10,
    descripcion: 'Revisión del borrador por el jurado, levantamiento de observaciones y firma física del Dictamen de Aprobación con evidencias.'
  },
  {
    id: 4,
    codigo: 'EST-04',
    nombre: 'Listo Jueves (Sustentación)',
    corto: '4. Jueves',
    fase: 'sustentacion',
    responsable: 'Secretaría de Escuela y Jurado Evaluador',
    tipoFlujo: 'ACTO_PUBLICO',
    modalidad: 'Físico en Escuela',
    slaDiasMax: 7,
    descripcion: 'Programado para día jueves (11:00 a.m. - 1:00 p.m.) en Auditorio o Aula II-4. Entregar empastados 48 h antes y asistir 1 h antes.'
  },
  {
    id: 5,
    codigo: 'EST-05',
    nombre: 'Turnitin 2 y Comité de Ética',
    corto: '5. Ética',
    fase: 'colacion',
    responsable: 'Asesor y Comité de Ética de la Facultad',
    tipoFlujo: 'EXTERNO_FACULTAD',
    modalidad: 'Virtual (Plataforma UNT)',
    slaDiasMax: 10,
    descripcion: '2do Turnitin con recibo con depósito del asesor + recibo S/ 87.60 + declaración jurada al Comité de Ética para Constancia de Originalidad.'
  },
  {
    id: 6,
    codigo: 'EST-06',
    nombre: 'Repositorio UNT (Ing. Valerio)',
    corto: '6. Repositorio',
    fase: 'colacion',
    responsable: 'Biblioteca de Ingeniería (Ing. Valerio Ynfantes)',
    tipoFlujo: 'EXTERNO_FACULTAD',
    modalidad: 'Virtual (Plataforma UNT)',
    slaDiasMax: 10,
    descripcion: 'Envío del PDF final + 4 anexos (Carta de Autorización, Declaración Jurada, Acta de Aprobación y Constancia de Originalidad) a vynfantes@unitru.edu.pe para obtener el URL.'
  },
  {
    id: 7,
    codigo: 'EST-07',
    nombre: 'Carpeta Digital URA / Facultad',
    corto: '7. URA',
    fase: 'colacion',
    responsable: 'Escuela, Facultad y URAA (tramites-uraa.unitru.edu.pe)',
    tipoFlujo: 'EXTERNO_URAA',
    modalidad: 'Virtual (Plataforma UNT)',
    slaDiasMax: 15,
    descripcion: 'Subida de carpeta en URA (pago S/ 275.90 Cód. 005-166-17 para Título o S/ 273 para Bachiller), validación Escuela → Facultad → URAA y entrega de 2 empastados finales.'
  },
  {
    id: 8,
    codigo: 'EST-08',
    nombre: 'Listo para Colación',
    corto: '8. Colación',
    fase: 'colacion',
    responsable: 'URAA y Secretaría General (SUNEDU)',
    tipoFlujo: 'EXTERNO_URAA',
    modalidad: 'Físico / Derivación Externa',
    slaDiasMax: 0,
    descripcion: 'Expediente aprobado y apto para la ceremonia de colación y posterior registro ante SUNEDU por Secretaría General.'
  }
];

export interface SeguimientoTesisItem {
  id: string;
  codigoMatricula: string;
  tesistaNombre: string;
  tesistaCorreo: string;
  tesistaTelefono?: string;
  tipoTramite?: TipoTramiteId; // 'titulado' (default) | 'bachiller' (ruta rápida sin Ética ni Repositorio)
  sede?: 'Trujillo' | 'Valle Jequetepeque' | 'Huamachuco';
  tituloTesis: string;
  lineaInvestigacion: string;
  asesor: string;
  juradoPresidente: string;
  juradoSecretario: string;
  juradoVocal: string;
  estacionActual: EstacionLogisticaId;
  semaforo?: SemaforoEstadoId; // 'operativo' (Verde) | 'atencion' (Amarillo) | 'incidencia' (Rojo)
  fechaIngresoEstacion: string; // YYYY-MM-DD
  fechaInicioTramite: string;   // YYYY-MM-DD
  ubicacionFisica: string;
  esCuelloBotellaExterno: boolean;
  motivoRetrasoExterno?: string;
  notasSecretaria: string;
  fechaSustentacionProgramada?: string; // YYYY-MM-DD (Jueves)
  flyerEnviado?: boolean;
  cambioTituloActivo?: boolean;
  desaprobadoFecha?: string; // YYYY-MM-DD — activa conteo automático de 30 días calendario
  urlRepositorio?: string;
  codigoUra?: string;
  requisitosFisicos: {
    futFisico: boolean;
    voucherTupa: boolean;
    reporteTurnitin: boolean;
    constanciaPracticas: boolean;
    resolucionProyecto: boolean;
    tresBorradoresJurado: boolean;
  };
}

export interface DudaTesistaPendiente {
  id: string;
  codigoMatricula?: string;
  tesistaNombre?: string;
  pregunta: string;
  categoriaSugerida: string;
  fechaHora: string;
  estado: 'pendiente' | 'respondida';
  respuestaOficial?: string;
  fechaRespuesta?: string;
}

export interface ConfigColacion {
  nombreColacion: string;
  fechaLimiteCarpeta: string; // YYYY-MM-DD
  fechaCeremonia: string;     // YYYY-MM-DD
}

export interface IngenieroJuradoItem {
  id: string;
  nombre: string;
  correo: string;
  especialidad: string;
  categoria: string;
  activo: boolean;
}

export interface SustentacionJuevesItem {
  id: string;
  fecha: string; // YYYY-MM-DD (preferentemente Jueves)
  horario: string; // Por defecto "11:00 a.m. - 01:00 p.m."
  tesistaId?: string;
  tesistaNombre: string;
  tesistaCodigo: string;
  tesistaCorreo: string;
  tituloTesis: string;
  asesor: string;
  juradoPresidente: string;
  juradoSecretario: string;
  juradoVocal: string;
  aulaOAuditorio: string;
  estado: 'Programada' | 'Realizada (Acta Firmada)' | 'Reprogramada';
  observacion?: string;
}

export interface InstruccionPasoItem {
  id: string;
  paso: string;
  icono: 'clipboard' | 'users' | 'calendar' | 'mail' | 'award' | 'file' | 'check' | 'link';
  titulo: string;
  descripcion: string;
  imagenDataUrl?: string;
  linkTexto?: string;
  linkUrl?: string;
  documentoNombre?: string;
  documentoDataUrl?: string;
  documentoPeso?: string;
}

export const INITIAL_INSTRUCCIONES_PASOS: InstruccionPasoItem[] = [
  {
    id: 'inst-1',
    paso: 'Paso 1',
    icono: 'clipboard',
    titulo: 'Proyecto de Tesis y Nombramiento de Asesor',
    descripcion:
      'Pagar en Interbank (Cód. 005-166-01): S/ 15.00 (asesor) y S/ 30.00 (proyecto). Unir en 1 solo PDF: FUT (Opción 34), vouchers, Carta de Compromiso del Asesor y Proyecto de Tesis, y enviarlo a mesadepartes_ingenieria@unitru.edu.pe.',
    linkTexto: 'Carpeta de Formatos y FUT (Drive Oficial)',
    linkUrl: 'https://drive.google.com/drive/folders/18YKeZlbUeDuhdnFWn8TpgbtatF6-hve5',
    documentoNombre: 'Guia_09_Proyecto_Tesis_UNT.txt',
    documentoPeso: '15 KB'
  },
  {
    id: 'inst-2',
    paso: 'Paso 2',
    icono: 'users',
    titulo: 'Nombramiento de Jurado y Revisión (10 días)',
    descripcion:
      'Pagar en Interbank (Cód. 005-166-01): S/ 30.00 (trámite) y S/ 87.60 (Turnitin). Enviar 3 PDFs a mesadepartes_ingenieria@unitru.edu.pe: (1) FUT Opción 29 + requisitos, (2) Borrador firmado por asesor y (3) Voucher S/ 87.60.',
    linkTexto: 'Guía N° 10 — Nombramiento de Jurado (PDF)',
    linkUrl: 'https://drive.google.com/file/d/132TLDEdbBulcduzKuHxcyOEM63PZ7hDi/view',
    documentoNombre: 'Guia_10_Jurado_y_Sustentacion_UNT.txt',
    documentoPeso: '18 KB'
  },
  {
    id: 'inst-3',
    paso: 'Paso 3',
    icono: 'calendar',
    titulo: 'Entrega de Dictamen Físico y Agenda (Martes)',
    descripcion:
      'Con el borrador aprobado, entregar en Secretaría de Escuela (48h antes) el Dictamen de Aprobación firmado por los 3 jurados, las evidencias impresas y los ejemplares para agendar el jueves y publicar el flyer oficial.',
    linkTexto: 'Tasas Educativas Interbank',
    linkUrl: 'https://drive.google.com/file/d/1P85-Z6HTJK9HtBrUxTZpPxj6UkeGNKBV/view'
  },
  {
    id: 'inst-4',
    paso: 'Paso 4',
    icono: 'award',
    titulo: 'Sustentación Pública (Jueves 11:00 a.m. - 1:00 p.m.)',
    descripcion:
      'Asistir 1 hora antes al Auditorio de Ingeniería Industrial (o Aula II-4) con vestimenta formal y diapositivas listas.',
    linkTexto: 'Guía de Cambio de Título / Procedimientos (PDF)',
    linkUrl: 'https://drive.google.com/file/d/1RhrFx6Nm4c3MB7E-fOtRO71-cxLn4FIZ/view'
  },
  {
    id: 'inst-5',
    paso: 'Paso 5',
    icono: 'check',
    titulo: 'Colación: Comité de Ética, Repositorio (Ing. Valerio) y Sistema URA',
    descripcion:
      '1. Comité de Ética: Subir 2do Turnitin con depósito + recibo S/ 87.60 para Constancia de Originalidad.\n2. Repositorio: Enviar PDF de tesis + 4 anexos a vynfantes@unitru.edu.pe para obtener URL.\n3. Sistema URA: Pagar S/ 275.90 (Cód. 005-166-17), subir carpeta en tramites-uraa.unitru.edu.pe, entregar 2 empastados (Biblioteca y Escuela) y enviar PDF final (T004_DNI_T.pdf) a cchau@unitru.edu.pe.',
    linkTexto: 'Ingresar al Sistema URA (tramites-uraa.unitru.edu.pe)',
    linkUrl: 'https://tramites-uraa.unitru.edu.pe/sign-in',
    documentoNombre: 'Guia_06_Colacion_Ordinaria_UNT.txt',
    documentoPeso: '20 KB'
  }
];

export interface DespachoChatAnuncioItem {
  id: string;
  fechaHora: string;
  asunto: string;
  mensaje: string;
  flyerDataUrl?: string;
  flyerNombre?: string;
  tesistasDestinatarios: { nombre: string; correo: string }[];
  juradoDestinatarios: { nombre: string; correo: string }[];
  modoEnvio: 'smtp-direct' | 'registro-interno';
  enviadoPor: string;
}

export const INITIAL_DIRECTORIO_JURADO: IngenieroJuradoItem[] = [
  {
    id: 'ing-01',
    nombre: 'Dr. Ing. Ángel Hernández Molina',
    correo: 'ahernandezm@unitru.edu.pe',
    especialidad: 'Producción, Operaciones y Lean Manufacturing',
    categoria: 'Docente Principal',
    activo: true
  },
  {
    id: 'ing-02',
    nombre: 'Mg. Ing. Carlos José Sandoval Reyes',
    correo: 'csandovalr@unitru.edu.pe',
    especialidad: 'Gestión de la Calidad y Six Sigma',
    categoria: 'Docente Asociado',
    activo: true
  },
  {
    id: 'ing-03',
    nombre: 'Dr. Ing. Joe Alexis González Vásquez',
    correo: 'jgonzalezv@unitru.edu.pe',
    especialidad: 'Logística y Cadena de Suministro',
    categoria: 'Docente Principal',
    activo: true
  },
  {
    id: 'ing-04',
    nombre: 'Dr. Ing. José Manuel Castañeda Meléndez',
    correo: 'jcastanedam@unitru.edu.pe',
    especialidad: 'Gestión Estratégica y Proyectos Industriales',
    categoria: 'Docente Principal',
    activo: true
  },
  {
    id: 'ing-05',
    nombre: 'Mg. Ing. Víctor Manuel Sirlopú Vera',
    correo: 'vsirlopuv@unitru.edu.pe',
    especialidad: 'Seguridad Industrial y Salud Ocupacional',
    categoria: 'Docente Asociado',
    activo: true
  },
  {
    id: 'ing-06',
    nombre: 'Dr. Ing. Luis Alberto Benites Gutiérrez',
    correo: 'lbenitesg@unitru.edu.pe',
    especialidad: 'Ingeniería de Métodos y Ergonomía',
    categoria: 'Docente Principal',
    activo: true
  },
  {
    id: 'ing-07',
    nombre: 'Mg. Ing. Marcos Gregorio Baca López',
    correo: 'mbacal@unitru.edu.pe',
    especialidad: 'Planeamiento y Control de Operaciones',
    categoria: 'Docente Asociado',
    activo: true
  },
  {
    id: 'ing-08',
    nombre: 'Mg. Ing. Billy Alexis Ángeles Rojas',
    correo: 'bangelesr@unitru.edu.pe',
    especialidad: 'Automatización y Procesos Industriales',
    categoria: 'Docente Auxiliar',
    activo: true
  },
  {
    id: 'adm-01',
    nombre: 'Sr. Elmo (Encargado de Auditorio)',
    correo: 'auditorio.industrial@unitru.edu.pe',
    especialidad: 'Apertura de Auditorio Jueves 11:00 a.m.',
    categoria: 'Copia Martes',
    activo: true
  },
  {
    id: 'adm-02',
    nombre: 'Sra. Estela (Departamento Académico)',
    correo: 'departamento.industrial@unitru.edu.pe',
    especialidad: 'Difusión a Grupo de Docentes',
    categoria: 'Copia Martes',
    activo: true
  },
  {
    id: 'adm-03',
    nombre: 'Sra. Rosita (Coordinación Administrativa)',
    correo: 'coordinacion.industrial@unitru.edu.pe',
    especialidad: 'Conocimiento Administrativo',
    categoria: 'Copia Martes',
    activo: true
  }
];

export const INITIAL_SEGUIMIENTO_LOGISTICO: SeguimientoTesisItem[] = [
  {
    id: 'seg-001',
    codigoMatricula: '1511300223',
    tesistaNombre: 'Carlos Eduardo Mendoza Villanueva',
    tesistaCorreo: 'tesista.industrial@unitru.edu.pe',
    tesistaTelefono: '948123456',
    tituloTesis: 'Propuesta de mejora en la gestión de almacenes mediante Lean Warehousing para reducir costos operativos en una empresa agroindustrial de La Libertad, 2026',
    lineaInvestigacion: 'Logística y Cadena de Suministro',
    asesor: 'Dr. Ing. Joe Alexis González Vásquez',
    juradoPresidente: 'Dr. Ing. Ángel Hernández Molina',
    juradoSecretario: 'Mg. Ing. Carlos José Sandoval Reyes',
    juradoVocal: 'Dr. Ing. Joe Alexis González Vásquez',
    estacionActual: 4,
    semaforo: 'operativo',
    fechaIngresoEstacion: '2026-11-18',
    fechaInicioTramite: '2026-10-15',
    ubicacionFisica: 'Auditorio Ing. Industrial',
    esCuelloBotellaExterno: false,
    notasSecretaria: 'Dictamen firmado y 4 empastados entregados. Programado Jueves 11:00 a.m. en Auditorio.',
    fechaSustentacionProgramada: '2026-11-26',
    requisitosFisicos: {
      futFisico: true,
      voucherTupa: true,
      reporteTurnitin: true,
      constanciaPracticas: true,
      resolucionProyecto: true,
      tresBorradoresJurado: true
    }
  },
  {
    id: 'seg-002',
    codigoMatricula: '1511300315',
    tesistaNombre: 'Melina Nayhely Quiñones Mostacero',
    tesistaCorreo: 'mquinones@unitru.edu.pe',
    tesistaTelefono: '944987321',
    tituloTesis: 'Implementación de la metodología Lean Manufacturing en el proceso de arándano para aumentar la productividad de la empresa Agrícola Cerro Prieto S.A.',
    lineaInvestigacion: 'Producción y Operaciones',
    asesor: 'Dr. Ing. Ángel Hernández Molina',
    juradoPresidente: 'Dr. Ing. José Manuel Castañeda Meléndez',
    juradoSecretario: 'Mg. Ing. Víctor Manuel Sirlopú Vera',
    juradoVocal: 'Dr. Ing. Ángel Hernández Molina',
    estacionActual: 3,
    semaforo: 'atencion',
    fechaIngresoEstacion: '2026-10-20',
    fechaInicioTramite: '2026-10-08',
    ubicacionFisica: 'En revisión del Jurado (Plazo 10 días)',
    esCuelloBotellaExterno: true,
    motivoRetrasoExterno: 'En revisión del Jurado Evaluador.',
    notasSecretaria: 'Presidente y Vocal aprobaron; falta firma de Secretario en el Dictamen físico.',
    requisitosFisicos: {
      futFisico: true,
      voucherTupa: true,
      reporteTurnitin: true,
      constanciaPracticas: true,
      resolucionProyecto: true,
      tresBorradoresJurado: true
    }
  },
  {
    id: 'seg-003',
    codigoMatricula: '1511300342',
    tesistaNombre: 'Neiser Michel Salas Ríos',
    tesistaCorreo: 'nsalas@unitru.edu.pe',
    tesistaTelefono: '949555812',
    tituloTesis: 'Diseño de un sistema de gestión de seguridad y salud en el trabajo basado en ISO 45001 para reducir riesgos laborales en planta metalmecánica, Trujillo',
    lineaInvestigacion: 'Seguridad y Salud Ocupacional',
    asesor: 'Mg. Ing. Víctor Manuel Sirlopú Vera',
    juradoPresidente: 'Dr. Ing. Luis Alberto Benites Gutiérrez',
    juradoSecretario: 'Mg. Ing. Marcos Gregorio Baca López',
    juradoVocal: 'Mg. Ing. Víctor Manuel Sirlopú Vera',
    estacionActual: 2,
    semaforo: 'incidencia',
    fechaIngresoEstacion: '2026-11-08',
    fechaInicioTramite: '2026-11-07',
    ubicacionFisica: 'Observado por Cambio de Título',
    esCuelloBotellaExterno: true,
    motivoRetrasoExterno: 'Trámite de Cambio de Título en Decanato.',
    notasSecretaria: 'Jurado observó el título. Debe ingresar FUT + S/ 5.00 + carta del jurado para nueva resolución antes de sustentar.',
    requisitosFisicos: {
      futFisico: true,
      voucherTupa: true,
      reporteTurnitin: true,
      constanciaPracticas: true,
      resolucionProyecto: true,
      tresBorradoresJurado: true
    }
  },
  {
    id: 'seg-004',
    codigoMatricula: '1511300418',
    tesistaNombre: 'Diego Alonso Carranza Vásquez',
    tesistaCorreo: 'dcarranza@unitru.edu.pe',
    tesistaTelefono: '942311709',
    tituloTesis: 'Aplicación de herramientas Lean Six Sigma para reducir productos no conformes en línea de envasado agroexportador',
    lineaInvestigacion: 'Gestión de la Calidad',
    asesor: 'Mg. Ing. Carlos José Sandoval Reyes',
    juradoPresidente: 'Dr. Ing. Ángel Hernández Molina',
    juradoSecretario: 'Dr. Ing. Joe Alexis González Vásquez',
    juradoVocal: 'Mg. Ing. Carlos José Sandoval Reyes',
    estacionActual: 1,
    semaforo: 'atencion',
    fechaIngresoEstacion: '2026-11-21',
    fechaInicioTramite: '2026-11-21',
    ubicacionFisica: 'Secretaría de Escuela',
    esCuelloBotellaExterno: false,
    notasSecretaria: 'Ingresó 3 archivos PDF por Mesa de Partes (Opción 29 FUT). En emisión de proveído de jurado.',
    requisitosFisicos: {
      futFisico: true,
      voucherTupa: true,
      reporteTurnitin: true,
      constanciaPracticas: false,
      resolucionProyecto: true,
      tresBorradoresJurado: true
    }
  }
];

export const INITIAL_SUSTENTACIONES_JUEVES: SustentacionJuevesItem[] = [
  {
    id: 'jue-001',
    fecha: '2026-11-26',
    horario: '11:00 a.m. - 01:00 p.m.',
    tesistaId: 'seg-001',
    tesistaNombre: 'Carlos Eduardo Mendoza Villanueva',
    tesistaCodigo: '1511300223',
    tesistaCorreo: 'tesista.industrial@unitru.edu.pe',
    tituloTesis: 'Propuesta de mejora en la gestión logística de almacenes mediante Lean Warehousing para reducir costos operativos en una empresa agroindustrial de La Libertad, 2026',
    asesor: 'Dr. Ing. Joe Alexis González Vásquez',
    juradoPresidente: 'Dr. Ing. Ángel Hernández Molina',
    juradoSecretario: 'Mg. Ing. Carlos José Sandoval Reyes',
    juradoVocal: 'Dr. Ing. Joe Alexis González Vásquez',
    aulaOAuditorio: 'Auditorio de Ingeniería Industrial UNT',
    estado: 'Programada',
    observacion: 'Citación y flyer enviados al tesista y a los 3 ingenieros del jurado.'
  },
  {
    id: 'jue-002',
    fecha: '2026-12-03',
    horario: '11:00 a.m. - 01:00 p.m.',
    tesistaId: 'seg-002',
    tesistaNombre: 'Melina Nayhely Quiñones Mostacero',
    tesistaCodigo: '1511300315',
    tesistaCorreo: 'mquinones@unitru.edu.pe',
    tituloTesis: 'Implementación de la metodología Lean Manufacturing en el proceso de arándano para aumentar la productividad de la empresa Agrícola Cerro Prieto S.A.',
    asesor: 'Dr. Ing. Ángel Hernández Molina',
    juradoPresidente: 'Dr. Ing. José Manuel Castañeda Meléndez',
    juradoSecretario: 'Mg. Ing. Víctor Manuel Sirlopú Vera',
    juradoVocal: 'Dr. Ing. Ángel Hernández Molina',
    aulaOAuditorio: 'Auditorio de Ingeniería Industrial UNT',
    estado: 'Programada',
    observacion: 'Programada para jueves 11:00 a.m. - 1:00 p.m.'
  }
];

export const INITIAL_HISTORIAL_DESPACHOS: DespachoChatAnuncioItem[] = [
  {
    id: 'desp-001',
    fechaHora: '2026-11-20 10:15',
    asunto: 'Citación Oficial a Sustentación de Tesis — Jueves 26/11 (11:00 a.m. a 1:00 p.m.)',
    mensaje: 'Estimados miembros del Jurado Evaluador y Sr. Tesista Carlos Eduardo Mendoza Villanueva:\n\nPor encargo de la Dirección de la Escuela Profesional de Ingeniería Industrial UNT, se les cita a la Sustentación Pública de Tesis programada para el día JUEVES 26 de noviembre de 11:00 a.m. a 1:00 p.m. en el Auditorio de Ingeniería Industrial. Se adjunta el Flyer oficial del acto académico.\n\nAtentamente,\nSrta. Celia — Secretaría de Escuela de Ingeniería Industrial UNT.',
    tesistasDestinatarios: [
      { nombre: 'Carlos Eduardo Mendoza Villanueva', correo: 'tesista.industrial@unitru.edu.pe' }
    ],
    juradoDestinatarios: [
      { nombre: 'Dr. Ing. Ángel Hernández Molina (Presidente)', correo: 'ahernandezm@unitru.edu.pe' },
      { nombre: 'Mg. Ing. Carlos José Sandoval Reyes (Secretario)', correo: 'csandovalr@unitru.edu.pe' },
      { nombre: 'Dr. Ing. Joe Alexis González Vásquez (Vocal)', correo: 'jgonzalezv@unitru.edu.pe' }
    ],
    modoEnvio: 'registro-interno',
    enviadoPor: 'Srta. Celia (Secretaría Académica)'
  }
];
