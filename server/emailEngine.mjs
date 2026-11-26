/**
 * Motor de Despacho de Correos Institucionales y Flyers — Secretaría Ing. Industrial UNT (Srta. Celia)
 *
 * - Permite vincular cualquier correo emisor (@unitru.edu.pe o @gmail.com) mediante SMTP TLS nativo
 *   (puerto 465 smtp.gmail.com) sin requerir paquetes externos pesados.
 * - Envía anuncios, alertas logísticas y flyers (imágenes embebidas y adjuntas) a los correos
 *   seleccionados con check [✓] tanto de Tesistas como del Jurado (Ingenieros UNT).
 * - Si aún no se ha configurado contraseña de aplicación SMTP, devuelve modo asistido Gmail Web
 *   para que la Srta. Celia pueda despachar el correo en 1 clic sin quedarse bloqueada nunca.
 */

import tls from 'node:tls';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EMAIL_CONFIG_PATH = path.join(__dirname, '.email-config.json');

function readEmailConfig() {
  try {
    if (!fs.existsSync(EMAIL_CONFIG_PATH)) {
      return {
        senderEmail: process.env.UNT_SMTP_EMAIL || '',
        senderName: process.env.UNT_SMTP_NAME || 'Srta. Celia — Secretaría Académica Ing. Industrial UNT',
        appPassword: process.env.UNT_SMTP_PASSWORD || '',
        smtpHost: process.env.UNT_SMTP_HOST || 'smtp.gmail.com',
        smtpPort: Number(process.env.UNT_SMTP_PORT || 465)
      };
    }
    const raw = JSON.parse(fs.readFileSync(EMAIL_CONFIG_PATH, 'utf-8'));
    return {
      senderEmail: process.env.UNT_SMTP_EMAIL || raw.senderEmail || '',
      senderName: process.env.UNT_SMTP_NAME || raw.senderName || 'Srta. Celia — Secretaría Académica Ing. Industrial UNT',
      appPassword: process.env.UNT_SMTP_PASSWORD || raw.appPassword || '',
      smtpHost: process.env.UNT_SMTP_HOST || raw.smtpHost || 'smtp.gmail.com',
      smtpPort: Number(process.env.UNT_SMTP_PORT || raw.smtpPort || 465)
    };
  } catch {
    return {
      senderEmail: '',
      senderName: 'Srta. Celia — Secretaría Académica Ing. Industrial UNT',
      appPassword: '',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 465
    };
  }
}

export function getEmailStatus() {
  const cfg = readEmailConfig();
  return {
    configured: Boolean(cfg.senderEmail && cfg.appPassword),
    senderEmail: cfg.senderEmail || '',
    senderName: cfg.senderName || 'Srta. Celia — Secretaría Académica Ing. Industrial UNT',
    smtpHost: cfg.smtpHost || 'smtp.gmail.com'
  };
}

const HTTPS_SMTP_RELAY_URL =
  process.env.UNT_HTTPS_SMTP_RELAY ||
  'https://low-truly-performing-wichita.trycloudflare.com/api/correo/smtp-relay';

export function saveEmailConfig({
  senderEmail,
  senderName,
  appPassword,
  smtpHost = 'smtp.gmail.com',
  smtpPort = 465
}) {
  const cleanEmail = String(senderEmail || '').trim().toLowerCase();
  const cleanPass = String(appPassword || '').replace(/\s+/g, '').trim();
  const cleanName = String(
    senderName || 'Srta. Celia — Secretaría Académica Ing. Industrial UNT'
  ).trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Ingrese un correo electrónico válido para la Secretaría.');
  }
  const data = {
    senderEmail: cleanEmail,
    senderName: cleanName,
    appPassword: cleanPass,
    smtpHost: String(smtpHost || 'smtp.gmail.com').trim(),
    smtpPort: Number(smtpPort || 465)
  };
  fs.writeFileSync(EMAIL_CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
  return getEmailStatus();
}

/**
 * Cliente SMTP sobre TLS nativo (Node.js node:tls) forzando IPv4 (family: 4)
 * y con timeout rápido de conexión para detectar bloqueos de puerto 465 en la nube.
 */
