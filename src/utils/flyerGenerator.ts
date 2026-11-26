/**
 * Generador Automático de Flyers Oficiales de Sustentación (HTML5 Canvas — 1080×900 PNG)
 * Escuela Profesional de Ingeniería Industrial — Universidad Nacional de Trujillo.
 *
 * Replica el formato institucional oficial usado por Secretaría en sus 2 variantes previas
 * a la sustentación:
 *   1. 'normal'         -> INVITACIÓN: EXPOSICIÓN Y DEFENSA DE TRABAJO DE TESIS
 *   2. 'reprogramacion' -> INVITACIÓN: REPROGRAMACIÓN DE EXPOSICIÓN Y DEFENSA DE TRABAJO DE TESIS
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
      if (lines.length === maxLines - 1) {
        // Anexar el resto en la última línea (ajustado si hace falta)
        continue;
      }
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines - 1);
    kept.push(lines.slice(maxLines - 1).join(' '));
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

function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  letterSpacing: number
) {
  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalWidth =
    widths.reduce((acc, w) => acc + w, 0) + letterSpacing * Math.max(0, chars.length - 1);
  let x = centerX - totalWidth / 2;
  ctx.textAlign = 'left';
  chars.forEach((ch, idx) => {
    ctx.fillText(ch, x, y);
    x += widths[idx] + letterSpacing;
  });
}

function drawSoftAcademicBackground(ctx: CanvasRenderingContext2D, W: number, H: number, topY: number) {
  // Fondo cálido luminoso con silueta académica difuminada (birrete + borla dorada suave)
  const bg = ctx.createLinearGradient(0, topY, W, H);
  bg.addColorStop(0, '#F6F5F2');
  bg.addColorStop(0.45, '#ECEAE6');
  bg.addColorStop(1, '#DFDDD8');
  ctx.fillStyle = bg;
  ctx.fillRect(0, topY, W, H - topY);

  // Halo luminoso detrás del título
  const radial = ctx.createRadialGradient(W * 0.42, topY + 130, 30, W * 0.45, topY + 260, 560);
  radial.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
  radial.addColorStop(0.55, 'rgba(255, 255, 255, 0.45)');
  radial.addColorStop(1, 'rgba(215, 212, 206, 0.0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, topY, W, H - topY);

  // Silueta sutil de toga/hombros y birrete (marca de agua académica sin derechos ni texto Canva)
  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = '#334155';
  // Birrete grande de marca de agua en la parte superior derecha
  ctx.beginPath();
  ctx.moveTo(W * 0.52, topY + 38);
  ctx.lineTo(W * 0.96, topY + 8);
  ctx.lineTo(W * 1.03, topY + 84);
  ctx.lineTo(W * 0.62, topY + 126);
  ctx.closePath();
  ctx.fill();
  // Toga / silueta suave inferior
  ctx.beginPath();
  ctx.ellipse(W * 0.72, H - 60, 340, 310, -0.1, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(W * 0.24, H - 20, 290, 270, 0.15, Math.PI, 0);
  ctx.fill();
  ctx.restore();

  // Borla dorada vertical sutil en la derecha (homenaje al fondo oficial de la Escuela)
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.strokeStyle = '#EAB308';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(W * 0.785, topY + 95);
  ctx.lineTo(W * 0.785, H - 155);
  ctx.stroke();
  ctx.fillStyle = '#EAB308';
  ctx.beginPath();
  ctx.arc(W * 0.785, H - 295, 16, 0, Math.PI * 2);
  ctx.fill();
  drawRoundedRect(ctx, W * 0.785 - 15, H - 280, 30, 128, 12);
  ctx.fill();
  ctx.restore();
}

function drawThesisBookIllustration(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);

  // Libro azul inclinado
  ctx.fillStyle = '#0284C7';
  ctx.beginPath();
  ctx.moveTo(4, 24);
  ctx.lineTo(54, 0);
  ctx.lineTo(74, 12);
  ctx.lineTo(74, 92);
  ctx.lineTo(24, 118);
  ctx.lineTo(4, 106);
  ctx.closePath();
  ctx.fill();

  // Lomo más oscuro
  ctx.fillStyle = '#0369A1';
  ctx.beginPath();
  ctx.moveTo(4, 24);
  ctx.lineTo(24, 36);
  ctx.lineTo(24, 118);
  ctx.lineTo(4, 106);
  ctx.closePath();
  ctx.fill();

  // Hojas blancas
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(28, 38);
  ctx.lineTo(70, 18);
  ctx.lineTo(70, 88);
  ctx.lineTo(28, 108);
  ctx.closePath();
  ctx.fill();

  // Etiqueta roja "THESIS"
  ctx.save();
  ctx.translate(64, 16);
  ctx.rotate(-0.48);
  ctx.fillStyle = '#DC2626';
  drawRoundedRect(ctx, 0, 0, 52, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('THESIS', 26, 12.5);
  ctx.restore();

  // Birrete académico sobre el libro
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(34, 68);
  ctx.lineTo(78, 48);
  ctx.lineTo(122, 68);
  ctx.lineTo(78, 88);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.moveTo(52, 77);
  ctx.lineTo(52, 98);
  ctx.quadraticCurveTo(78, 112, 104, 98);
  ctx.lineTo(104, 77);
  ctx.lineTo(78, 89);
  ctx.closePath();
  ctx.fill();

  // Borla dorada del birrete
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(78, 68);
  ctx.lineTo(54, 82);
  ctx.lineTo(54, 108);
  ctx.stroke();
  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.arc(54, 110, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCalendarIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, x, y, 24, 24, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#EF4444';
  drawRoundedRect(ctx, x, y, 24, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#94A3B8';
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      ctx.fillRect(x + 4 + col * 6, y + 11 + row * 5, 4, 3);
    }
  }
  ctx.restore();
}

function drawClockCheckIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#FFF7ED';
  ctx.strokeStyle = '#C2410C';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x + 12, y + 12, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 12);
  ctx.lineTo(x + 11.5, y + 15.5);
  ctx.lineTo(x + 17.5, y + 8);
  ctx.stroke();
  ctx.restore();
}

function drawPinIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.arc(x + 12, y + 9, 8.5, Math.PI, 0, false);
  ctx.lineTo(x + 12, y + 25);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(x + 12, y + 9, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPersonIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(cx, cy - 11, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + 16, 17, Math.PI, 0);
  ctx.lineTo(cx + 17, cy + 20);
  ctx.lineTo(cx - 17, cy + 20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawJuryBenchIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.fillStyle = '#0F172A';
  // 3 cabezas y hombros
  [-15, 0, 15].forEach((dx) => {
    ctx.beginPath();
    ctx.arc(cx + dx, cy - 16, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + dx, cy - 3, 7, Math.PI, 0);
    ctx.fill();
  });
  // Mesa del jurado
  ctx.fillRect(cx - 28, cy - 2, 56, 6);
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(cx - 24, cy + 4, 48, 16);
  ctx.fillRect(cx - 29, cy + 20, 58, 5);
  ctx.restore();
}

function drawAdvisorIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 12, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - 4, cy + 16, 16, Math.PI, 0);
  ctx.lineTo(cx + 12, cy + 21);
  ctx.lineTo(cx - 20, cy + 21);
  ctx.closePath();
  ctx.fill();
  // Corbata blanca sutil
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy + 2);
  ctx.lineTo(cx - 1, cy + 14);
  ctx.lineTo(cx - 4, cy + 18);
  ctx.lineTo(cx - 7, cy + 14);
  ctx.closePath();
  ctx.fill();
  // Burbuja de diálogo a la derecha
  ctx.fillStyle = '#0F172A';
  drawRoundedRect(ctx, cx + 8, cy - 15, 18, 13, 4);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(cx + 12, cy - 11, 10, 2);
  ctx.fillRect(cx + 12, cy - 7, 7, 2);
  ctx.restore();
}

function drawDoubleChevron(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#0284C7';
  // Primer triángulo »
  ctx.beginPath();
  ctx.moveTo(x, y - 9);
  ctx.lineTo(x + 11, y);
  ctx.lineTo(x, y + 9);
  ctx.lineTo(x + 3.5, y);
  ctx.closePath();
  ctx.fill();
  // Segundo triángulo »
  ctx.fillStyle = '#004AAD';
  ctx.beginPath();
  ctx.moveTo(x + 9, y - 9);
  ctx.lineTo(x + 20, y);
  ctx.lineTo(x + 9, y + 9);
  ctx.lineTo(x + 12.5, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export async function generarFlyerOficialPng(data: FlyerSustentacionInput): Promise<{
  dataUrl: string;
  fileName: string;
}> {
  const tipo: TipoFlyerInvitacion = data.tipo === 'reprogramacion' ? 'reprogramacion' : 'normal';
  const esReprog = tipo === 'reprogramacion';

  const W = 1080;
  const H = 900;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('El navegador no soporta generación de imagen Canvas.');

  const logoInd = await loadImageSafe('/images/logo-industrial.png');

  // 1. FRANJA AZUL SUPERIOR
  const BLUE = '#004AAD';
  const NAVY = '#10107A';
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, W, 44);

  // 2. BANDA BLANCA "I N V I T A C I Ó N"
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 44, W, 62);

  // Línea vertical decorativa izquierda junto a INVITACIÓN
  ctx.fillStyle = NAVY;
  ctx.fillRect(240, 50, 4, 54);

  ctx.fillStyle = NAVY;
  ctx.font = '900 42px Poppins, "Segoe UI", Arial, sans-serif';
  drawSpacedText(ctx, 'INVITACIÓN', 562, 91, 20);

  // 3. BANDA AZUL PRINCIPAL (Normal vs Reprogramación)
  const bannerTop = 106;
  const bannerHeight = esReprog ? 104 : 84;
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, bannerTop, W, bannerHeight);

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  if (esReprog) {
    ctx.font = '900 35px Poppins, "Segoe UI", Arial, sans-serif';
    ctx.fillText('REPROGRAMACIÓN DE EXPOSICIÓN Y DEFENSA DE', W / 2, bannerTop + 44);
    ctx.fillText('TRABAJO DE TESIS', W / 2, bannerTop + 88);
  } else {
    ctx.font = '900 37px Poppins, "Segoe UI", Arial, sans-serif';
    ctx.fillText('EXPOSICIÓN Y DEFENSA DE TRABAJO DE TESIS', W / 2, bannerTop + 55);
  }

  // Logo circular oficial de Ingeniería Industrial UNT (esquina superior derecha)
  if (logoInd) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(W - 64, 58, 48, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.clip();
    ctx.drawImage(logoInd, W - 112, 10, 96, 96);
    ctx.restore();
  }

  // 4. CUERPO PRINCIPAL CON FONDO SUAVE ACADÉMICO
  const bodyTop = bannerTop + bannerHeight;
  const footerHeight = 72;
  const bodyBottom = H - footerHeight;
  drawSoftAcademicBackground(ctx, W, bodyBottom, bodyTop);

  // Ilustración libro + birrete a la izquierda
  drawThesisBookIllustration(ctx, 10, bodyTop + 34);

  // Texto de invitación oficial
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1E1B4B';
  ctx.font = '500 23px "Segoe UI", Poppins, Arial, sans-serif';
  const introY = bodyTop + 44;
  ctx.fillText(
    'Se invita a los docentes, estudiantes, egresados de la Escuela de Ingeniería',
    588,
    introY
  );
  ctx.fillText(
    'Industrial y público en general, a la sustentación de trabajo de tesis, titulado:',
    588,
    introY + 30
  );

  // Título de la tesis en mayúsculas, negrita azul marino entre comillas
  ctx.fillStyle = NAVY;
  ctx.font = '800 24px Poppins, "Segoe UI", Arial, sans-serif';
  const tituloLimpio = String(data.tituloTesis || 'Tesis de Ingeniería Industrial')
    .replace(/^[“""]+|[”""]+$/g, '')
    .trim()
    .toUpperCase();
  const tituloLines = wrapTextLines(ctx, `“${tituloLimpio}”`, 895, 3);
  const titleStartY = introY + 67;
  tituloLines.forEach((line, idx) => {
    ctx.fillText(line, 588, titleStartY + idx * 31);
  });

  // 5. DÍA / HORA / LUGAR (Con íconos oficiales)
  const metaStartY = titleStartY + Math.max(2, tituloLines.length) * 31 + 12;
  const metaX = 198;
  const fechaTexto = formatearFechaOficialFlyer(data.fechaJueves);
  const horaTexto = String(data.horario || '11:00 a.m.').trim();
  const lugarTexto = String(
    data.lugar || 'Auditorio de la Escuela de Ingeniería Industrial'
  ).trim();

  // Día
  drawCalendarIcon(ctx, metaX, metaStartY - 21);
  ctx.textAlign = 'left';
  ctx.fillStyle = NAVY;
  ctx.font = '800 24px Poppins, "Segoe UI", Arial, sans-serif';
  ctx.fillText('Día:', metaX + 34, metaStartY);
  const wDia = ctx.measureText('Día: ').width;
  ctx.font = '500 24px "Segoe UI", Poppins, Arial, sans-serif';
  ctx.fillText(fechaTexto, metaX + 34 + wDia, metaStartY);

  // Hora
  const horaY = metaStartY + 38;
  drawClockCheckIcon(ctx, metaX, horaY - 21);
  ctx.font = '800 24px Poppins, "Segoe UI", Arial, sans-serif';
  ctx.fillText('Hora:', metaX + 34, horaY);
  const wHora = ctx.measureText('Hora: ').width;
  ctx.font = '500 24px "Segoe UI", Poppins, Arial, sans-serif';
  ctx.fillText(horaTexto, metaX + 34 + wHora, horaY);

  // Lugar
  const lugarY = horaY + 38;
  drawPinIcon(ctx, metaX, lugarY - 21);
  ctx.font = '800 24px Poppins, "Segoe UI", Arial, sans-serif';
  ctx.fillText('Lugar:', metaX + 34, lugarY);
  const wLugar = ctx.measureText('Lugar: ').width;
  ctx.font = '800 24px Poppins, "Segoe UI", Arial, sans-serif';
  const lugarShort =
    ctx.measureText(lugarTexto).width > 740 ? `${lugarTexto.slice(0, 56)}…` : lugarTexto;
  ctx.fillText(lugarShort, metaX + 34 + wLugar, lugarY);

  // 6. FILAS CON PÍLDORAS AZULES: BACHILLER · JURADO EVALUADOR · ASESOR
  const pillX = 160;
  const pillW = 192;
  const iconCx = 114;
  const rightTextX = pillX + pillW + 18;

  // Separar 1 o 2 bachilleres (admite segundoBachiller, salto de línea o "/")
  const bachilleresRaw: string[] = [];
  String(data.tesistaNombre || 'TESISTA')
    .split(/\n|\s*\/\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((n) => bachilleresRaw.push(n.toUpperCase()));
  if (data.segundoBachiller && data.segundoBachiller.trim()) {
    bachilleresRaw.push(data.segundoBachiller.trim().toUpperCase());
  }
  const bachilleres = bachilleresRaw.slice(0, 2);

  // --- Fila 1: BACHILLER ---
  const row1Y = Math.max(lugarY + 34, esReprog ? 522 : 508);
  drawPersonIcon(ctx, iconCx, row1Y + 22);
  ctx.fillStyle = BLUE;
  drawRoundedRect(ctx, pillX, row1Y, pillW, 48, 16);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.font = '600 22px "Segoe UI", Poppins, Arial, sans-serif';
  ctx.fillText(bachilleres.length > 1 ? 'BACHILLERES' : 'BACHILLER', pillX + pillW / 2, row1Y + 31);

  ctx.textAlign = 'left';
  ctx.fillStyle = NAVY;
  ctx.font = '800 24px Poppins, "Segoe UI", Arial, sans-serif';
  if (bachilleres.length === 1) {
    const lines = wrapTextLines(ctx, bachilleres[0], W - rightTextX - 36, 2);
    lines.forEach((ln, i) => {
      ctx.fillText(ln, rightTextX, row1Y + (lines.length === 1 ? 32 : 24 + i * 30));
    });
  } else {
    bachilleres.forEach((nombre, i) => {
      ctx.fillText(nombre, rightTextX, row1Y + 26 + i * 34);
    });
  }

  // --- Fila 2: JURADO EVALUADOR ---
  const row2Y = row1Y + (bachilleres.length > 1 ? 80 : 68);
  const row2H = 114;
  drawJuryBenchIcon(ctx, iconCx, row2Y + row2H / 2);
  ctx.fillStyle = BLUE;
  drawRoundedRect(ctx, pillX, row2Y, pillW, row2H, 16);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.font = '600 22px "Segoe UI", Poppins, Arial, sans-serif';
  ctx.fillText('JURADO', pillX + pillW / 2, row2Y + 49);
  ctx.fillText('EVALUADOR', pillX + pillW / 2, row2Y + 80);

  const jurados = [
    data.juradoPresidente || 'Por confirmar',
    data.juradoSecretario || 'Por confirmar',
    data.juradoVocal || 'Por confirmar'
  ];
  ctx.textAlign = 'left';
  ctx.fillStyle = NAVY;
  ctx.font = '500 24px "Segoe UI", Poppins, Arial, sans-serif';
  jurados.forEach((nombre, i) => {
    const jy = row2Y + 30 + i * 36;
    drawDoubleChevron(ctx, rightTextX, jy - 8);
    ctx.fillText(nombre, rightTextX + 30, jy);
  });

  // --- Fila 3: ASESOR ---
  const row3Y = row2Y + row2H + 22;
  drawAdvisorIcon(ctx, iconCx, row3Y + 23);
  ctx.fillStyle = BLUE;
  drawRoundedRect(ctx, pillX, row3Y, pillW, 48, 16);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.font = '600 22px "Segoe UI", Poppins, Arial, sans-serif';
  ctx.fillText('ASESOR', pillX + pillW / 2, row3Y + 31);

  ctx.textAlign = 'left';
  ctx.fillStyle = NAVY;
  ctx.font = '500 24px "Segoe UI", Poppins, Arial, sans-serif';
  drawDoubleChevron(ctx, rightTextX, row3Y + 24);
  ctx.fillText(data.asesor || 'Por confirmar', rightTextX + 30, row3Y + 32);

  // 7. PIE OFICIAL CON DIRECTOR DE ESCUELA Y AÑO GRANDE
  ctx.fillStyle = '#ECEFF4';
  ctx.fillRect(0, bodyBottom, W, footerHeight);

  // Curva azul marino decorativa inferior izquierda
  ctx.save();
  ctx.beginPath();
  ctx.arc(14, H + 8, 92, -Math.PI / 2, 0);
  ctx.lineTo(14, H + 8);
  ctx.closePath();
  ctx.fillStyle = BLUE;
  ctx.fill();
  ctx.restore();

  // Director de Escuela centrado
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0F172A';
  ctx.font = '800 22px Poppins, "Segoe UI", Arial, sans-serif';
  ctx.fillText(data.directorNombre || DEFAULT_DIRECTOR_NOMBRE, W / 2 + 24, bodyBottom + 30);
  ctx.font = '700 20px Poppins, "Segoe UI", Arial, sans-serif';
  ctx.fillText(data.directorCargo || DEFAULT_DIRECTOR_CARGO, W / 2 + 24, bodyBottom + 57);

  // Año grande en la esquina inferior derecha
  ctx.textAlign = 'right';
  ctx.fillStyle = '#4B5598';
  ctx.font = '800 68px Poppins, "Segoe UI", Arial, sans-serif';
  ctx.fillText(extraerAnio(data.fechaJueves), W - 26, H - 14);

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
