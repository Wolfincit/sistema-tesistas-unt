/**
 * Base de Conocimiento Oficial y Motor Predictivo de Dudas (Cero Invenciones)
 * Escuela Profesional de Ingeniería Industrial — Universidad Nacional de Trujillo.
 *
 * REGLA ESTRICTA: Toda la información contenida aquí proviene únicamente de:
 * - Guías Oficiales de la carpeta Drive de Procedimientos Virtuales de la Escuela
 *   (Guía N° 06 Colación, Guía N° 09 Proyecto, Guía N° 10 Jurado, Tasas Interbank, Cambio de Título).
 * - Indicaciones oficiales de la Secretaría de Escuela (Srta. Celia Chau — cchau@unitru.edu.pe).
 * - Portal oficial de trámites URA (tramites-uraa.unitru.edu.pe).
 * Si una pregunta no coincide con la base oficial ni con las FAQ aprobadas por la Srta. Celia,
 * el motor NO inventa respuestas: deriva la consulta a Secretaría una sola vez.
 */

import { EstacionLogisticaId, SeguimientoTesisItem } from './mockLogisticaSecretaria';
import { FaqItem } from '../types';

export const DRIVE_PROCEDIMIENTOS_URL =
  'https://drive.google.com/drive/folders/18YKeZlbUeDuhdnFWn8TpgbtatF6-hve5';
export const URA_PORTAL_URL = 'https://tramites-uraa.unitru.edu.pe/sign-in';
export const GUIA_JURADO_URL =
  'https://drive.google.com/file/d/132TLDEdbBulcduzKuHxcyOEM63PZ7hDi/view';
export const TASAS_INTERBANK_URL =
  'https://drive.google.com/file/d/1P85-Z6HTJK9HtBrUxTZpPxj6UkeGNKBV/view';
export const GUIA_CAMBIO_TITULO_URL =
  'https://drive.google.com/file/d/1RhrFx6Nm4c3MB7E-fOtRO71-cxLn4FIZ/view';

export interface OfficialKbEntry {
  id: string;
  categoria: string;
  pregunta: string;
  respuesta: string;
  palabrasClave: string[];
  fuenteOficial: string;
  linkTexto?: string;
  linkUrl?: string;
  etapasRelacionadas?: EstacionLogisticaId[];
}

export interface NextStepPrediction {
  titulo: string;
  resumen: string;
  acciones: string[];
  correoDestino?: string;
  costosOficiales?: string;
  linkTexto?: string;
  linkUrl?: string;
  fuenteOficial: string;
  preguntasSugeridasIds: string[];
}

