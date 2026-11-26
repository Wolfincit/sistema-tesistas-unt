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

function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
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

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines - 1);
    let last = lines.slice(maxLines - 1).join(' ');
    while (last.length > 4 && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    kept.push(`${last.trim()}…`);
    return kept;
  }
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

    // Limpiar el año "2026" fijo de la esquina inferior derecha copiando la franja limpia adyacente
    // para estampar el año real dinámicamente según la fecha elegida (2026, 2027, 2028...)
    const footerPatchY = esReprog ? 814 : 816;
    const footerPatchH = H - footerPatchY;
    ctx.drawImage(templateImg, 950, footerPatchY, 32, footerPatchH, 982, footerPatchY, W - 982, footerPatchH);
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

  // 2. TÍTULO DE LA TESIS (Centrado, mayúsculas, azul marino negrita, auto-ajustado sin pisar "Día:")
  const tituloLimpio = String(data.tituloTesis || 'Tesis de Ingeniería Industrial')
    .replace(/^[“""]+|[”""]+$/g, '')
    .trim()
    .toUpperCase();
  const tituloConComillas = `“${tituloLimpio}”`;

  ctx.textAlign = 'center';
  ctx.fillStyle = NAVY;
  ctx.font = `800 22px ${FONT_SANS}`;
  let tituloLines = wrapTextLines(ctx, tituloConComillas, coords.titleMaxW, 3);
  let titleFontSize = 22;
  let titleLineHeight = 27;

  if (tituloLines.length >= 3) {
    titleFontSize = 19;
    titleLineHeight = 22;
    ctx.font = `800 ${titleFontSize}px ${FONT_SANS}`;
    tituloLines = wrapTextLines(ctx, tituloConComillas, coords.titleMaxW, 3);
  }
  const startTitleY =
    tituloLines.length === 1
      ? coords.titleTopY + 34
      : tituloLines.length === 2
      ? coords.titleTopY + 22
      : coords.titleTopY + 12;

  tituloLines.forEach((line, idx) => {
    ctx.fillText(line, coords.titleCenterX, startTitleY + idx * titleLineHeight);
  });

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

  const prefix = esReprog ? 'Flyer_Reprogramacion' : 'Flyer_Invitacion';
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