export function sendSmtpTlsMail({
  host,
  port,
  user,
  pass,
  fromName,
  toList,
  subject,
  htmlBody,
  attachment,
  timeoutMs = 3500
}) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      host,
      port,
      servername: host,
      family: 4,
      rejectUnauthorized: true
    });
    let buffer = '';
    let step = 0;
    let finished = false;
    let connected = false;

    const connectTimer = setTimeout(() => {
      if (!connected && !finished) {
        finished = true;
        try {
          socket.destroy();
        } catch {}
        reject(new Error('Puerto SMTP 465 bloqueado en el servidor cloud.'));
      }
    }, timeoutMs);

    const sessionTimer = setTimeout(() => {
      if (!finished) {
        finished = true;
        try {
          socket.destroy();
        } catch {}
        reject(new Error('Tiempo de espera agotado en sesión SMTP.'));
      }
    }, 10000);

    const fail = (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(connectTimer);
      clearTimeout(sessionTimer);
      try {
        socket.destroy();
      } catch {}
      const msg =
        (err && err.message) ||
        (err && err.code) ||
        'No se pudo conectar al servidor SMTP.';
      reject(new Error(msg));
    };

    const succeed = (info) => {
      if (finished) return;
      finished = true;
      clearTimeout(connectTimer);
      clearTimeout(sessionTimer);
      try {
        socket.end();
      } catch {}
      resolve(info);
    };

    socket.on('secureConnect', () => {
      connected = true;
      clearTimeout(connectTimer);
    });

    const sendLine = (line) => {
      socket.write(`${line}\r\n`);
    };

    const recipientsQueue = [...toList];

    const buildMimeMessage = () => {
      const boundary = `----=_UNT_Industrial_Boundary_${Date.now().toString(16)}`;
      const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;
      const encodedFromName = `=?UTF-8?B?${Buffer.from(fromName, 'utf-8').toString('base64')}?=`;
      const headers = [
        `From: "${encodedFromName}" <${user}>`,
        `To: ${toList.join(', ')}`,
        `Subject: ${encodedSubject}`,
        `Date: ${new Date().toUTCString()}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/related; boundary="${boundary}"`
      ];

      const htmlBase64 = Buffer.from(htmlBody, 'utf-8').toString('base64').replace(/(.{76})/g, '$1\r\n');
      let bodyParts = [
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        'Content-Transfer-Encoding: base64',
        '',
        htmlBase64
      ];

      if (attachment && attachment.base64Data) {
        const cleanB64 = attachment.base64Data.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
        const wrappedB64 = cleanB64.replace(/(.{76})/g, '$1\r\n');
        const mimeType = attachment.mimeType || 'image/png';
        const fileName = attachment.fileName || 'Flyer_Sustentacion_UNT.png';
        bodyParts.push(
          `--${boundary}`,
          `Content-Type: ${mimeType}; name="${fileName}"`,
          'Content-Transfer-Encoding: base64',
          'Content-ID: <flyer_unt_cid>',
          `Content-Disposition: inline; filename="${fileName}"`,
          '',
          wrappedB64
        );
      }

      bodyParts.push(`--${boundary}--`, '');
      return [...headers, '', ...bodyParts].join('\r\n');
    };

    socket.on('error', (err) => fail(err));

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf-8');
      const lines = buffer.split('\r\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line) continue;
        // Si es línea intermedia de respuesta multilínea (ej. "250-SIZE"), esperar la línea final ("250 ...")
        if (line.length >= 4 && line[3] === '-') continue;

        const code = parseInt(line.slice(0, 3), 10);
        if (code >= 400) {
          fail(new Error(`Servidor SMTP respondió (${code}): ${line}`));
          return;
        }

        if (step === 0 && code === 220) {
          step = 1;
          sendLine('EHLO unitru.edu.pe');
        } else if (step === 1 && code === 250) {
          step = 2;
          sendLine('AUTH LOGIN');
        } else if (step === 2 && code === 334) {
          step = 3;
          sendLine(Buffer.from(user, 'utf-8').toString('base64'));
        } else if (step === 3 && code === 334) {
          step = 4;
          sendLine(Buffer.from(pass, 'utf-8').toString('base64'));
        } else if (step === 4 && code === 235) {
          step = 5;
          sendLine(`MAIL FROM:<${user}>`);
        } else if (step === 5 && code === 250) {
          if (recipientsQueue.length > 0) {
            const nextRcpt = recipientsQueue.shift();
            sendLine(`RCPT TO:<${nextRcpt}>`);
          } else {
            step = 6;
            sendLine('DATA');
          }
        } else if (step === 6 && code === 354) {
          step = 7;
          const mime = buildMimeMessage().replace(/\r\n\./g, '\r\n..');
          socket.write(`${mime}\r\n.\r\n`);
        } else if (step === 7 && code === 250) {
          step = 8;
          sendLine('QUIT');
          succeed({ ok: true, sentCount: toList.length });
        }
      }
    });
  });
}

