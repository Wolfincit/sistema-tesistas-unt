/**
 * Motor de Despacho de Correos Institucionales y Flyers — Secretaría Ing. Industrial UNT (Srta. Celia)
 *
 * - Viene pre-vinculado por defecto al correo institucional @unitru.edu.pe de Secretaría (cchau@unitru.edu.pe).
 * - Envía los correos y flyers directamente desde el sistema por HTTPS (puerto 443) sin abrir pestañas externas:
 *   1) API HTTPS Brevo / Resend (puerto 443, compatible con Render y servidores UNT).
 *   2) Google Workspace OAuth 2.0 (@unitru.edu.pe vía HTTPS sin contraseña de aplicación).
 *   3) Conector HTTPS institucional preconfigurado en servidor (UNT_GAS_WEBHOOK_URL).
 *   4) SMTP TLS nativo cuando el servidor permite salida por puerto 465.
 */

import tls from 'node:tls';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  sendGoogleOAuthMail,
  getGoogleOAuthMailStatus,
  hydrateOAuthFromTurso
} from './googleDriveEngine.mjs';

const DEFAULT_UNT_EMAIL = 'cchau@unitru.edu.pe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RUNTIME_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'unt-tesistas-runtime')
  : __dirname;
if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });
const EMAIL_CONFIG_PATH = path.join(RUNTIME_DIR, '.email-config.json');

function readEmailConfig() {
  try {
    if (!fs.existsSync(EMAIL_CONFIG_PATH)) {
      return {
        senderEmail: process.env.UNT_SMTP_EMAIL || DEFAULT_UNT_EMAIL,
        senderName:
          process.env.UNT_SMTP_NAME ||
          'Srta. Celia — Secretaría Académica Ing. Industrial UNT',
        appPassword: process.env.UNT_SMTP_PASSWORD || '',
        appsScriptUrl: process.env.UNT_GAS_WEBHOOK_URL || '',
        brevoApiKey: process.env.UNT_BREVO_API_KEY || '',
        brevoSenderEmail: process.env.UNT_BREVO_SENDER_EMAIL || process.env.UNT_SMTP_EMAIL || '',
        resendApiKey: process.env.UNT_RESEND_API_KEY || '',
        resendFromEmail: process.env.UNT_RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        smtpHost: process.env.UNT_SMTP_HOST || 'smtp.gmail.com',
        smtpPort: Number(process.env.UNT_SMTP_PORT || 465)
      };
    }
    const raw = JSON.parse(fs.readFileSync(EMAIL_CONFIG_PATH, 'utf-8'));
    return {
      senderEmail: raw.senderEmail || process.env.UNT_SMTP_EMAIL || DEFAULT_UNT_EMAIL,
      senderName:
        raw.senderName ||
        process.env.UNT_SMTP_NAME ||
        'Srta. Celia — Secretaría Académica Ing. Industrial UNT',
      appPassword: process.env.UNT_SMTP_PASSWORD || raw.appPassword || '',
      appsScriptUrl: process.env.UNT_GAS_WEBHOOK_URL || raw.appsScriptUrl || '',
      brevoApiKey: process.env.UNT_BREVO_API_KEY || '',
      brevoSenderEmail: process.env.UNT_BREVO_SENDER_EMAIL || process.env.UNT_SMTP_EMAIL || '',
      resendApiKey: process.env.UNT_RESEND_API_KEY || '',
      resendFromEmail: process.env.UNT_RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      smtpHost: process.env.UNT_SMTP_HOST || raw.smtpHost || 'smtp.gmail.com',
      smtpPort: Number(process.env.UNT_SMTP_PORT || raw.smtpPort || 465)
    };
  } catch {
    return {
      senderEmail: process.env.UNT_SMTP_EMAIL || DEFAULT_UNT_EMAIL,
      senderName: 'Srta. Celia — Secretaría Académica Ing. Industrial UNT',
      appPassword: process.env.UNT_SMTP_PASSWORD || '',
      appsScriptUrl: process.env.UNT_GAS_WEBHOOK_URL || '',
      brevoApiKey: process.env.UNT_BREVO_API_KEY || '',
      brevoSenderEmail: process.env.UNT_BREVO_SENDER_EMAIL || '',
      resendApiKey: process.env.UNT_RESEND_API_KEY || '',
      resendFromEmail: process.env.UNT_RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 465
    };
  }
}

export function getEmailStatus() {
  const cfg = readEmailConfig();
  const oauth = getGoogleOAuthMailStatus();
  const hasCloudApi = Boolean(
    cfg.brevoApiKey ||
      cfg.resendApiKey ||
      (cfg.appsScriptUrl && cfg.appsScriptUrl.startsWith('https://script.google.com/'))
  );
  const hasSmtp = Boolean((cfg.senderEmail || process.env.UNT_SMTP_EMAIL) && cfg.appPassword);
  return {
    configured: Boolean(oauth.email || cfg.senderEmail),
    serverTransportReady: Boolean(oauth.connected || hasCloudApi || hasSmtp),
    mode: oauth.connected
      ? 'google-oauth'
      : hasCloudApi
      ? 'cloud-https'
      : hasSmtp
      ? 'smtp'
      : 'unitru-prelinked',
    oauthConfigured: oauth.configured,
    oauthConnected: oauth.connected,
    oauthEmail: oauth.email,
    senderEmail: oauth.email || cfg.senderEmail || DEFAULT_UNT_EMAIL,
    senderName:
      cfg.senderName || 'Srta. Celia — Secretaría Académica Ing. Industrial UNT',
    smtpHost: cfg.smtpHost || 'smtp.gmail.com'
  };
}

