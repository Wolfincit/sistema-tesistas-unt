import { TesisItem } from '../types';
import { MOCK_TESIS } from '../data/mockTesis';
import { normalizarTexto } from './tesisService';

export interface ChatMessage {
  id: string;
  remitente: 'usuario' | 'ia';
  texto: string;
  tesisSugeridas?: TesisItem[];
  consejoLogistico?: string;
  asesoresSugeridos?: string[];
  fecha: string;
}

export const aiAdvisorService = {
  /**
   * Asistente IA Conversacional Grifito UNT:
   * Responde consultas temáticas de tesis, directivas de titulación, Turnitin, auditorio y docentes asesores.
   */
  async consultarAsistente(prompt: string): Promise<ChatMessage> {
    const texto = normalizarTexto(prompt);
    const ahora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    // 1. CONSULTA SOBRE TURNITIN / SIMILITUD / PLAGIO
    if (texto.includes('turnitin') || texto.includes('similitud') || texto.includes('plagio') || texto.includes('porcentaje') || texto.includes('20%')) {
      return {
        id: `ia-${Date.now()}`,
        remitente: 'ia',
        texto: `Para que la Secretaría Académica de Ingeniería Industrial UNT apruebe tu expediente sin observaciones, debes tener en cuenta estas directivas oficiales de Turnitin:\n\n` +
          `1. **Límite Máximo:** El índice de similitud global debe ser estrictamente **menor al 20%**.\n` +
          `2. **Firma Digital Obligatoria:** El reporte debe contar con la firma digital o visado de tu docente asesor en la primera página.\n` +
          `3. **Exclusiones Válidas:** Puedes excluir la sección de bibliografía/referencias y citas textuales breves (< 1%) debidamente entrecomilladas con norma APA 7ma edición.\n` +
          `4. **Consejo Anti-Plagio:** Parafrasea las metodologías con rigor técnico propio y cita siempre las fuentes primarias de bases indexadas (Scopus, Scielo, RENATI).`,
        consejoLogistico: '💡 Tip de Grifi: Si tu porcentaje supera el 20%, coordina con tu asesor para reformular el marco teórico y la revisión de literatura antes de subir el PDF.',
        fecha: ahora
      };
    }

    // 2. CONSULTA SOBRE REQUISITOS / MESA DE PARTES / EXPEDIENTE
    if (texto.includes('requisito') || texto.includes('expediente') || texto.includes('tramite') || texto.includes('fut') || texto.includes('constancia') || texto.includes('egresado') || texto.includes('adeudo')) {
      return {
        id: `ia-${Date.now()}`,
        remitente: 'ia',
        texto: `Para tramitar la declaración de expediente expedito para sustentación en Ingeniería Industrial UNT se exigen **5 requisitos oficiales obligatorios**:\n\n` +
          `• **1. FUT:** Formato Único de Trámite dirigido al Decano de la Facultad de Ingeniería solicitando fecha de sustentación.\n` +
          `• **2. Constancia de Egresado:** Expedida por la Dirección General de Asuntos Académicos (DGA UNT).\n` +
          `• **3. Reporte de Turnitin (< 20%):** Hoja resumen con porcentaje de similitud y firma del asesor.\n` +
          `• **4. Resolución Decanal de Aprobación de Proyecto:** Dictamen que aprobó el plan de tesis original.\n` +
          `• **5. Constancia de No Adeudo Centralizada:** Visado digital de no adeudar a biblioteca central, laboratorios ni tesorería.\n\n` +
          `Puedes subir tus archivos PDF desde el módulo de **Gestión Documentaria**.`,
        consejoLogistico: '💡 Tip de Grifi: Cuando Secretaría apruebe tus 5 requisitos (5/5), tu Pre-reserva de auditorio pasará automáticamente a estado Confirmado.',
        fecha: ahora
      };
    }

    // 3. CONSULTA SOBRE AUDITORIO / SALAS / SUSTENTACIÓN / HORARIOS
    if (texto.includes('auditorio') || texto.includes('sala') || texto.includes('horario') || texto.includes('sustent') || texto.includes('fecha') || texto.includes('bloque') || texto.includes('cupo')) {
      return {
        id: `ia-${Date.now()}`,
        remitente: 'ia',
        texto: `El proceso de reserva del Auditorio de Ingeniería Industrial UNT funciona de la siguiente manera:\n\n` +
          `• **Bloques Horarios Estándar:** Cada jornada dispone de 4 turnos de 2 horas con 30 min de intervalo técnico para acondicionamiento audiovisual:\n` +
          `  - Turno 1: 08:00 - 10:00\n` +
          `  - Turno 2: 10:30 - 12:30\n` +
          `  - Turno 3: 15:00 - 17:00\n` +
          `  - Turno 4: 17:30 - 19:30\n` +
          `• **Fechas Habilitadas:** Por política administrativa, las fechas aparecen inhabilitadas en gris hasta que Secretaría Académica las activa en verde.\n` +
          `• **Flexibilidad de Horarios:** Secretaría puede modificar o incorporar bloques especiales según la disponibilidad del jurado evaluador.\n` +
          `• **Pre-reserva:** Selecciona cualquier bloque disponible en verde para apartar tu fecha inmediatamente.`,
        consejoLogistico: '💡 Tip de Grifi: Revisa el calendario con anticipación; los viernes por la tarde suelen ser los cupos más solicitados.',
        fecha: ahora
      };
    }

    // 4. CONSULTA SOBRE DOCENTES ASESORES
    if (texto.includes('asesor') || texto.includes('docente') || texto.includes('profesor') || texto.includes('burgos') || texto.includes('sifuentes') || texto.includes('calderon') || texto.includes('reyes') || texto.includes('vasquez')) {
      return {
        id: `ia-${Date.now()}`,
        remitente: 'ia',
        texto: `Nuestra Escuela cuenta con docentes asesores reconocidos en el repositorio institucional de la UNT por cada línea de investigación:\n\n` +
          `• **Logística y Cadena de Suministro:** Dr. Hermes Roberto Sifuentes Inostroza (Asesor de 4 tesis de exportación y packing en Virú y Chao).\n` +
          `• **Gestión de la Calidad y Operaciones:** Dr. Wilson Manuel Burgos Chávez e Ing. Carlos Alberto Burgos Herrera (Lean Six Sigma, ISO 9001, calzado en El Porvenir).\n` +
          `• **Producción y Simulación:** Dra. Ana María Calderón Cruz e Ing. Mario Vásquez Alfaro (Simulación Arena, balanceo de líneas y TPM en Cartavio).\n` +
          `• **Seguridad y Salud en el Trabajo:** Dr. Jorge Luis Reyes Cruzado (Matrices IPERC, minería en Pataz y ergonomía).\n\n` +
          `En el módulo de **Repositorio de Tesis** puedes usar el nuevo buscador predictor para filtrar por el nombre exacto de tu asesor.`,
        asesoresSugeridos: [
          'Dr. Sifuentes Inostroza, Hermes Roberto',
          'Dr. Burgos Chávez, Wilson Manuel',
          'Ing. Burgos Herrera, Carlos Alberto',
          'Dra. Calderón Cruz, Ana María',
          'Dr. Reyes Cruzado, Jorge Luis'
        ],
        consejoLogistico: '💡 Tip de Grifi: En el catálogo de tesis puedes escribir simplemente "bur" o "sif" y el sistema completará automáticamente las coincidencias.',
        fecha: ahora
      };
    }

    // 5. CONSULTA DE TEMAS Y ANTECEDENTES DE TESIS (Búsqueda semántica en MOCK_TESIS)
    const puntuadas = MOCK_TESIS.map((t) => {
      let score = 0;

      // Palabras clave de áreas
      if ((texto.includes('proceso') || texto.includes('optimiz') || texto.includes('operacion') || texto.includes('planta') || texto.includes('molienda')) && 
          (t.area === 'Producción y Operaciones' || t.area === 'Logística y Cadena de Suministro')) {
        score += 5;
      }
      if ((texto.includes('logist') || texto.includes('inventario') || texto.includes('almac') || texto.includes('cadena') || texto.includes('ruteo') || texto.includes('distribucion') || texto.includes('frio') || texto.includes('export') || texto.includes('arandano')) &&
          t.area === 'Logística y Cadena de Suministro') {
        score += 6;
      }
      if ((texto.includes('calidad') || texto.includes('iso') || texto.includes('six sigma') || texto.includes('dmaic') || texto.includes('calzado') || texto.includes('mype') || texto.includes('defecto')) &&
          t.area === 'Gestión de la Calidad') {
        score += 6;
      }
      if ((texto.includes('seguridad') || texto.includes('salud') || texto.includes('ergonom') || texto.includes('iperc') || texto.includes('mina') || texto.includes('riesgo') || texto.includes('accidente')) &&
          t.area === 'Seguridad y Salud Ocupacional') {
        score += 6;
      }
      if ((texto.includes('proyecto') || texto.includes('pmbok') || texto.includes('agil') || texto.includes('scrum') || texto.includes('software') || texto.includes('gestion')) &&
          t.area === 'Gestión de Proyectos') {
        score += 5;
      }

      // Palabras clave directas
      t.palabrasClave.forEach((k) => {
        if (texto.includes(normalizarTexto(k))) score += 4;
      });

      // Título o resumen
      const palabrasPrompt = texto.split(/\s+/).filter((w) => w.length > 3);
      palabrasPrompt.forEach((p) => {
        if (normalizarTexto(t.titulo).includes(p)) score += 3;
        if (normalizarTexto(t.resumen).includes(p)) score += 1;
      });

      return { tesis: t, score };
    });

    puntuadas.sort((a, b) => b.score - a.score);
    const topTesis = puntuadas.filter((p) => p.score > 0).slice(0, 3).map((p) => p.tesis);
    const resultado = topTesis.length > 0 ? topTesis : [MOCK_TESIS[0], MOCK_TESIS[1]];
    const asesores = Array.from(new Set(resultado.map((r) => r.asesor)));

    let respuestaTexto = `¡Excelente tema! He analizado el catálogo oficial de graduados de Ingeniería Industrial UNT y encontré las siguientes investigaciones clave como antecedente metodológico para tu plan de tesis:`;

    const consejo = `💡 Tip de Grifi: Puedes revisar el abstract completo y descargar el PDF de cada una de estas investigaciones en la sección "Repositorio de Tesis".`;

    return {
      id: `ia-${Date.now()}`,
      remitente: 'ia',
      texto: respuestaTexto,
      tesisSugeridas: resultado,
      asesoresSugeridos: asesores,
      consejoLogistico: consejo,
      fecha: ahora
    };
  }
};