export const OFFICIAL_KB_ENTRIES: OfficialKbEntry[] = [
  {
    id: 'kb-proyecto-asesor',
    categoria: 'Proyecto de Tesis',
    pregunta: '¿Cómo presento mi Proyecto de Tesis y solicito nombramiento de asesor?',
    respuesta:
      '1) Pagar en Interbank (Cód. 005-166-01): S/ 15.00 por nombramiento de asesor y S/ 30.00 por trámite de proyecto.\n2) Unir en 1 solo archivo PDF: FUT (Opción 34), vouchers de pago, Carta de Compromiso firmada por el asesor y el Proyecto de Tesis.\n3) Enviar el PDF de manera virtual a mesadepartes_ingenieria@unitru.edu.pe. Decanato filtra el expediente y lo deriva a la Escuela.',
    palabrasClave: [
      'proyecto', 'asesor', 'iniciar', 'empezar', 'opcion 34', 'fut 34', '15', '30',
      'carta de compromiso', 'mesa de partes', 'primer paso', 'pretesis'
    ],
    fuenteOficial: 'Guía N° 09 — Proyecto de Tesis y Nombramiento de Asesor',
    linkTexto: 'Abrir carpeta oficial de Formatos y FUT (Drive)',
    linkUrl: DRIVE_PROCEDIMIENTOS_URL,
    etapasRelacionadas: [1]
  },
  {
    id: 'kb-nombramiento-jurado',
    categoria: 'Jurado Evaluador',
    pregunta: '¿Cómo solicito el nombramiento de Jurado Evaluador para mi borrador de tesis?',
    respuesta:
      '1) Tu asesor debe pasar el 1er Turnitin al borrador terminado.\n2) Pagar en Interbank (Cód. 005-166-01): S/ 30.00 (trámite) y S/ 87.60 (Turnitin).\n3) Enviar 3 archivos PDF a mesadepartes_ingenieria@unitru.edu.pe:\n   • PDF 1: FUT (Opción 29) + requisitos.\n   • PDF 2: Borrador de tesis firmado por tu asesor.\n   • PDF 3: Voucher de S/ 87.60.\nDecanato emite la Resolución de Jurado y el jurado dispone de plazo de revisión (10 días).',
    palabrasClave: [
      'jurado', 'nombramiento', 'borrador', 'opcion 29', 'fut 29', '87.60', 'turnitin',
      'resolucion', 'cuanto cuesta', 'pago', 'interbank', '005-166-01'
    ],
    fuenteOficial: 'Guía N° 10 — Nombramiento de Jurado y Sustentación',
    linkTexto: 'Ver Guía N° 10 — Nombramiento de Jurado (PDF)',
    linkUrl: GUIA_JURADO_URL,
    etapasRelacionadas: [1, 2, 3]
  },
  {
    id: 'kb-dictamen-fisico',
    categoria: 'Sustentación',
    pregunta: '¿Qué documentos físicos debo llevar a Secretaría para agendar mi sustentación?',
    respuesta:
      'Cuando los jurados aprueban tu borrador, debes solicitar a la Escuela el Dictamen de Aprobación y llevarlo en FÍSICO firmado por los jurados (no sirve solo firma digital si los docentes no la usan), acompañado de las evidencias impresas de aprobación (capturas de correo o WhatsApp de cada jurado) y los 4 empastados/ejemplares para el jurado.\nPlazo obligatorio: entregar como mínimo 48 horas antes (de preferencia una semana antes) para que Secretaría agende el jueves y publique el flyer los días martes.',
    palabrasClave: [
      'dictamen', 'fisico', 'firmas', 'evidencias', '48 horas', 'cuando llevar', 'agendar',
      'reservar', 'empastados', 'ejemplares', 'martes', 'presencial'
    ],
    fuenteOficial: 'Secretaría de Escuela de Ing. Industrial (Srta. Celia)',
    linkTexto: 'Carpeta de Procedimientos Virtuales (Drive)',
    linkUrl: DRIVE_PROCEDIMIENTOS_URL,
    etapasRelacionadas: [3, 4]
  },
  {
    id: 'kb-horario-auditorio-costo',
    categoria: 'Sustentación',
    pregunta: '¿Qué días se sustenta, cuánto cuesta el auditorio y qué llevo el día de mi defensa?',
    respuesta:
      '• Días y horarios: Por acuerdo de docentes, las sustentaciones son los días JUEVES de 11:00 a.m. a 1:00 p.m. (turnos de 11:00 a.m. y 12:00 p.m.; en casos excepcionales hasta 3 el mismo jueves sin cruce de jurado).\n• Lugar: Auditorio de Ingeniería Industrial o Aula II-4.\n• Costo del auditorio: S/ 0.00 (ES TOTALMENTE GRATUITO; no se paga ningún derecho por uso del auditorio).\n• Qué llevar ese día: Asistir 1 hora antes, vestimenta formal y tus diapositivas listas (los empastados ya deben haberse entregado 48 horas antes).',
    palabrasClave: [
      'jueves', 'horario', 'hora', 'auditorio', 'aula ii-4', 'cuanto cuesta el auditorio',
      'pagar auditorio', 'gratis', 'diapositivas', 'ropa formal', 'que llevar', 'sustentar'
    ],
    fuenteOficial: 'Secretaría de Escuela de Ing. Industrial (Srta. Celia)',
    etapasRelacionadas: [3, 4]
  },
  {
    id: 'kb-cambio-titulo',
    categoria: 'Observaciones',
    pregunta: '¿Qué hago si mi jurado observa o pide cambiar el título de mi tesis?',
    respuesta:
      'NO puedes sustentar con un título distinto al de tu resolución vigente. Debes tramitar una nueva resolución de cambio de título enviando 1 solo PDF a mesadepartes_ingenieria@unitru.edu.pe con:\n• FUT solicitando cambio de título.\n• Recibo de pago de S/ 5.00 en Interbank (Cód. 005-166-01).\n• Carta del jurado justificando la modificación del título.\n• Proveído y resolución de nombramiento de jurado.\nFlujo interno: Mesa de Partes → Secretaría oficia al asesor → respuesta del asesor → oficio a Decanato → Decanato emite la nueva resolución por correo.',
    palabrasClave: [
      'cambio de titulo', 'cambiar titulo', 'modificar titulo', 'observo el titulo',
      '5 soles', 's/ 5', 'nueva resolucion', 'titulo diferente'
    ],
    fuenteOficial: 'Guía Oficial de Cambio de Título / Secretaría de Escuela',
    linkTexto: 'Ver Guía de Cambio de Título (PDF)',
    linkUrl: GUIA_CAMBIO_TITULO_URL,
    etapasRelacionadas: [2, 3, 4]
  },
  {
    id: 'kb-desaprobado-30-dias',
    categoria: 'Sustentación',
    pregunta: '¿Qué ocurre si el jurado observa en plena sustentación o desapruebo?',
    respuesta:
      '• Si el jurado detecta una observación pendiente antes de firmar el acta, puede pedir corregirla antes de suscribir el acta o reprogramar.\n• Si desapuebas la sustentación, tienes un plazo de 30 días calendario para prepararte, levantar observaciones y volver a coordinar con tu jurado para sustentar nuevamente con el mismo trabajo (no requiere papeleo adicional extra, solo volver a coordinar).\n• En tesis de dos integrantes, las preguntas son individuales: si un tesista aprueba y el otro desaprueba, quien aprobó continúa normal su trámite y quien desaprobó espera los 30 días.',
    palabrasClave: [
      'desapruebo', 'desaprobado', 'jalar', 'reprogramar', '30 dias', 'no aprueba',
      'dos tesistas', 'individual', 'observacion en sustentacion'
    ],
    fuenteOficial: 'Secretaría de Escuela de Ing. Industrial (Srta. Celia)',
    etapasRelacionadas: [4]
  },
  {
    id: 'kb-etica-turnitin-2',
    categoria: 'Post-Sustentación',
    pregunta: '¿Qué debo hacer inmediatamente después de aprobar mi sustentación? (Turnitin 2 y Comité de Ética)',
    respuesta:
      '1) Solicita a tu asesor que pase el 2do Turnitin a tu tesis final para que el sistema emita el "Recibo con Depósito" y el porcentaje.\n2) Ingresa al sistema del Comité de Ética de la Facultad de Ingeniería (el acceso es directo del tesista; Secretaría no tiene acceso).\n3) Regístrate y sube: tu tesis final, el reporte Turnitin con recibo de depósito, el voucher de S/ 87.60 por Turnitin y la Declaración Jurada firmada por tu asesor.\n4) El Comité de Ética responderá con tu Constancia de Originalidad (o te indicará si hay alguna observación por corregir antes del cierre de colación).',
    palabrasClave: [
      'despues de sustentar', 'comite de etica', 'etica', 'constancia de originalidad',
      'segundo turnitin', '2do turnitin', 'recibo con deposito', '87.60', 'declaracion jurada'
    ],
    fuenteOficial: 'Guía N° 06 — Colación Ordinaria / Secretaría de Escuela',
    linkTexto: 'Ver Formatos Oficiales en Drive',
    linkUrl: DRIVE_PROCEDIMIENTOS_URL,
    etapasRelacionadas: [4, 5]
  },
  {
    id: 'kb-repositorio-valerio',
    categoria: 'Repositorio UNT',
    pregunta: '¿Cómo subo mi tesis al Repositorio Institucional de la UNT para obtener el URL?',
    respuesta:
      'En paralelo a tu trámite, envía un correo al Ing. Valerio Ynfantes (administrador y director de la Biblioteca de la Facultad de Ingeniería, 3er piso del pabellón de Ingeniería) a vynfantes@unitru.edu.pe adjuntando tu tesis en PDF + los 4 documentos obligatorios:\n1) Carta de Autorización de publicación (formato oficial de la Escuela).\n2) Declaración Jurada (formato oficial).\n3) Acta de Aprobación de sustentación.\n4) Constancia de Originalidad del Comité de Ética.\nEl Ing. Valerio revisa el abstract, palabras clave y estructura, sube la tesis al Repositorio UNT y genera el enlace URL que Secretaría necesita para completar tu registro en URA.',
    palabrasClave: [
      'repositorio', 'url', 'valerio', 'vynfantes', 'biblioteca', 'carta de autorizacion',
      '4 anexos', 'constancia de repositorio', 'abstract', 'subir tesis'
    ],
    fuenteOficial: 'Guía N° 06 — Colación / Secretaría de Escuela',
    linkTexto: 'Descargar Carta de Autorización y Declaración Jurada (Drive)',
    linkUrl: DRIVE_PROCEDIMIENTOS_URL,
    etapasRelacionadas: [5, 6]
  },
  {
    id: 'kb-ura-colacion-titulo',
    categoria: 'Colación y URA',
    pregunta: '¿Cómo subo mi carpeta al Sistema URA y cuántos empastados finales entrego para mi Título?',
    respuesta:
      '1) Pagar en Interbank la tasa de carpeta de Título: S/ 275.90 (Cód. 005-166-17).\n2) Ingresar al portal oficial URA (tramites-uraa.unitru.edu.pe) y subir tu carpeta digital: foto reglamentaria, recibo de carpeta, diploma de bachiller (ambos lados legibles), DNI legible y Constancia de Originalidad.\n3) Secretaría valida y sube tu expedito y acta, luego pasa a Facultad (constancia de no adeudo y resolución), regresa a Secretaría para cargar fecha de ingreso/egreso, porcentaje Turnitin y URL del Repositorio, y pasa a URAA para impresión del diploma.\n4) Entregar 2 empastados finales (uno para la Hemeroteca de la Escuela y otro para la Biblioteca de la Facultad) y enviar el PDF final nombrado T004_DNI_T.pdf a cchau@unitru.edu.pe.',
    palabrasClave: [
      'ura', 'uraa', 'carpeta', 'colacion', '275.90', '005-166-17', 'diploma', 'titulo',
      'dos empastados', 't004', 'hemeroteca', 'sunedu', 'tramites-uraa', 'foto', 'dni'
    ],
    fuenteOficial: 'Guía N° 06 — Colación Ordinaria UNT',
    linkTexto: 'Ingresar al Portal URA (tramites-uraa.unitru.edu.pe)',
    linkUrl: URA_PORTAL_URL,
    etapasRelacionadas: [6, 7, 8]
  },
  {
    id: 'kb-bachiller-vs-titulado',
    categoria: 'Bachiller',
    pregunta: '¿El trámite de Bachiller (Graduado) es igual que el de Titulado?',
    respuesta:
      'NO, el trámite de Bachiller es mucho más rápido: NO pasa por el Comité de Ética ni por el Repositorio UNT.\nEl egresado de Bachiller ingresa directamente al sistema URA (tramites-uraa.unitru.edu.pe) y sube únicamente:\n• DNI legible.\n• Recibo de pago de carpeta (S/ 273).\n• Foto reglamentaria.\n• Constancia de idioma inglés.\nSe valida y tramita directo para la fecha de colación (incluso puede ingresarse hasta el cierre de colación, a diferencia del Título que requiere cerrar sustentación con anticipación).',
    palabrasClave: [
      'bachiller', 'graduado', 'grado', '273', 'ingles', 'sin tesis', 'diferencia bachiller'
    ],
    fuenteOficial: 'Secretaría de Escuela de Ing. Industrial (Srta. Celia)',
    linkTexto: 'Ingresar al Portal URA',
    linkUrl: URA_PORTAL_URL,
    etapasRelacionadas: [7, 8]
  },
  {
    id: 'kb-colaciones-fechas',
    categoria: 'Colación y URA',
    pregunta: '¿Cuántas colaciones hay al año y cuándo sale mi título en SUNEDU?',
    respuesta:
      '• En la UNT se realizan 3 colaciones al año. La más grande es la primera colación (en mayo, con cierre de carpetas alrededor de mediados de abril), donde ingresan los egresados de diciembre y verano.\n• Recuerda que si vas a titularte, debes respetar el plazo de corte fijado por la Escuela porque después de sustentar todavía debes pasar por Comité de Ética y Repositorio.\n• Después de la ceremonia de colación, Secretaría General de la UNT verifica los datos de cada egresado (~90 campos exigidos por SUNEDU) y realiza el registro oficial para que aparezca en SUNEDU en Línea.',
    palabrasClave: [
      'colaciones', 'cuantas colaciones', 'mayo', 'abril', 'fecha limite', 'plazo',
      'sunedu', 'secretaria general', 'cuando sale mi titulo', 'ceremonia'
    ],
    fuenteOficial: 'Secretaría de Escuela de Ing. Industrial (Srta. Celia)',
    etapasRelacionadas: [5, 6, 7, 8]
  },
  {
    id: 'kb-tasas-interbank',
    categoria: 'Pagos y Tasas',
    pregunta: '¿Cuáles son las tasas oficiales de Interbank para el trámite de tesis y título?',
    respuesta:
      'Tasas oficiales registradas en las guías de la Escuela (pago en Interbank):\n• Nombramiento de Asesor: S/ 15.00 (Cód. 005-166-01).\n• Trámite de Proyecto de Tesis: S/ 30.00 (Cód. 005-166-01).\n• Trámite de Nombramiento de Jurado: S/ 30.00 (Cód. 005-166-01).\n• Turnitin: S/ 87.60 (Cód. 005-166-01).\n• Cambio de Título (solo si aplica): S/ 5.00 (Cód. 005-166-01).\n• Carpeta de Título (Colación en URA): S/ 275.90 (Cód. 005-166-17).\n• Carpeta de Bachiller (URA): S/ 273.\n• Uso de Auditorio para sustentación: S/ 0.00 (Gratuito).',
    palabrasClave: [
      'tasas', 'pagos', 'cuanto se paga', 'precio', 'costo', 'interbank', 'codigo',
      '005-166-01', '005-166-17', 'voucher', 'recibo', 'tupa'
    ],
    fuenteOficial: 'Guías Oficiales N° 06, 09, 10 y Tasas Educativas Interbank',
    linkTexto: 'Ver cuadro oficial de Tasas Educativas Interbank',
    linkUrl: TASAS_INTERBANK_URL,
    etapasRelacionadas: [1, 2, 5, 7]
  },
  {
    id: 'kb-formatos-drive',
    categoria: 'Formatos',
    pregunta: '¿Dónde descargo el FUT, la Carta de Compromiso, el Reglamento y todos los formatos?',
    respuesta:
      'Todos los formatos vigentes (FUT, Carta de Compromiso del Asesor, Carta de Autorización de Repositorio, Declaración Jurada, Reglamento, Ruta de Trámites y Guías N° 06, 09 y 10) están centralizados en la carpeta oficial de Procedimientos Virtuales de la Escuela Profesional de Ingeniería Industrial.',
    palabrasClave: [
      'formatos', 'fut', 'descargar', 'drive', 'reglamento', 'ruta', 'plantilla',
      'documentos', 'procedimientos virtuales', 'donde encuentro'
    ],
    fuenteOficial: 'Carpeta Oficial de Procedimientos Virtuales — Ing. Industrial UNT',
    linkTexto: 'Abrir Carpeta Oficial de Procedimientos Virtuales',
    linkUrl: DRIVE_PROCEDIMIENTOS_URL,
    etapasRelacionadas: [1, 2, 3, 5, 6]
  },
  {
    id: 'kb-observaciones-ura',
    categoria: 'Colación y URA',
    pregunta: '¿Por qué motivos suelen observar mi carpeta en el Sistema URA?',
    respuesta:
      'Las observaciones más frecuentes en URA son fáciles de evitar revisando antes de subir:\n• Foto que no cumple formato o sale borrosa.\n• DNI poco legible.\n• Diploma de Bachiller escaneado solo por un lado (debe estar escaneado por AMBOS lados).\nSi tu carpeta es observada en URA, el propio portal URA te notifica para corregir y volver a subir.',
    palabrasClave: [
      'observada en ura', 'rechazaron', 'diploma ambos lados', 'foto', 'dni borroso',
      'corregir ura', 'observacion carpeta'
    ],
    fuenteOficial: 'Secretaría de Escuela de Ing. Industrial (Srta. Celia)',
    linkTexto: 'Revisar en Portal URA',
    linkUrl: URA_PORTAL_URL,
    etapasRelacionadas: [7]
  }
];

