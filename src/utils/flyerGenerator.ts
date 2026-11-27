/**
 * Generador Automático de Flyers Oficiales de Sustentación (HTML5 Canvas — 1200×896 PNG)
 * Escuela Profesional de Ingeniería Industrial — Universidad Nacional de Trujillo.
 *
 * Usa directamente las 2 plantillas oficiales reales de la Escuela:
 *   1. 'normal'         -> /images/plantilla-flyer-normal.jpg         (EXPOSICIÓN Y DEFENSA DE TRABAJO DE TESIS)
 *   2. 'reprogramacion' -> /images/plantilla-flyer-reprogramacion.jpg (REPROGRAMACIÓN DE EXPOSICIÓN Y DEFENSA)
 * y estampa únicamente los datos dinámicos calibrados al píxel exacto.
 */

export type TipoFlyerInvitacion = 'normal' | 'reprogramacion';

export interface FlyerSustentacionInput {
  tipo?: TipoFlyerInvitacion;
  modalidad?: 'tesis' | 'suficiencia';
  tesistaNombre: string;
  segundoBachiller?: string;
  tituloTesis: string;
  fechaJueves: string; // YYYY-MM-DD
  horario: string;
  lugar: string;
  juradoPresidente: string;
  juradoSecretario: string;
  juradoVocal: string;
  asesor?: string;
  directorNombre?: string;
  directorCargo?: string;
}

const DEFAULT_DIRECTOR_NOMBRE = 'Ms. Angel Hernández Molina';
const DEFAULT_DIRECTOR_CARGO = 'Director (e) de Escuela de Ingeniería Industrial';

