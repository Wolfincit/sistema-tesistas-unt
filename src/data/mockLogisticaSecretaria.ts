/**
 * Datos Iniciales del Sistema de Logística Documentaria y Gestión de Sustentaciones
 * Escuela Profesional de Ingeniería Industrial — Universidad Nacional de Trujillo (Srta. Celia)
 */

export type EstacionLogisticaId = 1 | 2 | 3 | 4 | 5 | 6;

export interface EstacionLogisticaMeta {
  id: EstacionLogisticaId;
  codigo: string;
  nombre: string;
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
    nombre: 'Recepción y Cotejo Físico en Escuela',
    responsable: 'Secretaría de Escuela (Srta. Celia)',
    tipoFlujo: 'INTERNO_ESCUELA',
    modalidad: 'Físico en Escuela',
    slaDiasMax: 2,
    descripcion: 'Recepción física del FUT, voucher TUPA, reporte Turnitin (<20%), constancia de prácticas, resolución de proyecto y 3 ejemplares de tesis.'
  },
  {
    id: 2,
    codigo: 'EST-02',
    nombre: 'Emisión de Resolución de Jurado en Decanato',
    responsable: 'Decanato / Facultad de Ingeniería (Externo)',
    tipoFlujo: 'EXTERNO_FACULTAD',
    modalidad: 'Físico / Derivación Externa',
    slaDiasMax: 7,
    descripcion: 'Trámite externo a la Escuela: emisión y firma de la Resolución Decanal que designa Presidente, Secretario y Vocal.'
  },
  {
    id: 3,
    codigo: 'EST-03',
    nombre: 'Revisión y Dictamen del Jurado Evaluador',
    responsable: 'Jurado Evaluador (3 Ingenieros Docentes)',
    tipoFlujo: 'EXTERNO_JURADO',
    modalidad: 'Mixto (Físico + Virtual)',
    slaDiasMax: 21,
    descripcion: 'Revisión de los 3 ejemplares por Presidente, Secretario y Vocal, levantamiento de observaciones del tesista y firma de conformidad.'
  },
  {
    id: 4,
    codigo: 'EST-04',
    nombre: 'Programación Jueves (11:00 - 1:00 p.m.) y Difusión de Flyer',
    responsable: 'Secretaría de Escuela (Srta. Celia)',
    tipoFlujo: 'INTERNO_ESCUELA',
    modalidad: 'Mixto (Físico + Virtual)',
    slaDiasMax: 3,
    descripcion: 'Asignación de fecha en el calendario de los días jueves (11:00 a.m. a 1:00 p.m.) y despacho de citación + flyer por correo al tesista y jurado.'
  },
  {
    id: 5,
    codigo: 'EST-05',
    nombre: 'Sustentación Pública y Firma de Acta',
    responsable: 'Jurado Evaluador y Dirección de Escuela',
    tipoFlujo: 'ACTO_PUBLICO',
    modalidad: 'Físico en Escuela',
    slaDiasMax: 1,
    descripcion: 'Defensa pública el día jueves de 11:00 a.m. a 1:00 p.m., deliberación y firma física del Acta de Sustentación.'
  },
  {
    id: 6,
    codigo: 'EST-06',
    nombre: 'Carpeta Digital URAA y Repositorio Biblioteca UNT',
    responsable: 'URAA / Biblioteca Central UNT (Externo)',
    tipoFlujo: 'EXTERNO_URAA',
    modalidad: 'Virtual (Plataforma UNT)',
    slaDiasMax: 15,
    descripcion: 'Trámite virtual final en tramites-uraa.unitru.edu.pe y publicación en repositorio.unitru.edu.pe para emisión del diploma.'
  }
];

export interface SeguimientoTesisItem {
  id: string;
  codigoMatricula: string;
  tesistaNombre: string;
  tesistaCorreo: string;
  tesistaTelefono?: string;
  tituloTesis: string;
  lineaInvestigacion: string;
  asesor: string;
  juradoPresidente: string;
  juradoSecretario: string;
  juradoVocal: string;
  estacionActual: EstacionLogisticaId;
  fechaIngresoEstacion: string; // YYYY-MM-DD
  fechaInicioTramite: string;   // YYYY-MM-DD
  ubicacionFisica: string;
  esCuelloBotellaExterno: boolean;
  motivoRetrasoExterno?: string;
  notasSecretaria: string;
  fechaSustentacionProgramada?: string; // YYYY-MM-DD (Jueves)
  requisitosFisicos: {
    futFisico: boolean;
    voucherTupa: boolean;
    reporteTurnitin: boolean;
    constanciaPracticas: boolean;
    resolucionProyecto: boolean;
    tresBorradoresJurado: boolean;
  };
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
    titulo: 'Presentación de Solicitud y Expediente en Secretaría de Escuela',
    descripcion:
      'Presentar en Secretaría de Escuela (Srta. Celia) el Formato Único de Trámite (FUT), recibo de pago correspondiente, informe Turnitin visado por el asesor y los ejemplares del borrador de tesis.',
    documentoNombre: 'Plantilla_FUT_Sustentacion_UNT.txt',
    documentoPeso: '12 KB'
  },
  {
    id: 'inst-2',
    paso: 'Paso 2',
    icono: 'users',
    titulo: 'Designación y Revisión del Jurado Evaluador',
    descripcion:
      'El Jurado Evaluador (Presidente, Secretario y Vocal) revisa el borrador de tesis. Una vez levantadas las observaciones, los tres miembros firman la conformidad para sustentar.'
  },
  {
    id: 'inst-3',
    paso: 'Paso 3',
    icono: 'calendar',
    titulo: 'Programación de Fecha de Sustentación (Jueves · 11:00 a.m. a 1:00 p.m.)',
    descripcion:
      'Con el visto bueno del jurado, Secretaría agenda tu fecha de sustentación en el calendario oficial de los días jueves (11:00 a.m. a 1:00 p.m.).'
  },
  {
    id: 'inst-4',
    paso: 'Paso 4',
    icono: 'mail',
    titulo: 'Envío de Citación y Flyer Oficial',
    descripcion:
      'Secretaría envía por correo electrónico el anuncio oficial y el flyer de la sustentación al tesista y a los ingenieros miembros del jurado.'
  },
  {
    id: 'inst-5',
    paso: 'Paso 5',
    icono: 'award',
    titulo: 'Sustentación Pública y Firma de Acta',
    descripcion:
      'Defensa de la tesis el día jueves programado de 11:00 a.m. a 1:00 p.m., deliberación del jurado y suscripción del Acta de Sustentación.'
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
  modoEnvio: 'smtp-direct' | 'assisted-gmail' | 'registro-interno';
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
  }
];