export function normalizarTextoKb(str: string): string {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a', 'en',
  'por', 'para', 'con', 'sin', 'que', 'como', 'cuando', 'donde', 'cual', 'cuales',
  'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'me', 'se', 'es', 'son', 'hay', 'tengo',
  'puedo', 'debo', 'hacer', 'hola', 'buenos', 'dias', 'tardes', 'senora', 'celia',
  'porfavor', 'favor', 'gracias', 'quiero', 'saber', 'sobre', 'tesis', 'tramite'
]);

const SINONIMOS_COMUNES: Record<string, string[]> = {
  pago: ['tasas', 'interbank', 'voucher', 'costo'],
  pagar: ['tasas', 'interbank', 'voucher', 'costo'],
  pagos: ['tasas', 'interbank', 'voucher', 'costo'],
  precio: ['tasas', 'interbank', 'costo'],
  cuanto: ['tasas', 'interbank', 'costo', 'auditorio'],
  banco: ['interbank', 'tasas', 'codigo'],
  dinero: ['tasas', 'interbank'],
  plata: ['tasas', 'interbank'],
  recibo: ['voucher', 'tasas', 'interbank'],
  voucher: ['tasas', 'interbank', 'recibo'],
  jale: ['desaprobado', '30 dias'],
  jalar: ['desaprobado', '30 dias'],
  reprobe: ['desaprobado', '30 dias'],
  desaprobe: ['desaprobado', '30 dias'],
  cambiar: ['cambio de titulo', 'nueva resolucion'],
  modificar: ['cambio de titulo', 'nueva resolucion'],
  plagio: ['turnitin', 'etica', 'originalidad'],
  similitud: ['turnitin', 'etica', 'originalidad'],
  subir: ['repositorio', 'ura', 'carpeta'],
  biblioteca: ['repositorio', 'valerio', 'empastados'],
  valerio: ['repositorio', 'url'],
  url: ['repositorio', 'valerio'],
  enlace: ['repositorio', 'valerio', 'drive'],
  link: ['repositorio', 'drive', 'ura'],
  diploma: ['ura', 'colacion', 'sunedu', 'bachiller'],
  graduacion: ['colacion', 'ceremonia', 'ura'],
  empastado: ['empastados', 'dictamen', 'biblioteca'],
  anillado: ['borrador', 'empastados', 'dictamen'],
  hora: ['horario', 'jueves', 'auditorio'],
  salon: ['auditorio', 'aula'],
  aula: ['auditorio', 'jueves'],
  empezar: ['proyecto', 'asesor', 'paso 1'],
  inicio: ['proyecto', 'asesor', 'fut'],
  formato: ['formatos', 'fut', 'drive'],
  plantilla: ['formatos', 'fut', 'drive'],
  ingles: ['bachiller', '273'],
  certificado: ['constancia', 'originalidad', 'ingles']
};