export async function getEmailStatusHydrated() {
  await hydrateOAuthFromTurso(false);
  return getEmailStatus();
}

export function saveEmailConfig({
  senderEmail,
  senderName,
  appPassword,
  appsScriptUrl,
  smtpHost = 'smtp.gmail.com',
  smtpPort = 465
}) {
  const cleanEmail = String(senderEmail || '').trim().toLowerCase();
  const cleanPass = String(appPassword || '').replace(/\s+/g, '').trim();
  const cleanGasUrl = String(appsScriptUrl || '').trim();
  const cleanName = String(
    senderName || 'Srta. Celia — Secretaría Académica Ing. Industrial UNT'
  ).trim();
  if (!cleanEmail || !cleanEmail.endsWith('@unitru.edu.pe')) {
    throw new Error('Ingrese un correo institucional válido terminado en @unitru.edu.pe.');
  }
  const existing = readEmailConfig();
  const data = {
    senderEmail: cleanEmail,
    senderName: cleanName,
    appPassword: cleanPass || existing.appPassword || '',
    appsScriptUrl: cleanGasUrl || existing.appsScriptUrl || '',
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
function buildMimeMessagePayload({
  fromEmail,
  fromName,
  replyTo,
  toList,
  subject,
  htmlBody,
  attachment
}) {
  const boundary = `----=_UNT_Industrial_Boundary_${Date.now().toString(16)}`;
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;
  const encodedFromName = `=?UTF-8?B?${Buffer.from(fromName, 'utf-8').toString('base64')}?=`;
  const headers = [
    `From: "${encodedFromName}" <${fromEmail}>`,
    `Reply-To: ${replyTo || fromEmail}`,
    `To: ${toList.join(', ')}`,
    `Subject: ${encodedSubject}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/related; boundary="${boundary}"`
  ];

  const htmlBase64 = Buffer.from(htmlBody, 'utf-8')
    .toString('base64')
    .replace(/(.{76})/g, '$1\r\n');
  const bodyParts = [
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    htmlBase64
  ];

  if (attachment && attachment.base64Data) {
    const cleanB64 = attachment.base64Data
      .replace(/^data:[^;]+;base64,/, '')
      .replace(/\s+/g, '');
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
}

function sendSmtpTlsMail({
  host,
  port,
  user,
  pass,
  fromName,
  replyTo,
  toList,
  subject,
  htmlBody,
  attachment,
  timeoutMs = 4500
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

    const buildMimeMessage = () =>
      buildMimeMessagePayload({
        fromEmail: user,
        fromName,
        replyTo,
        toList,
        subject,
        htmlBody,
        attachment
      });

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
  const subjectFinal = String(
    asunto || 'Comunicado Oficial — Escuela de Ingeniería Industrial UNT'
  ).trim();
  const textFinal = String(mensaje || '').trim();

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
        Enviado por: <strong>${cfg.senderName}</strong> (${cfg.senderEmail || 'industrial@unitru.edu.pe'})<br/>
        Secretaría Académica — Escuela Profesional de Ingeniería Industrial UNT
      </div>
    </div>
  `;

  // 0. VÍA GOOGLE WORKSPACE OAUTH 2.0 HTTPS (Envía desde la misma cuenta @unitru.edu.pe sin contraseña de aplicación)
  try {
    const rawMime = buildMimeMessagePayload({
      fromEmail: cfg.senderEmail || DEFAULT_UNT_EMAIL,
      fromName: cfg.senderName,
      replyTo: cfg.senderEmail || DEFAULT_UNT_EMAIL,
      toList: todos,
      subject: subjectFinal,
      htmlBody,
      attachment
    });
    const rawMimeBase64Url = Buffer.from(rawMime, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const oauthResult = await sendGoogleOAuthMail({ rawMimeBase64Url });
    if (oauthResult.sent) {
      return {
        ok: true,
        mode: 'smtp-direct',
        recipientsCount: todos.length,
        recipients: todos,
        message: `Correo enviado directamente desde ${cfg.senderEmail || DEFAULT_UNT_EMAIL} a ${todos.join(', ')}.`
      };
    }
  } catch {
    // Continúa a las demás vías HTTPS
  }

  // 1. VÍA CLOUD HTTPS (Puerto 443): Brevo API v3 (preconfigurado en el servidor sin pedir claves a la secretaria)
  if (cfg.brevoApiKey) {
    const senderMailbox = cfg.brevoSenderEmail || cfg.senderEmail;
    if (!senderMailbox) {
      throw new Error('Falta correo remitente verificado en el servidor para Brevo.');
    }
    const cleanB64 = attachment
      ? attachment.base64Data.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '')
      : '';
    const htmlWithDataImg = attachment
      ? htmlBody.replace('cid:flyer_unt_cid', attachment.base64Data)
      : htmlBody;
    const brevoBody = {
      sender: { name: cfg.senderName, email: senderMailbox },
      replyTo: cfg.senderEmail ? { name: cfg.senderName, email: cfg.senderEmail } : undefined,
      to: todos.map((email) => ({ email })),
      subject: subjectFinal,
      htmlContent: htmlWithDataImg,
      attachment: cleanB64
        ? [{ content: cleanB64, name: attachment.fileName || 'Flyer_UNT.png' }]
        : undefined
    };
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': cfg.brevoApiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(brevoBody)
    });
    if (brevoRes.ok) {
      return {
        ok: true,
        mode: 'smtp-direct',
        recipientsCount: todos.length,
        recipients: todos,
        message: `Correo enviado directamente a ${todos.join(', ')} (con respuesta a ${cfg.senderEmail || senderMailbox}).`
      };
    }
    const brevoErr = await brevoRes.text().catch(() => '');
    throw new Error(`No se pudo despachar por Brevo (${brevoRes.status}): ${brevoErr.slice(0, 160)}`);
  }

  // 2. VÍA CLOUD HTTPS (Puerto 443): Resend API
  if (cfg.resendApiKey) {
    const cleanB64 = attachment
      ? attachment.base64Data.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '')
      : '';
    const htmlWithDataImg = attachment
      ? htmlBody.replace('cid:flyer_unt_cid', attachment.base64Data)
      : htmlBody;
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${cfg.senderName} <${cfg.resendFromEmail}>`,
        reply_to: cfg.senderEmail || undefined,
        to: todos,
        subject: subjectFinal,
        html: htmlWithDataImg,
        attachments: cleanB64
          ? [{ filename: attachment.fileName || 'Flyer_UNT.png', content: cleanB64 }]
          : undefined
      })
    });
    if (resendRes.ok) {
      return {
        ok: true,
        mode: 'smtp-direct',
        recipientsCount: todos.length,
        recipients: todos,
        message: `Correo enviado directamente a ${todos.join(', ')} (con respuesta a ${cfg.senderEmail || cfg.resendFromEmail}).`
      };
    }
    const resendErr = await resendRes.text().catch(() => '');
    throw new Error(`No se pudo despachar por Resend (${resendRes.status}): ${resendErr.slice(0, 160)}`);
  }

  // 3. VÍA CLOUD HTTPS (Puerto 443): Conector Google Workspace preconfigurado por el administrador (UNT_GAS_WEBHOOK_URL)
  if (cfg.appsScriptUrl && cfg.appsScriptUrl.startsWith('https://script.google.com/')) {
    const cleanB64 = attachment
      ? attachment.base64Data.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '')
      : '';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);
    const gasRes = await fetch(cfg.appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow',
      signal: controller.signal,
      body: JSON.stringify({
        toList: todos,
        subject: subjectFinal,
        textBody: textFinal,
        htmlBody,
        fromName: cfg.senderName,
        replyTo: cfg.senderEmail || undefined,
        flyerBase64: cleanB64 || undefined,
        flyerMime: attachment?.mimeType || undefined,
        flyerName: attachment?.fileName || undefined
      })
    });
    clearTimeout(timer);
    if (gasRes.ok) {
      return {
        ok: true,
        mode: 'smtp-direct',
        recipientsCount: todos.length,
        recipients: todos,
        message: `Correo enviado directamente a ${todos.join(', ')} desde el sistema.`
      };
    }
    throw new Error(`El conector HTTPS del servidor respondió con estado ${gasRes.status}.`);
  }

  // 4. VÍA SMTP TLS NATIVO (Funciona en servidor local / campus UNT si hay contraseña de envío de sistema o SMTP)
  const smtpUser = process.env.UNT_SMTP_EMAIL || cfg.senderEmail;
  if (smtpUser && cfg.appPassword) {
    await sendSmtpTlsMail({
      host: cfg.smtpHost,
      port: cfg.smtpPort,
      user: smtpUser,
      pass: cfg.appPassword,
      fromName: cfg.senderName,
      replyTo: cfg.senderEmail || smtpUser,
      toList: todos,
      subject: subjectFinal,
      htmlBody,
      attachment
    });
    return {
      ok: true,
      mode: 'smtp-direct',
      recipientsCount: todos.length,
      recipients: todos,
      message: `Correo y flyer enviados directamente desde el sistema a ${todos.join(', ')}.`
    };
  }

  throw new Error(
    'Falta la llave de transporte de correo en el servidor (Render bloquea SMTP 465 por defecto). Agregue UNT_BREVO_API_KEY, UNT_RESEND_API_KEY o UNT_GAS_WEBHOOK_URL en las variables de entorno del servidor.'
  );
}
