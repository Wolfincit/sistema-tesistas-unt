import { ModalidadTrabajoId } from '../data/mockLogisticaSecretaria';

export interface PlantillaMensajeInput {
  modalidad: ModalidadTrabajoId; // 'tesis' | 'suficiencia'
  esReprogramacion?: boolean;
  tesistaNombre: string;
  tesista2Nombre?: string;
  tituloTesis: string;
  fechaIso: string; // YYYY-MM-DD
  horaTexto: string; // ej. '11:00 a. m.' o '12:00 p. m.'
  lugar: string;
  jurado1: string;
  jurado2: string;
  jurado3: string;
  asesor: string;
  directorNombre?: string;
  directorCargo?: string;
  secretariaNombre?: string;
}

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export function formatearFechaLargaEs(fechaIso: string): { minuscula: string; capitalizada: string } {
  const clean = String(fechaIso || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return { minuscula: clean || 'jueves por definir', capitalizada: clean || 'Jueves por definir' };
  }
  const [y, m, d] = clean.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const diaSem = DIAS_SEMANA[dt.getDay()] || 'jueves';
  const mes = MESES_ES[m - 1] || '';
  const minuscula = `${diaSem} ${d} de ${mes} de ${y}`;
  const capitalizada = `${diaSem.charAt(0).toUpperCase()}${diaSem.slice(1)} ${d} de ${mes} de ${y}`;
  return { minuscula, capitalizada };
}

