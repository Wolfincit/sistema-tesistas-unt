export type UserRole = 'tesista' | 'secretaria';

export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  codigoMatricula?: string;
  departamento: string;
  facultad: string;
}

export type AreaIngenieria =
  | 'Logística y Cadena de Suministro'
  | 'Gestión de la Calidad'
  | 'Producción y Operaciones'
  | 'Seguridad y Salud Ocupacional'
  | 'Gestión de Proyectos';

export type UniversidadId =
  | 'UNT'
  | 'PUCP'
  | 'UNMSM'
  | 'UNI'
  | 'ULIMA'
  | 'UPC'
  | 'UNSA'
  | 'USIL'
  | 'UPN';

export type UniversidadOrigen =
  | 'Universidad Nacional de Trujillo'
  | 'Pontificia Universidad Católica del Perú'
  | 'Universidad Nacional Mayor de San Marcos'
  | 'Universidad Nacional de Ingeniería'
  | 'Universidad de Lima'
  | 'Universidad Peruana de Ciencias Aplicadas'
  | 'Universidad Nacional de San Agustín de Arequipa'
  | 'Universidad San Ignacio de Loyola'
  | 'Universidad Privada del Norte'
  | string;

export interface UniversidadRankingInfo {
  id: UniversidadId;
  sigla: string;
  nombre: string;
  rankingLabel: string;
  fija: boolean;
  repositorioBase: string;
  totalEstimado: string;
}

export interface TesisItem {
  id: string;
  titulo: string;
  autor: string;
  asesor: string;
  anio: number;
  area: AreaIngenieria;
  resumen: string;
  palabrasClave: string[];
  urlRepositorio: string;
  urlPdf?: string;
  pesoPdf?: string;
  universidad: UniversidadOrigen;
  universidadId?: UniversidadId;
  handleUri: string;
  vistas?: number;
  descargas?: number;
  licencia?: string;
  enVivo?: boolean;
  enVivoQuery?: string;
  tipoDocumento?: 'Tesis' | 'Artículo Científico';
}

export type TimeSlot =
  | '08:00 - 10:00'
  | '10:30 - 12:30'
  | '15:00 - 17:00'
  | '17:30 - 19:30'
  | string;

export type SlotEstado = 'disponible' | 'pre-reserva' | 'confirmada' | 'rechazada';

export interface ReservaAuditorio {
  id: string;
  fecha: string; // YYYY-MM-DD
  horario: TimeSlot;
  estado: SlotEstado;
  tesistaId: string;
  tesistaNombre: string;
  codigoMatricula: string;
  tituloTesis: string;
  asesor: string;
  fechaSolicitud: string;
  comentarioAdmin?: string;
}

export interface BloqueoFecha {
  fecha: string; // YYYY-MM-DD
  motivo: string;
  bloqueadoPor: string;
  fechaRegistro: string;
}

export type TipoDocumentoId =
  | 'fut'
  | 'egresado'
  | 'turnitin'
  | 'resolucion'
  | 'no_adeudo';

export type DocumentoEstado = 'Pendiente' | 'En revisión' | 'Observado' | 'Aprobado';

export interface DocumentoRequerido {
  id: TipoDocumentoId;
  nombre: string;
  descripcion: string;
  requerido: boolean;
  orden: number;
}

export interface DocumentoExpediente {
  id: string;
  tesistaId: string;
  tesistaNombre: string;
  tesistaCodigo: string;
  tipoId: TipoDocumentoId;
  nombreDocumento: string;
  nombreArchivo?: string;
  archivoTamano?: string;
  fechaSubida?: string;
  estado: DocumentoEstado;
  observacion?: string;
  fechaRevision?: string;
  revisadoPor?: string;
}

export interface KpiData {
  porcentajeOcupacionMes: number;
  totalReservasMes: number;
  cuposTotalesMes: number;
  leadTimePromedioDias: number;
  expedientesAprobados: number;
  expedientesObservados: number;
  tasaObservacionesPorTipo: {
    tipoId: TipoDocumentoId;
    nombre: string;
    totalEnviados: number;
    observados: number;
    porcentaje: number;
  }[];
}

export interface FormatoInstitucional {
  id: string;
  nombre: string;
  descripcion: string;
  formato: 'PDF' | 'DOCX' | 'XLSX';
  archivoNombre: string;
  peso: string;
  tipo: string;
  fechaSubida: string;
  subidoPor: string;
}

export interface MensajeTicketSeguimiento {
  id: string;
  remitente: 'tesista' | 'secretaria';
  autor: string;
  fecha: string;
  mensajeTexto: string;
  audioUrl?: string;
  audioDuracion?: string;
}

export interface ConsultaTesista {
  id: string;
  tesistaId: string;
  tesistaNombre: string;
  tesistaCodigo: string;
  asunto: string;
  mensaje: string;
  fechaEnvio: string;
  estado: 'Pendiente' | 'Resuelta' | 'Reabierta' | 'Cerrada';
  respuestaTexto?: string;
  respuestaAudioUrl?: string;
  respuestaAudioDuracion?: string;
  fechaRespuesta?: string;
  respondidoPor?: string;
  conformidadTesista?: 'conforme' | 'no_conforme' | 'pendiente_confirmacion';
  intentosReapertura?: number; // Contador de intentos (máximo 2)
  repreguntaTexto?: string;
  fechaRepregunta?: string;
  mensajesSeguimiento?: MensajeTicketSeguimiento[];
}

export interface CorreoAutorizado {
  id: string;
  correo: string;
  nombreGraduando: string;
  codigoMatricula: string;
  promocion: string;
  fechaHabilitacion: string;
  activo: boolean;
  password?: string;
  passwordCambiada?: boolean;
}

export interface ComunicadoGeneral {
  id: string;
  titulo: string;
  mensaje: string;
  audioUrl?: string;
  audioDuracion?: string;
  fecha: string;
  autor: string;
  leido?: boolean;
}

export interface FaqItem {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria?: string;
  fechaActualizacion: string;
}