export interface KbSearchResult {
  encontrado: boolean;
  resultados: OfficialKbEntry[];
}

export function buscarEnBaseOficial(consulta: string, faqsDinamicas: FaqItem[] = []): KbSearchResult {
  const qNorm = normalizarTextoKb(consulta);
  if (qNorm.length < 2) {
    return { encontrado: false, resultados: [] };
  }

  const rawTokens = qNorm
    .split(' ')
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));

  // Expandir palabras comunes del estudiante con sinónimos oficiales para orientar mejor
  const tokensExpandidos = new Set<string>(rawTokens);
  for (const t of rawTokens) {
    for (const [clave, syns] of Object.entries(SINONIMOS_COMUNES)) {
      if (t === clave || (t.length >= 4 && clave.startsWith(t.slice(0, 4)))) {
        syns.forEach((s) => tokensExpandidos.add(s));
      }
    }
  }
  const tokens = Array.from(tokensExpandidos);

  // Unir base oficial fija + respuestas aprobadas por la Srta. Celia en FAQs (incluyendo su enlace de Drive)
  const faqsAsEntries: OfficialKbEntry[] = faqsDinamicas.map((f) => ({
    id: f.id,
    categoria: f.categoria || 'Respuesta Oficial Secretaría',
    pregunta: f.pregunta,
    respuesta: f.respuesta,
    palabrasClave: normalizarTextoKb(`${f.pregunta} ${f.categoria || ''}`).split(' ').filter((w) => w.length >= 3),
    fuenteOficial: `Respuesta Oficial aprobada por Secretaría (${f.fechaActualizacion || 'Vigente'})`,
    linkUrl: f.linkUrl,
    linkTexto: f.linkTexto || (f.linkUrl ? 'Abrir Guía / Formato en Drive' : undefined)
  }));

  const universo = [...faqsAsEntries, ...OFFICIAL_KB_ENTRIES];

  const scored = universo
    .map((entry) => {
      let score = 0;
      const pregNorm = normalizarTextoKb(entry.pregunta);
      const respNorm = normalizarTextoKb(entry.respuesta);

      // Coincidencia de frase completa o palabras clave exactas
      for (const kw of entry.palabrasClave) {
        const kwNorm = normalizarTextoKb(kw);
        if (kwNorm.length >= 3 && qNorm.includes(kwNorm)) {
          score += kwNorm.includes(' ') ? 10 : 6;
        }
      }

      for (const tok of tokens) {
        if (pregNorm.includes(tok)) score += 4;
        if (respNorm.includes(tok)) score += 2;
      }

      return { entry, score };
    })
    .filter((x) => x.score >= 6)
    .sort((a, b) => b.score - a.score);

  // Deduplicar preguntas muy parecidas
  const unicos: OfficialKbEntry[] = [];
  const vistos = new Set<string>();
  for (const s of scored) {
    const k = normalizarTextoKb(s.entry.pregunta).slice(0, 45);
    if (!vistos.has(k)) {
      vistos.add(k);
      unicos.push(s.entry);
    }
    if (unicos.length >= 3) break;
  }

  return {
    encontrado: unicos.length > 0,
    resultados: unicos
  };
}