export function normalizarHoraOficial(horaRaw: string): string {
  const raw = String(horaRaw || '11:00 a. m.').trim();
  if (/a\.\s*m\.|p\.\s*m\./i.test(raw)) {
    return raw
      .replace(/a\.?\s*m\.?/i, 'a. m.')
      .replace(/p\.?\s*m\.?/i, 'p. m.')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return raw;
}

/** Calcula la hora exacta 1 hora antes para indicar puntualidad en el correo al tesista (ej. 11:00 a. m. -> 10:00 a. m.) */
export function calcularHoraUnaHoraAntes(horaRaw: string): string {
  const m = String(horaRaw || '').match(/(\d{1,2})\s*:\s*(\d{2})\s*(a|p)?/i);
  if (!m) return '1 hora antes';
  let h = parseInt(m[1], 10);
  const min = m[2];
  const suf = (m[3] || '').toLowerCase();

  let h24 = h;
  if (suf === 'p' && h < 12) h24 = h + 12;
  if (suf === 'a' && h === 12) h24 = 0;

  const prev24 = (h24 + 23) % 24;
  const esPm = prev24 >= 12;
  const h12 = prev24 % 12 === 0 ? 12 : prev24 % 12;
  return `${h12}:${min} ${esPm ? 'p. m.' : 'a. m.'}`;
}

/**
 * Extrae un primer nombre natural para el saludo ("¡Hola, Deysi y Jordy!" o "¡Hola, Jessica!").
 * Soporta formatos peruanos habituales ("APELLIDO1 APELLIDO2 NOMBRE1 NOMBRE2" o "Nombre Apellido").
 */
function extraerPrimerNombreSaludo(nombreCompleto: string): string {
  const limpio = String(nombreCompleto || '').trim().replace(/\s+/g, ' ');
  if (!limpio) return 'Bachiller';
  const partes = limpio.split(' ');
  // Si viene en MAYÚSCULAS estilo padrón UNT (ej. "BARRERA ROSAS DEYSI KATHERIN"), el 3er token suele ser el nombre
  const todoMayus = limpio === limpio.toUpperCase() && partes.length >= 3;
  const elegido = todoMayus ? partes[2] : partes[0];
  return elegido.charAt(0).toUpperCase() + elegido.slice(1).toLowerCase();
}

function formatearNombresBachilleres(t1: string, t2?: string): {
  esPareja: boolean;
  nombresMayus: string;
  saludoNombres: string;
} {
  const n1 = String(t1 || '').trim();
  const n2 = String(t2 || '').trim();
  const esPareja = Boolean(n2);
  if (esPareja) {
    return {
      esPareja: true,
      nombresMayus: `${n1.toUpperCase()} y ${n2.toUpperCase()}`,
      saludoNombres: `${extraerPrimerNombreSaludo(n1)} y ${extraerPrimerNombreSaludo(n2)}`
    };
  }
  return {
    esPareja: false,
    nombresMayus: n1.toUpperCase(),
    saludoNombres: extraerPrimerNombreSaludo(n1)
  };
}

function formatearLugarConArticulo(lugarRaw: string): string {
  const clean = (lugarRaw || 'Auditorio de la Escuela de Ingeniería Industrial').trim();
  if (/^(el|la|los|las)\s+/i.test(clean)) return clean;
  if (/^sala\b|^oficina\b/i.test(clean)) return `la ${clean}`;
  return `el ${clean}`;
}

/**
 * PASO 2 — Correo oficial exacto para los JURADOS (Ingenieros).
 * Soporta Trabajo de Tesis y Trabajo de Suficiencia Profesional (1 o 2 bachilleres).
 */
export function generarCorreoJuradosOficial(input: PlantillaMensajeInput): {
  asunto: string;
  mensaje: string;
} {
  const esSuficiencia = input.modalidad === 'suficiencia';
  const { esPareja, nombresMayus } = formatearNombresBachilleres(
    input.tesistaNombre,
    input.tesista2Nombre
  );
  const { minuscula: fechaLarga } = formatearFechaLargaEs(input.fechaIso);
  const hora = normalizarHoraOficial(input.horaTexto);
  const lugarConArt = formatearLugarConArticulo(input.lugar);
  const titulo = (input.tituloTesis || '').trim().toUpperCase();

  const docentesLista = [input.jurado1, input.jurado2, input.jurado3, input.asesor]
    .map((d) => String(d || '').trim())
    .filter(Boolean);

  const modalidadEtiqueta = esSuficiencia
    ? 'Trabajo de Suficiencia Profesional'
    : 'Trabajo de Tesis';

  const bachillerEtiqueta = esPareja
    ? `los Bachilleres ${nombresMayus}`
    : `el/la Bachiller ${nombresMayus}`;

  const docEmpastado = esSuficiencia
    ? 'Trabajo de Suficiencia Profesional empastado'
    : 'Tesis empastada';

  const actasSustentacion = esSuficiencia
    ? 'Actas de sustentación'
    : 'Actas de sustentación de tesis';

  const introTitulo = esSuficiencia ? 'El trabajo se titula' : 'La tesis se titula';
  const firmaSecretaria = (input.secretariaNombre || 'Celia Chau Muñoz').trim();
  const prefijoAsunto = input.esReprogramacion ? 'Reprogramación de Sustentación de' : 'Invitación a Sustentación de';

  const asunto = `${prefijoAsunto} ${modalidadEtiqueta} — ${nombresMayus} (${fechaLarga})`;

  const mensaje = `Estimados Ingenieros:
${docentesLista.join('\n')}
Docentes del Departamento Académico de Ingeniería Industrial.

Reciban un cordial saludo. Por medio del presente, se les adjunta la invitación para el proceso de evaluación de la sustentación del ${modalidadEtiqueta} de ${bachillerEtiqueta}, en calidad de Miembros del Jurado Dictaminador.

${introTitulo}: “${titulo}” La sustentación se realizará el ${fechaLarga}, a las ${hora}, en ${lugarConArt}.

Documentación Adjunta:
• ${docEmpastado}
• Hojas de calificación
• ${actasSustentacion}
• Acta de aprobación

Proceso de Entrega y Firmas:
• Entrega física: Los documentos se le entregarán en físico al Presidente del jurado, quien se encargará de hacerlos llegar a los demás miembros para que consignen su firma y la nota correspondiente.
• Devolución: Una vez firmados, los tres juegos completos de la documentación deberán ser alcanzados a la Dirección de Escuela.
• Soporte técnico: El apoyo técnico de la documentación y el auditorio estará a cargo del Personal de Cómputo, el Ms. Elmo Cruzado Oliva.

Saludos cordiales,
${firmaSecretaria}
Secretaria de Escuela`;

  return { asunto, mensaje };
}

/**
 * PASO 3 — Correo oficial exacto para los TESISTAS (Bachilleres).
 * Soporta Trabajo de Tesis y Trabajo de Suficiencia Profesional (1 o 2 bachilleres).
 */
export function generarCorreoTesistasOficial(input: PlantillaMensajeInput): {
  asunto: string;
  mensaje: string;
} {
  const esSuficiencia = input.modalidad === 'suficiencia';
  const { esPareja, nombresMayus, saludoNombres } = formatearNombresBachilleres(
    input.tesistaNombre,
    input.tesista2Nombre
  );
  const { minuscula: fechaLarga } = formatearFechaLargaEs(input.fechaIso);
  const hora = normalizarHoraOficial(input.horaTexto);
  const horaLlegada = calcularHoraUnaHoraAntes(hora);
  const lugarConArt = formatearLugarConArticulo(input.lugar);
  const titulo = (input.tituloTesis || '').trim().toUpperCase();

  const modalidadEtiqueta = esSuficiencia
    ? 'Trabajo de Suficiencia Profesional'
    : 'Trabajo de Tesis';

  const prefijoAsunto = input.esReprogramacion ? 'Reprogramación de Sustentación de' : 'Programación de Sustentación de';
  const asunto = `${prefijoAsunto} ${modalidadEtiqueta} — ${nombresMayus} (${fechaLarga})`;

  const lineaIntro = esPareja
    ? esSuficiencia
      ? `Su sustentación del Trabajo de Suficiencia Profesional, titulado “${titulo}”, está programada para el ${fechaLarga}, a las ${hora}, en ${lugarConArt}.`
      : `Su sustentación de tesis, titulada “${titulo}”, está programada para el ${fechaLarga}, a las ${hora}, en ${lugarConArt}.`
    : esSuficiencia
      ? `Tu sustentación del Trabajo de Suficiencia Profesional, titulado “${titulo}”, está programada para el ${fechaLarga}, a las ${hora}, en ${lugarConArt}.`
      : `Tu sustentación de tesis, titulada “${titulo}”, está programada para el ${fechaLarga}, a las ${hora}, en ${lugarConArt}.`;

  const mensaje = esPareja
    ? `¡Hola, ${saludoNombres}! Felicitaciones por este gran paso hacia su titulación. Es un momento muy importante y todo va a salir excelente si se organizan bien.

${lineaIntro}

Para que no se les escape ningún detalle, les he preparado un resumen rápido con los puntos claves que deben cumplir para su sustentación presencial:

📋 Lista de tareas pendientes
• Vestimenta: Deben asistir con terno obligatorio.
• Documentos: Lleven los cuatro ejemplares empastados de su ${modalidadEtiqueta} para el jurado (color azul noche con letras doradas), entregados a la Dirección de Escuela 48 horas antes de la sustentación.
• Exposición: Guarden sus diapositivas en un USB y envíenlas también a su correo electrónico como respaldo.
• Garantía para el puntero: No olviden llevar su DNI en físico, ya que deberán dejarlo en la Dirección de Escuela para que les presten el puntero láser.
• Puntualidad: Lleguen exactamente una hora antes de su cita (${horaLlegada}) para probar las diapositivas, el proyector y el audio.

📞 Contactos importantes
• Ingreso al auditorio: Coordinen directamente con el Ms. Elmo Cruzado Oliva, su oficina está ubicada en el 3er. Piso del pabellón de Ingeniería Industrial.
• Dudas o consultas: Pueden comunicarse con la Secretaria de Escuela, la Ms. Celia Chau Muñoz, a su celular 923 029 575.`
    : `¡Hola, ${saludoNombres}! Felicitaciones por este gran paso hacia tu titulación. Es un momento muy importante y todo va a salir excelente si te organizas bien.

${lineaIntro}

Para que no se te escape ningún detalle, te he preparado un resumen rápido con los puntos claves que debes cumplir para tu sustentación presencial:

📋 Lista de tareas pendientes
• Vestimenta: Debes asistir con terno obligatorio.
• Documentos: Lleva los cuatro ejemplares empastados de tu ${modalidadEtiqueta} para el jurado (color azul noche con letras doradas), entregados a la Dirección de Escuela 48 horas antes de la sustentación.
• Exposición: Guarda tus diapositivas en un USB y envíalas también a tu correo electrónico como respaldo.
• Garantía para el puntero: No olvides llevar tu DNI en físico, ya que deberás dejarlo en la Dirección de Escuela para que te presten el puntero láser.
• Puntualidad: Llega exactamente una hora antes de tu cita (${horaLlegada}) para probar las diapositivas, el proyector y el audio.

📞 Contactos importantes
• Ingreso al auditorio: Coordina directamente con el Ms. Elmo Cruzado Oliva, su oficina está ubicada en el 3er. Piso del pabellón de Ingeniería Industrial.
• Dudas o consultas: Puedes comunicarte con la Secretaria de Escuela, la Ms. Celia Chau Muñoz, a su celular 923 029 575.`;

  return { asunto, mensaje };
}

/**
 * PASO 4 — Mensaje oficial exacto para el grupo de WhatsApp de Asesores y Docentes.
 * Soporta Trabajo de Tesis y Trabajo de Suficiencia Profesional (1 o 2 bachilleres).
 */
export function generarWhatsappDocentesOficial(input: PlantillaMensajeInput): string {
  const esSuficiencia = input.modalidad === 'suficiencia';
  const { esPareja, nombresMayus } = formatearNombresBachilleres(
    input.tesistaNombre,
    input.tesista2Nombre
  );
  const { capitalizada: fechaCap } = formatearFechaLargaEs(input.fechaIso);
  const hora = normalizarHoraOficial(input.horaTexto);
  const lugar = (input.lugar || 'Auditorio de la Escuela de Ingeniería Industrial').trim();

  const juradosLineas = [input.jurado1, input.jurado2, input.jurado3]
    .map((d) => String(d || '').trim())
    .filter(Boolean)
    .map((d) => `• ${d}`);

  const asesorLimpio = String(input.asesor || '').trim();
  if (asesorLimpio) {
    juradosLineas.push(`• ${asesorLimpio} (Asesor)`);
  }

  const modalidadEtiqueta = esSuficiencia
    ? 'Trabajo de Suficiencia Profesional'
    : 'Trabajo de Tesis';

  const bachillerTexto = esPareja
    ? `los Bachilleres ${nombresMayus}`
    : `el/la Bachiller ${nombresMayus}`;

  const directorNombre = (input.directorNombre || 'Ms. ANGEL HERNÁNDEZ MOLINA').trim();
  const directorCargo = (input.directorCargo || 'Director (E) de Escuela').trim();

  return `Estimados docentes:
${juradosLineas.join('\n')}

Reciban un cordial saludo. La presente es para recordarles que tienen programada la sustentación de ${modalidadEtiqueta} de ${bachillerTexto}.

Toda la información detallada ha sido enviada a sus correos institucionales. El evento se realizará bajo la siguiente programación:

📅 Día: ${fechaCap}
⏰ Hora: ${hora}
📍 Lugar: ${lugar}

Se solicita amablemente a los miembros del jurado asistir con ropa formal.

Atentamente,
${directorNombre}
${directorCargo}`;
}