export const INITIAL_SEGUIMIENTO_LOGISTICO: SeguimientoTesisItem[] = [
  {
    id: 'seg-001',
    codigoMatricula: '1021400219',
    tesistaNombre: 'Carlos Eduardo Mendoza Villanueva',
    tesistaCorreo: 'tesista.industrial@unitru.edu.pe',
    tesistaTelefono: '948123456',
    tituloTesis: 'Propuesta de mejora en la gestión logística de almacenes mediante Lean Warehousing para reducir costos operativos en una empresa agroindustrial de La Libertad, 2026',
    lineaInvestigacion: 'Logística y Cadena de Suministro',
    asesor: 'Dr. Ing. Joe Alexis González Vásquez',
    juradoPresidente: 'Dr. Ing. Ángel Hernández Molina',
    juradoSecretario: 'Mg. Ing. Carlos José Sandoval Reyes',
    juradoVocal: 'Dr. Ing. Joe Alexis González Vásquez',
    estacionActual: 4,
    fechaIngresoEstacion: '2026-11-18',
    fechaInicioTramite: '2026-10-15',
    ubicacionFisica: 'Archivo de Escuela (Srta. Celia) — Listo para Sustentación',
    esCuelloBotellaExterno: false,
    notasSecretaria: 'Expediente físico completo (FUT, Turnitin 14%, 3 ejemplares revisados con dictamen favorable). Programado para sustentar el jueves de 11:00 a.m. a 1:00 p.m.',
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
    codigoMatricula: '1021400315',
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
    fechaIngresoEstacion: '2026-10-20',
    fechaInicioTramite: '2026-10-08',
    ubicacionFisica: 'En poder del Jurado Evaluador (Falta firma de dictamen del Secretario)',
    esCuelloBotellaExterno: true,
    motivoRetrasoExterno: 'Demora externa en revisión de Jurado (33 días en Estación 3; SLA máximo: 21 días).',
    notasSecretaria: 'La Escuela entregó los 3 ejemplares físicos el 20/10. Presidente y Vocal ya dieron visto bueno; falta dictamen de un miembro del jurado para agendar jueves.',
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
    codigoMatricula: '1021400342',
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
    fechaIngresoEstacion: '2026-11-08',
    fechaInicioTramite: '2026-11-07',
    ubicacionFisica: 'Derivado a Decanato de Facultad de Ingeniería (Oficio N° 214-2026-EII)',
    esCuelloBotellaExterno: true,
    motivoRetrasoExterno: 'Retenido en Decanato de Facultad (14 días esperando firma de Resolución de Jurado; SLA: 7 días).',
    notasSecretaria: 'En Escuela se procesó en 24 horas (07/11) y se envió físico a Decanato el 08/11. El cuello de botella se encuentra en firma externa de Facultad.',
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
    codigoMatricula: '1021400418',
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
    fechaIngresoEstacion: '2026-11-21',
    fechaInicioTramite: '2026-11-21',
    ubicacionFisica: 'Mesa de Secretaría de Escuela (Srta. Celia)',
    esCuelloBotellaExterno: false,
    notasSecretaria: 'Presentó folder físico hoy. Falta adjuntar copia fedateada de Constancia de Prácticas Preprofesionales para derivar a Decanato.',
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
    tesistaCodigo: '1021400219',
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
    tesistaCodigo: '1021400315',
    tesistaCorreo: 'mquinones@unitru.edu.pe',
    tituloTesis: 'Implementación de la metodología Lean Manufacturing en el proceso de arándano para aumentar la productividad de la empresa Agrícola Cerro Prieto S.A.',
    asesor: 'Dr. Ing. Ángel Hernández Molina',
    juradoPresidente: 'Dr. Ing. José Manuel Castañeda Meléndez',
    juradoSecretario: 'Mg. Ing. Víctor Manuel Sirlopú Vera',
    juradoVocal: 'Dr. Ing. Ángel Hernández Molina',
    aulaOAuditorio: 'Auditorio de Ingeniería Industrial UNT',
    estado: 'Programada',
    observacion: 'Tentativa sujeta a entrega de última firma del Secretario de Jurado.'
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