export function predecirSiguientePasoOficial(item: SeguimientoTesisItem): NextStepPrediction {
  // Caso especial 1: Cambio de título activo
  if (item.cambioTituloActivo) {
    return {
      titulo: 'Atención: Trámite obligatorio de Cambio de Título antes de sustentar',
      resumen:
        'Tu resolución actual figura con otro título. Debes completar el trámite formal antes de programar tu sustentación.',
      acciones: [
        'Pagar S/ 5.00 en Interbank (Cód. 005-166-01).',
        'Unir en 1 solo PDF: FUT + recibo S/ 5.00 + carta del jurado justificando el cambio + proveído + resolución de jurado.',
        'Enviar el PDF a mesadepartes_ingenieria@unitru.edu.pe y esperar la nueva resolución del Decanato.'
      ],
      correoDestino: 'mesadepartes_ingenieria@unitru.edu.pe',
      costosOficiales: 'S/ 5.00 (Interbank Cód. 005-166-01)',
      linkTexto: 'Ver Guía Oficial de Cambio de Título',
      linkUrl: GUIA_CAMBIO_TITULO_URL,
      fuenteOficial: 'Guía Oficial de Cambio de Título / Secretaría de Escuela',
      preguntasSugeridasIds: ['kb-cambio-titulo', 'kb-dictamen-fisico']
    };
  }

  // Caso especial 2: Desaprobado — plazo de 30 días calendario
  if (item.desaprobadoFecha) {
    const fechaBase = new Date(`${item.desaprobadoFecha}T12:00:00`);
    const fechaHabil = new Date(fechaBase.getTime() + 30 * 24 * 3600 * 1000);
    const fechaHabilStr = isNaN(fechaHabil.getTime())
      ? '30 días después de tu sustentación'
      : fechaHabil.toISOString().slice(0, 10);

    return {
      titulo: `Plazo de reprogramación (30 días): habilitado desde el ${fechaHabilStr}`,
      resumen:
        'Dispones de 30 días calendario para prepararte y levantar observaciones con el mismo trabajo antes de volver a sustentar.',
      acciones: [
        'No requieres papeleo adicional nuevo; trabaja sobre la misma tesis.',
        `A partir del ${fechaHabilStr}, vuelve a coordinar fecha con tu jurado y avisa a Secretaría con al menos 48 horas de anticipación (ideal 1 semana).`
      ],
      fuenteOficial: 'Secretaría de Escuela de Ing. Industrial (Srta. Celia)',
      preguntasSugeridasIds: ['kb-desaprobado-30-dias', 'kb-horario-auditorio-costo']
    };
  }

  // Caso especial 3: Bachiller (ruta rápida sin Comité de Ética ni Repositorio)
  if (item.tipoTramite === 'bachiller') {
    return {
      titulo: 'Ruta Rápida de Bachiller (Graduado) — Directo al Sistema URA',
      resumen:
        'El trámite de Bachiller NO pasa por Comité de Ética ni Repositorio UNT. Sube tu carpeta directo al portal URA.',
      acciones: [
        'Pagar recibo de carpeta de Bachiller (S/ 273).',
        'Ingresar a tramites-uraa.unitru.edu.pe y subir: DNI legible, recibo de pago, foto reglamentaria y constancia de inglés.',
        'Secretaría valida tu carpeta en el mismo sistema URA para la próxima colación.'
      ],
      costosOficiales: 'S/ 273 (Carpeta de Bachiller)',
      linkTexto: 'Ingresar al Sistema URA',
      linkUrl: URA_PORTAL_URL,
      fuenteOficial: 'Secretaría de Escuela de Ing. Industrial (Srta. Celia)',
      preguntasSugeridasIds: ['kb-bachiller-vs-titulado', 'kb-observaciones-ura', 'kb-colaciones-fechas']
    };
  }

  // Flujo normal Titulado por cada una de las 8 estaciones oficiales
  switch (item.estacionActual) {
    case 1:
      return {
        titulo: 'Siguiente paso: Derivación a Decanato para Resolución de Jurado',
        resumen:
          'Tu expediente fue recibido en Secretaría. Una vez emitido el proveído, pasa a Decanato para emitir la Resolución de Jurado.',
        acciones: [
          'Verifica que enviaste los 3 PDFs completos a mesadepartes_ingenieria@unitru.edu.pe (FUT Opción 29, borrador firmado por asesor y voucher S/ 87.60).',
          'Activa las notificaciones en tu celular para enterarte en cuanto pase a Decanato sin tener que escribir.'
        ],
        correoDestino: 'mesadepartes_ingenieria@unitru.edu.pe',
        costosOficiales: 'S/ 30.00 (trámite) + S/ 87.60 (Turnitin) — Cód. 005-166-01',
        linkTexto: 'Ver Guía N° 10 (Nombramiento de Jurado)',
        linkUrl: GUIA_JURADO_URL,
        fuenteOficial: 'Guía N° 10 — Nombramiento de Jurado',
        preguntasSugeridasIds: ['kb-nombramiento-jurado', 'kb-tasas-interbank', 'kb-formatos-drive']
      };
    case 2:
      return {
        titulo: 'Siguiente paso: Espera de Resolución Decanal y entrega a Jurados',
        resumen:
          'Tu trámite está en Decanato de la Facultad de Ingeniería para la firma de la Resolución que designa a tu Jurado Evaluador.',
        acciones: [
          'La resolución llega por correo desde la Facultad (Secretaría te mantiene copiado).',
          'Si tu jurado observa el título más adelante, recuerda tramitar Cambio de Título antes de sustentar.'
        ],
        linkTexto: 'Formatos Oficiales (Drive)',
        linkUrl: DRIVE_PROCEDIMIENTOS_URL,
        fuenteOficial: 'Guía N° 10 / Secretaría de Escuela',
        preguntasSugeridasIds: ['kb-nombramiento-jurado', 'kb-cambio-titulo', 'kb-dictamen-fisico']
      };
    case 3:
      return {
        titulo: 'Siguiente paso: Recoger firmas físicas del Dictamen y entregar 48 h antes',
        resumen:
          'Tu borrador está en revisión del Jurado Evaluador (plazo 10 días). Al tener su visto bueno, lleva tu Dictamen físico a Secretaría.',
        acciones: [
          'Solicita el formato de Dictamen de Aprobación a la Escuela y hazlo firmar en físico por los jurados.',
          'Imprime las evidencias de aprobación (correo o WhatsApp de cada jurado).',
          'Entrega el Dictamen firmado + evidencias + 4 empastados en Secretaría mínimo 48 horas antes (ideal 1 semana antes).'
        ],
        costosOficiales: 'Auditorio gratuito (S/ 0.00)',
        linkTexto: 'Carpeta de Procedimientos Virtuales (Drive)',
        linkUrl: DRIVE_PROCEDIMIENTOS_URL,
        fuenteOficial: 'Secretaría de Escuela (Srta. Celia)',
        preguntasSugeridasIds: ['kb-dictamen-fisico', 'kb-horario-auditorio-costo', 'kb-cambio-titulo']
      };
    case 4:
      return {
        titulo: '¡Estás listo para sustentar este Jueves! (y prepara tu paso siguiente)',
        resumen:
          'Tu sustentación está programada en turno de jueves (11:00 a.m. - 1:00 p.m.).',
        acciones: [
          'Llega 1 hora antes al Auditorio de Ing. Industrial (o Aula II-4) con vestimenta formal y diapositivas listas.',
          'Confirma que ya entregaste los 4 empastados 48 h antes en Secretaría.',
          'Apenas apruebes, solicita a tu asesor el 2do Turnitin con recibo de depósito para pasar al Comité de Ética.'
        ],
        costosOficiales: 'Auditorio gratuito (S/ 0.00)',
        fuenteOficial: 'Secretaría de Escuela (Srta. Celia)',
        preguntasSugeridasIds: ['kb-horario-auditorio-costo', 'kb-etica-turnitin-2', 'kb-desaprobado-30-dias']
      };
    case 5:
      return {
        titulo: 'Siguiente paso: 2do Turnitin y Comité de Ética (Constancia de Originalidad)',
        resumen:
          'Ya sustentaste. Ahora debes tramitar tu Constancia de Originalidad directamente en el sistema del Comité de Ética de la Facultad.',
        acciones: [
          'Pide a tu asesor pasar el 2do Turnitin y entregarte el Recibo con Depósito.',
          'Sube al sistema del Comité de Ética: tu tesis final, el Turnitin con recibo de depósito, el voucher de S/ 87.60 y la Declaración Jurada firmada por tu asesor.',
          'Espera tu Constancia de Originalidad (revisa el sistema por si te observan algo antes del cierre de colación).'
        ],
        costosOficiales: 'S/ 87.60 (Voucher Turnitin)',
        linkTexto: 'Descargar Declaración Jurada y Formatos (Drive)',
        linkUrl: DRIVE_PROCEDIMIENTOS_URL,
        fuenteOficial: 'Guía N° 06 — Colación / Secretaría de Escuela',
        preguntasSugeridasIds: ['kb-etica-turnitin-2', 'kb-repositorio-valerio', 'kb-colaciones-fechas']
      };
    case 6:
      return {
        titulo: 'Siguiente paso: Enviar tesis + 4 anexos al Ing. Valerio para URL del Repositorio',
        resumen:
          'Con tu Constancia de Originalidad lista, solicita la publicación en el Repositorio UNT para obtener tu enlace URL oficial.',
        acciones: [
          'Reúne tu PDF de tesis + 4 documentos: (1) Carta de Autorización, (2) Declaración Jurada, (3) Acta de Aprobación y (4) Constancia de Originalidad.',
          'Envía todo a vynfantes@unitru.edu.pe (Ing. Valerio Ynfantes — 3er piso Biblioteca de Ingeniería).',
          'Al recibir el URL del Repositorio, Secretaría lo cargará en el paso final de URA.'
        ],
        correoDestino: 'vynfantes@unitru.edu.pe',
        linkTexto: 'Descargar Carta de Autorización y Declaración Jurada (Drive)',
        linkUrl: DRIVE_PROCEDIMIENTOS_URL,
        fuenteOficial: 'Guía N° 06 — Colación / Secretaría de Escuela',
        preguntasSugeridasIds: ['kb-repositorio-valerio', 'kb-ura-colacion-titulo', 'kb-colaciones-fechas']
      };
    case 7:
      return {
        titulo: 'Siguiente paso: Subir carpeta al Sistema URA y entregar 2 empastados finales',
        resumen:
          'Última etapa antes de colación: completa tu carpeta digital en URA y entrega tus 2 empastados finales.',
        acciones: [
          'Pagar S/ 275.90 en Interbank (Cód. 005-166-17).',
          'Subir en tramites-uraa.unitru.edu.pe: foto, recibo de carpeta, diploma de bachiller (AMBOS lados), DNI legible y Constancia de Originalidad.',
          'Entregar 2 empastados finales (Hemeroteca de Escuela y Biblioteca de Facultad) y enviar el PDF final (T004_DNI_T.pdf) a cchau@unitru.edu.pe.'
        ],
        correoDestino: 'cchau@unitru.edu.pe',
        costosOficiales: 'S/ 275.90 (Interbank Cód. 005-166-17)',
        linkTexto: 'Ingresar al Portal URA (tramites-uraa.unitru.edu.pe)',
        linkUrl: URA_PORTAL_URL,
        fuenteOficial: 'Guía N° 06 — Colación Ordinaria UNT',
        preguntasSugeridasIds: ['kb-ura-colacion-titulo', 'kb-observaciones-ura', 'kb-colaciones-fechas']
      };
    case 8:
    default:
      return {
        titulo: '¡Trámite completado! Apto para Ceremonia de Colación y Registro SUNEDU',
        resumen:
          'Tu carpeta ya completó Escuela, Facultad y URAA. Solo espera la fecha de tu ceremonia de colación.',
        acciones: [
          'Asiste a la ceremonia de colación en la fecha publicada por la UNT.',
          'Luego de la colación, Secretaría General de la UNT realiza la verificación y el registro ante SUNEDU en Línea.'
        ],
        fuenteOficial: 'Secretaría de Escuela de Ing. Industrial (Srta. Celia)',
        preguntasSugeridasIds: ['kb-colaciones-fechas', 'kb-ura-colacion-titulo']
      };
  }
}

export function calcularDiasEnEstacion(fechaIso: string): number {
  if (!fechaIso) return 0;
  const start = new Date(`${fechaIso}T00:00:00`);
  if (isNaN(start.getTime())) return 0;
  const diff = Math.floor((Date.now() - start.getTime()) / (24 * 3600 * 1000));
  return Math.max(0, diff);
}

export function calcularDiasRestantesDesaprobado(desaprobadoFecha?: string): number | null {
  if (!desaprobadoFecha) return null;
  const base = new Date(`${desaprobadoFecha}T00:00:00`);
  if (isNaN(base.getTime())) return null;
  const habil = base.getTime() + 30 * 24 * 3600 * 1000;
  return Math.ceil((habil - Date.now()) / (24 * 3600 * 1000));
}