function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapTextStrict(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const rawWords = String(text || '').trim().split(/\s+/).filter(Boolean);
  const words: string[] = [];
  // Si hay una palabra larguísima sin espacios, partirla para que nunca se salga del margen
  for (const w of rawWords) {
    if (ctx.measureText(w).width <= maxWidth) {
      words.push(w);
    } else {
      let chunk = '';
      for (const ch of Array.from(w)) {
        if (ctx.measureText(chunk + ch).width <= maxWidth) {
          chunk += ch;
        } else {
          if (chunk) words.push(chunk);
          chunk = ch;
        }
      }
      if (chunk) words.push(chunk);
    }
  }

  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function formatearFechaOficialFlyer(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || 'jueves';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return `${dias[dt.getDay()]} ${d} de ${meses[(m - 1) % 12]} de ${y}`;
}

function extraerAnio(iso: string): string {
  if (iso && /^\d{4}/.test(iso)) return iso.slice(0, 4);
  return String(new Date().getFullYear());
}

function drawFittedSingleLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  baseFont: string,
  minSizePx: number,
  baseSizePx: number,
  weight: string,
  family: string
) {
  let size = baseSizePx;
  ctx.font = baseFont;
  while (size > minSizePx && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  ctx.fillText(text, x, y);
}

export async function generarFlyerOficialPng(data: FlyerSustentacionInput): Promise<{
  dataUrl: string;
  fileName: string;
}> {
  const tipo: TipoFlyerInvitacion = data.tipo === 'reprogramacion' ? 'reprogramacion' : 'normal';
  const esReprog = tipo === 'reprogramacion';
  const esSuficiencia = data.modalidad === 'suficiencia';

  const W = 1200;
  const H = 896;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El navegador no soporta generación de imagen Canvas.');

  const templateSrc = esReprog
    ? '/images/plantilla-flyer-reprogramacion.jpg'
    : '/images/plantilla-flyer-normal.jpg';

  const [templateImg, logoInd] = await Promise.all([
    loadImageSafe(templateSrc),
    loadImageSafe('/images/logo-industrial.png')
  ]);

  // 1. DIBUJAR LA PLANTILLA REAL OFICIAL DE LA ESCUELA A RESOLUCIÓN COMPLETA
  if (templateImg) {
    ctx.drawImage(templateImg, 0, 0, W, H);

    // Limpiar la zona del logo superior derecho copiando una franja limpia exacta de la cabecera
    // para que no quede ningún rastro ni deformación debajo del logo real transparente
    const headerPatchH = esReprog ? 120 : 122;
    ctx.drawImage(templateImg, 990, 0, 36, headerPatchH, 1052, 0, W - 1052, headerPatchH);

    // Si es Trabajo de Suficiencia Profesional, reemplazar limpiamente el banner azul y el texto introductorio
    if (esSuficiencia) {
      // 1) Parche exacto del banner azul (copiando una franja vertical limpia del margen izquierdo x=12..32)
      const bannerY = esReprog ? 115 : 114;
      const bannerH = 208 - bannerY;
      ctx.drawImage(templateImg, 12, bannerY, 20, bannerH, 0, bannerY, W, bannerH);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#FFFFFF';
      if (esReprog) {
        ctx.font = '800 36px Poppins, "Segoe UI", Arial, sans-serif';
        ctx.fillText('REPROGRAMACIÓN DE EXPOSICIÓN Y DEFENSA DE', W / 2, 154);
        ctx.font = '800 38px Poppins, "Segoe UI", Arial, sans-serif';
        ctx.fillText('TRABAJO DE SUFICIENCIA PROFESIONAL', W / 2, 196);
      } else {
        ctx.font = '800 37px Poppins, "Segoe UI", Arial, sans-serif';
        ctx.fillText('EXPOSICIÓN Y DEFENSA DE TRABAJO DE', W / 2, 154);
        ctx.font = '800 40px Poppins, "Segoe UI", Arial, sans-serif';
        ctx.fillText('SUFICIENCIA PROFESIONAL', W / 2, 197);
      }

      // 2) Parche suave del párrafo introductorio ("...a la sustentación de trabajo de tesis, titulado:")
      // Conserva el degradado fotográfico real de fondo muestreando la franja limpia superior
      const introSrcY = esReprog ? 225 : 235;
      const introDestY = esReprog ? 231 : 241;
      const introDestH = esReprog ? 60 : 61;
      ctx.drawImage(templateImg, 165, introSrcY, W - 185, 8, 165, introDestY, W - 185, introDestH);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#10107A';
      const introCenterX = 656;
      const introMaxW = 1005;
      const line1Y = esReprog ? 255 : 265;
      const line2Y = esReprog ? 282 : 293;
      const line1Text = 'Se invita a los docentes, estudiantes, egresados de la Escuela de Ingeniería';
      const line2Text = 'Industrial y público en general, a la sustentación de trabajo de suficiencia profesional, titulado:';

      let s1 = 24;
      ctx.font = `500 ${s1}px Poppins, "Segoe UI", Arial, sans-serif`;
      while (s1 > 17 && ctx.measureText(line1Text).width > introMaxW) {
        s1 -= 1;
        ctx.font = `500 ${s1}px Poppins, "Segoe UI", Arial, sans-serif`;
      }
      ctx.fillText(line1Text, introCenterX, line1Y);

      let s2 = 22;
      ctx.font = `500 ${s2}px Poppins, "Segoe UI", Arial, sans-serif`;
      while (s2 > 16 && ctx.measureText(line2Text).width > introMaxW) {
        s2 -= 1;
        ctx.font = `500 ${s2}px Poppins, "Segoe UI", Arial, sans-serif`;
      }
      ctx.fillText(line2Text, introCenterX, line2Y);
    }

    // Limpiar el pie del Director y el año "2026" fijo con una banda uniforme suave sin costuras
    // (preservando la curva azul inferior izquierda) para que Director y Año se actualicen limpio
    const footerPatchY = esReprog ? 814 : 816;
    const footerPatchH = H - footerPatchY;
    const footerGrad = ctx.createLinearGradient(0, footerPatchY, 0, H);
    footerGrad.addColorStop(0, '#E8E9EC');
    footerGrad.addColorStop(0.55, '#D8DADF');
    footerGrad.addColorStop(1, '#C5C8CE');
    ctx.fillStyle = footerGrad;
    ctx.fillRect(140, footerPatchY, W - 140, footerPatchH);
  } else {
    ctx.fillStyle = '#ECEAE6';
    ctx.fillRect(0, 0, W, H);
  }

  // Superponer el logo real transparente de Ingeniería Industrial UNT respetando su proporción exacta (sin recortar dientes ni deformar)
  if (logoInd) {
    const natW = logoInd.naturalWidth || 242;
    const natH = logoInd.naturalHeight || 250;
    const drawH = 118;
    const drawW = Math.round(drawH * (natW / natH));
    const logoCx = 1125;
    const logoCy = esReprog ? 60 : 62;
    ctx.drawImage(logoInd, logoCx - drawW / 2, logoCy - drawH / 2, drawW, drawH);
  }

  // Estampar Director de Escuela dinámico (centrado en la barra inferior)
  const dirNombre = String(data.directorNombre || DEFAULT_DIRECTOR_NOMBRE).trim();
  const dirCargo = String(data.directorCargo || DEFAULT_DIRECTOR_CARGO).trim();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#10107A';
  ctx.font = '800 24px Poppins, "Segoe UI", Arial, sans-serif';
  ctx.fillText(dirNombre, 640, 847);
  ctx.font = '800 23px Poppins, "Segoe UI", Arial, sans-serif';
  ctx.fillText(dirCargo, 640, 879);

  // Estampar el año dinámico en la esquina inferior derecha (se actualiza automáticamente según la fecha)
  const anioDinamico = extraerAnio(data.fechaJueves);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#4B5598';
  ctx.font = '800 74px Poppins, "Segoe UI", Arial, sans-serif';
  ctx.fillText(anioDinamico, 1178, 878);

  // Coordenadas medidas al píxel exacto sobre cada plantilla 1200x896
  const coords = esReprog
    ? {
        titleCenterX: 652,
        titleTopY: 304,
        titleMaxW: 970,
        diaX: 316,
        diaY: 389,
        horaX: 339,
        horaY: 429,
        lugarX: 348,
        lugarY: 469,
        bachillerX: 396,
        bachillerSingleY: 544,
        bachillerPairY1: 534,
        bachillerPairY2: 568,
        juradoX: 434,
        juradoYs: [629, 664, 698] as [number, number, number],
        asesorX: 434,
        asesorY: 775
      }
    : {
        titleCenterX: 652,
        titleTopY: 312,
        titleMaxW: 970,
        diaX: 324,
        diaY: 395,
        horaX: 345,
        horaY: 437,
        lugarX: 359,
        lugarY: 475,
        bachillerX: 406,
        bachillerSingleY: 550,
        bachillerPairY1: 540,
        bachillerPairY2: 574,
        juradoX: 445,
        juradoYs: [634, 668, 702] as [number, number, number],
        asesorX: 445,
        asesorY: 771
      };

  const NAVY = '#10107A';
  const FONT_SANS = 'Poppins, "Segoe UI", Arial, sans-serif';

  // 2. TÍTULO DE LA TESIS — Optimizado para títulos oficiales UNT (hasta ~20 palabras)
  // Ancho amplio (1020 px, libre del libro izquierdo) + interlineado editorial compacto (1.08)
  // + caja estricta entre "titulado:" y "Día:" para máxima presencia visual y CERO superposición
  const tituloLimpio = String(data.tituloTesis || 'Tesis de Ingeniería Industrial')
    .replace(/^[“""]+|[”""]+$/g, '')
    .trim()
    .toUpperCase();
  const tituloConComillas = `“${tituloLimpio}”`;

  const boxTop = esReprog ? 293 : 303;
  const boxBottom = esReprog ? 364 : 371;
  const boxMaxHeight = boxBottom - boxTop;
  const titleMaxW = 1020;
  const titleCenterX = 658;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = NAVY;

  let chosenFontSize = 15;
  let chosenLineHeight = 17;
  let chosenLines: string[] = [tituloConComillas];

  for (let size = 29; size >= 15; size -= 1) {
    const lh = Math.round(size * 1.09);
    ctx.font = `800 ${size}px ${FONT_SANS}`;
    const wrapped = wrapTextStrict(ctx, tituloConComillas, titleMaxW);
    // Altura visual real de N líneas = (N-1)*lh + size
    const blockH = (wrapped.length - 1) * lh + size;
    if (blockH <= boxMaxHeight) {
      chosenFontSize = size;
      chosenLineHeight = lh;
      chosenLines = wrapped;
      break;
    }
    if (size === 15) {
      chosenFontSize = 15;
      chosenLineHeight = 17;
      const maxFit = Math.max(1, Math.floor((boxMaxHeight - 15) / 17) + 1);
      chosenLines = wrapped.slice(0, maxFit);
      if (wrapped.length > maxFit) {
        const lastIdx = chosenLines.length - 1;
        chosenLines[lastIdx] = `${chosenLines[lastIdx].slice(0, -2).trim()}…”`;
      }
    }
  }

  const totalBlockH = (chosenLines.length - 1) * chosenLineHeight + chosenFontSize;
  const startTopY = boxTop + Math.max(0, Math.floor((boxMaxHeight - totalBlockH) / 2));

  ctx.font = `800 ${chosenFontSize}px ${FONT_SANS}`;
  chosenLines.forEach((line, idx) => {
    ctx.fillText(line, titleCenterX, startTopY + idx * chosenLineHeight);
  });
  ctx.textBaseline = 'alphabetic';

  // 3. DÍA, HORA Y LUGAR
  ctx.textAlign = 'left';
  ctx.fillStyle = NAVY;

  const fechaTexto = formatearFechaOficialFlyer(data.fechaJueves);
  drawFittedSingleLine(
    ctx,
    fechaTexto,
    coords.diaX,
    coords.diaY,
    W - coords.diaX - 40,
    `500 25px ${FONT_SANS}`,
    19,
    25,
    '500',
    FONT_SANS
  );

  const horaTexto = String(data.horario || '11:00 a.m.').trim();
  drawFittedSingleLine(
    ctx,
    horaTexto,
    coords.horaX,
    coords.horaY,
    W - coords.horaX - 40,
    `500 25px ${FONT_SANS}`,
    19,
    25,
    '500',
    FONT_SANS
  );

  const lugarTexto = String(
    data.lugar || 'Auditorio de la Escuela de Ingeniería Industrial'
  ).trim();
  drawFittedSingleLine(
    ctx,
    lugarTexto,
    coords.lugarX,
    coords.lugarY,
    W - coords.lugarX - 40,
    `800 25px ${FONT_SANS}`,
    19,
    25,
    '800',
    FONT_SANS
  );

  // 4. BACHILLER (Soporta 1 o 2 bachilleres automáticamente)
  const bachilleresRaw: string[] = [];
  String(data.tesistaNombre || 'TESISTA')
    .split(/\n|\s*\/\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((n) => bachilleresRaw.push(n.toUpperCase()));
  if (data.segundoBachiller && data.segundoBachiller.trim()) {
    bachilleresRaw.push(data.segundoBachiller.trim().toUpperCase());
  }
  const bachilleres = Array.from(new Set(bachilleresRaw)).slice(0, 2);

  if (bachilleres.length === 1) {
    drawFittedSingleLine(
      ctx,
      bachilleres[0],
      coords.bachillerX,
      coords.bachillerSingleY,
      W - coords.bachillerX - 40,
      `800 25px ${FONT_SANS}`,
      19,
      25,
      '800',
      FONT_SANS
    );
  } else {
    drawFittedSingleLine(
      ctx,
      bachilleres[0],
      coords.bachillerX,
      coords.bachillerPairY1,
      W - coords.bachillerX - 40,
      `800 24px ${FONT_SANS}`,
      18,
      24,
      '800',
      FONT_SANS
    );
    drawFittedSingleLine(
      ctx,
      bachilleres[1],
      coords.bachillerX,
      coords.bachillerPairY2,
      W - coords.bachillerX - 40,
      `800 24px ${FONT_SANS}`,
      18,
      24,
      '800',
      FONT_SANS
    );
  }

  // 5. JURADO EVALUADOR (3 miembros junto a cada flechita » de la plantilla real)
  const jurados = [
    data.juradoPresidente || 'Por confirmar',
    data.juradoSecretario || 'Por confirmar',
    data.juradoVocal || 'Por confirmar'
  ];
  jurados.forEach((nombre, i) => {
    drawFittedSingleLine(
      ctx,
      nombre,
      coords.juradoX,
      coords.juradoYs[i],
      W - coords.juradoX - 40,
      `500 25px ${FONT_SANS}`,
      18,
      25,
      '500',
      FONT_SANS
    );
  });

  // 6. ASESOR (junto a la flechita » inferior)
  drawFittedSingleLine(
    ctx,
    data.asesor || 'Por confirmar',
    coords.asesorX,
    coords.asesorY,
    W - coords.asesorX - 40,
    `500 25px ${FONT_SANS}`,
    18,
    25,
    '500',
    FONT_SANS
  );

  const safeSlug = String(data.tesistaNombre || 'sustentacion')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .slice(0, 32);

  const prefix = esReprog
    ? esSuficiencia
      ? 'Flyer_Reprogramacion_Suficiencia'
      : 'Flyer_Reprogramacion'
    : esSuficiencia
      ? 'Flyer_Suficiencia'
      : 'Flyer_Invitacion';
  return {
    dataUrl: canvas.toDataURL('image/png'),
    fileName: `${prefix}_${data.fechaJueves || 'Jueves'}_${safeSlug}.png`
  };
}

export function construirTextoWhatsAppDocentes(data: FlyerSustentacionInput): string {
  const esReprog = data.tipo === 'reprogramacion';
  const tituloEncabezado = esReprog
    ? '📢 *REPROGRAMACIÓN DE SUSTENTACIÓN DE TESIS — ING. INDUSTRIAL UNT*'
    : '📢 *INVITACIÓN A SUSTENTACIÓN DE TESIS — ING. INDUSTRIAL UNT*';

  const bachilleres = [data.tesistaNombre, data.segundoBachiller]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join(' / ');

  return [
    tituloEncabezado,
    '',
    `📅 *Día:* ${formatearFechaOficialFlyer(data.fechaJueves)}`,
    `⏰ *Hora:* ${data.horario || '11:00 a.m.'}`,
    `📍 *Lugar:* ${data.lugar || 'Auditorio de la Escuela de Ingeniería Industrial'}`,
    '',
    `🎓 *Bachiller:* ${bachilleres}`,
    `📄 *Tesis:* "${data.tituloTesis}"`,
    '',
    '👨‍🏫 *Jurado Evaluador:*',
    `• ${data.juradoPresidente || 'Por confirmar'}`,
    `• ${data.juradoSecretario || 'Por confirmar'}`,
    `• ${data.juradoVocal || 'Por confirmar'}`,
    ...(data.asesor ? [`• *Asesor:* ${data.asesor}`] : []),
    '',
    '_Enviado desde el Sistema de Secretaría — Escuela Profesional de Ingeniería Industrial UNT._'
  ].join('\n');
}