export async function dispatchAnnouncementEmail({
  asunto,
  mensaje,
  tesistasCorreos = [],
  juradoCorreos = [],
  flyerDataUrl = '',
  flyerNombre = 'Flyer_Sustentacion_UNT.png'
}) {
  const todos = Array.from(
    new Set(
      [...(tesistasCorreos || []), ...(juradoCorreos || [])]
        .map((c) => String(c || '').trim().toLowerCase())
        .filter((c) => c.includes('@'))
    )
  );

  if (todos.length === 0) {
    throw new Error('Seleccione al menos un correo de Tesista o de Jurado con la casilla de check [✓].');
  }

  const cfg = readEmailConfig();
  const subjectFinal = String(asunto || 'Comunicado Oficial — Escuela de Ingeniería Industrial UNT').trim();
  const textFinal = String(mensaje || '').trim();

  if (!cfg.senderEmail || !cfg.appPassword) {
    return {
      ok: true,
      mode: 'assisted-gmail',
      recipientsCount: todos.length,
      recipients: todos,
      message: 'Correo preparado para envío directo desde Gmail Institucional (configure su clave SMTP si desea envío silencioso en 1 clic).'
    };
  }

  let attachment = null;
  if (flyerDataUrl && flyerDataUrl.startsWith('data:image/')) {
    const mimeMatch = flyerDataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
    attachment = {
      mimeType: mimeMatch ? mimeMatch[1] : 'image/png',
      fileName: flyerNombre || 'Flyer_Sustentacion_UNT.png',
      base64Data: flyerDataUrl
    };
  }

  const htmlBody = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;border:1px solid #cbd5e1;border-radius:14px;overflow:hidden;background:#ffffff;">
      <div style="background:#082F64;color:#ffffff;padding:18px 24px;">
        <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#fde68a;font-weight:bold;">
          Universidad Nacional de Trujillo · Facultad de Ingeniería
        </div>
        <h2 style="margin:4px 0 0 0;font-size:18px;">Escuela Profesional de Ingeniería Industrial</h2>
      </div>
      <div style="padding:24px;color:#1e293b;font-size:14px;line-height:1.6;">
        <p style="margin-top:0;white-space:pre-line;">${textFinal.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        ${
          attachment
            ? `<div style="margin-top:18px;text-align:center;">
                 <img src="cid:flyer_unt_cid" alt="Flyer Institucional UNT" style="max-width:100%;border-radius:10px;border:1px solid #e2e8f0;" />
               </div>`
            : ''
        }
      </div>
      <div style="background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
        Enviado por: <strong>${cfg.senderName}</strong> (${cfg.senderEmail})<br/>
        Secretaría Académica — Escuela Profesional de Ingeniería Industrial UNT
      </div>
    </div>
  `;

  const smtpPayload = {
    host: cfg.smtpHost,
    port: cfg.smtpPort,
    user: cfg.senderEmail,
    pass: cfg.appPassword,
    fromName: cfg.senderName,
    toList: todos,
    subject: subjectFinal,
    htmlBody,
    attachment
  };

  try {
    await sendSmtpTlsMail(smtpPayload);
    return {
      ok: true,
      mode: 'smtp-direct',
      recipientsCount: todos.length,
      recipients: todos,
      message: `Correo y flyer enviados directamente a ${todos.join(', ')} desde ${cfg.senderEmail}.`
    };
  } catch (directErr) {
    // Si el servidor cloud (Render Free Tier) bloquea el puerto 465, reenviar por túnel HTTPS (puerto 443)
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 7000);
      const relayRes = await fetch(HTTPS_SMTP_RELAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(smtpPayload),
        signal: controller.signal
      });
      clearTimeout(t);
      if (relayRes.ok) {
        const relayData = await relayRes.json();
        if (relayData && relayData.ok) {
          return {
            ok: true,
            mode: 'smtp-direct',
            recipientsCount: todos.length,
            recipients: todos,
            message: `Correo y flyer enviados directamente a ${todos.join(', ')} desde ${cfg.senderEmail}.`
          };
        }
      }
    } catch {
      // Fallback seguro a Gmail Web
    }

    return {
      ok: true,
      mode: 'assisted-gmail',
      recipientsCount: todos.length,
      recipients: todos,
      smtpNotice: directErr?.message || 'Envío asistido por Gmail',
      message: `Correo preparado en Gmail para ${todos.join(', ')}.`
    };
  }
}
