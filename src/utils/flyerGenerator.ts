/**
 * Generador Automático de Flyer Oficial de Sustentación (HTML5 Canvas — 1080×1080 PNG)
 * Escuela Profesional de Ingeniería Industrial — Universidad Nacional de Trujillo.
 * Reemplaza el diseño manual en Canva de los días martes: genera una imagen lista para
 * publicar en Facebook y adjuntar automáticamente en los correos a jurados y tesistas.
 */

export interface FlyerSustentacionInput {
  tesistaNombre: string;
  tituloTesis: string;
  fechaJueves: string; // YYYY-MM-DD
  horario: string;
  lugar: string;
  juradoPresidente: string;
  juradoSecretario: string;
  juradoVocal: string;
  asesor?: string;
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
  const words = String(text || '').trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) lines.length = maxLines;
  return lines;
}

function formatearFechaLarga(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || 'Jueves';
  const [y, m, d] = iso.split('-').map(Number);
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return `Jueves ${d} de ${meses[(m - 1) % 12]} de ${y}`;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function generarFlyerOficialPng(data: FlyerSustentacionInput): Promise<{
  dataUrl: string;
  fileName: string;
}> {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El navegador no soporta generación de imagen Canvas.');

  const [logoUnt, logoInd] = await Promise.all([
    loadImageSafe('/images/logo-unt.png'),
    loadImageSafe('/images/logo-industrial.png')
  ]);

  // Fondo institucional degradado azul marino UNT
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#051F42');
  bg.addColorStop(0.55, '#082F64');
  bg.addColorStop(1, '#0C4D96');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Detalles geométricos sutiles
  ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.beginPath();
  ctx.arc(W - 80, 120, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(80, H - 90, 190, 0, Math.PI * 2);
  ctx.fill();

  // Marco exterior dorado sutil
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, 28, 28, W - 56, H - 56, 28);
  ctx.stroke();

  // Cabecera blanca superior con logos oficiales
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(ctx, 56, 56, W - 112, 138, 22);
  ctx.fill();

  if (logoInd) {
    ctx.drawImage(logoInd, 78, 72, 106, 106);
  }
  if (logoUnt) {
    ctx.drawImage(logoUnt, W - 184, 72, 106, 106);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#082F64';
  ctx.font = 'bold 28px Poppins, Arial, sans-serif';
  ctx.fillText('UNIVERSIDAD NACIONAL DE TRUJILLO', W / 2, 110);
  ctx.fillStyle = '#B45309';
  ctx.font = 'bold 22px Poppins, Arial, sans-serif';
  ctx.fillText('FACULTAD DE INGENIERÍA', W / 2, 142);
  ctx.fillStyle = '#334155';
  ctx.font = '600 20px Poppins, Arial, sans-serif';
  ctx.fillText('ESCUELA PROFESIONAL DE INGENIERÍA INDUSTRIAL', W / 2, 174);

  // Etiqueta principal dorada
  ctx.fillStyle = '#F59E0B';
  drawRoundedRect(ctx, 190, 220, W - 380, 62, 31);
  ctx.fill();
  ctx.fillStyle = '#0F172A';
  ctx.font = '900 29px Poppins, Arial, sans-serif';
  ctx.fillText('SUSTENTACIÓN PÚBLICA DE TESIS', W / 2, 261);

  // Tarjeta principal del Tesista y Título
  ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
  drawRoundedRect(ctx, 64, 308, W - 128, 330, 26);
  ctx.fill();

  ctx.fillStyle = '#0C4D96';
  ctx.font = 'bold 18px Poppins, Arial, sans-serif';
  ctx.fillText('TESISTA / BACHILLER', W / 2, 348);

  ctx.fillStyle = '#0F172A';
  ctx.font = '900 34px Poppins, Arial, sans-serif';
  const nombreLines = wrapTextLines(ctx, (data.tesistaNombre || 'TESISTA').toUpperCase(), W - 200, 2);
  nombreLines.forEach((line, i) => {
    ctx.fillText(line, W / 2, 392 + i * 40);
  });

  // Línea separadora
  const sepY = nombreLines.length > 1 ? 452 : 422;
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(W / 2 - 90, sepY, 180, 4);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 17px Poppins, Arial, sans-serif';
  ctx.fillText('TÍTULO DE LA TESIS', W / 2, sepY + 34);

  ctx.fillStyle = '#1E293B';
  ctx.font = 'italic 600 24px Poppins, Arial, sans-serif';
  const tituloLines = wrapTextLines(ctx, `"${data.tituloTesis || 'Tesis de Ingeniería Industrial'}"`, W - 200, 4);
  tituloLines.forEach((line, i) => {
    ctx.fillText(line, W / 2, sepY + 72 + i * 32);
  });

  // Bloque Fecha, Hora y Lugar
  ctx.fillStyle = '#FEF3C7';
  drawRoundedRect(ctx, 64, 662, W - 128, 122, 22);
  ctx.fill();
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#082F64';
  ctx.font = '900 28px Poppins, Arial, sans-serif';
  ctx.fillText(`📅  ${formatearFechaLarga(data.fechaJueves)}`, W / 2, 708);

  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 23px Poppins, Arial, sans-serif';
  ctx.fillText(`⏰  ${data.horario || '11:00 a.m. - 1:00 p.m.'}   |   📍 ${data.lugar || 'Auditorio de Ing. Industrial UNT'}`, W / 2, 754);

  // Bloque Jurado Evaluador
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  drawRoundedRect(ctx, 64, 806, W - 128, 166, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#FDE68A';
  ctx.font = 'bold 19px Poppins, Arial, sans-serif';
  ctx.fillText('JURADO EVALUADOR', W / 2, 838);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 21px Poppins, Arial, sans-serif';
  ctx.fillText(`• Presidente:  ${data.juradoPresidente || 'Por confirmar'}`, 104, 878);
  ctx.fillText(`• Secretario:  ${data.juradoSecretario || 'Por confirmar'}`, 104, 914);
  ctx.fillText(`• Vocal:         ${data.juradoVocal || 'Por confirmar'}`, 104, 950);

  // Pie de página
  ctx.textAlign = 'center';
  ctx.fillStyle = '#CBD5E1';
  ctx.font = 'bold 17px Poppins, Arial, sans-serif';
  ctx.fillText('INGRESO LIBRE · ESCUELA DE INGENIERÍA INDUSTRIAL UNT · DISCIPLINA · INNOVACIÓN · EXCELENCIA', W / 2, 1018);

  const safeSlug = String(data.tesistaNombre || 'sustentacion')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .slice(0, 32);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    fileName: `Flyer_Sustentacion_${data.fechaJueves || 'Jueves'}_${safeSlug}.png`
  };
}

export function construirTextoWhatsAppDocentes(data: FlyerSustentacionInput): string {
  return [
    '📢 *RECORDATORIO DE SUSTENTACIÓN DE TESIS — ING. INDUSTRIAL UNT*',
    '',
    `📅 *Fecha:* ${formatearFechaLarga(data.fechaJueves)}`,
    `⏰ *Horario:* ${data.horario || '11:00 a.m. - 1:00 p.m.'}`,
    `📍 *Lugar:* ${data.lugar || 'Auditorio de Ingeniería Industrial UNT'}`,
    '',
    `🎓 *Tesista:* ${data.tesistaNombre}`,
    `📄 *Tesis:* "${data.tituloTesis}"`,
    '',
    '👨‍🏫 *Jurado Evaluador:*',
    `• Presidente: ${data.juradoPresidente || 'Por confirmar'}`,
    `• Secretario: ${data.juradoSecretario || 'Por confirmar'}`,
    `• Vocal: ${data.juradoVocal || 'Por confirmar'}`,
    '',
    '_Enviado desde el Sistema de Secretaría — Escuela Profesional de Ingeniería Industrial UNT._'
  ].join('\n');
}
