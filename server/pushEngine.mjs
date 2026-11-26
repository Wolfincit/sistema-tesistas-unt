/**
 * Motor Nativo de Notificaciones Web Push (RFC 8291 aes128gcm + RFC 8292 VAPID ES256)
 * y Bandeja Persistente de Avisos — Escuela de Ingeniería Industrial UNT.
 *
 * - Cero dependencias externas (usa exclusivamente node:crypto, node:fs y fetch nativos).
 * - Compatible con Chrome/Android, Edge/Windows y Safari iOS 16.4+ (PWA instalada).
 * - Mantiene registro persistente de avisos por matrícula para que incluso usuarios sin
 *   permiso push vean sus alertas dentro del sistema.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { isTursoConfigured, tursoGetJson, tursoSetJson } from './tursoEngine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RUNTIME_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'unt-tesistas-runtime')
  : __dirname;
if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });

const VAPID_FILE = path.join(RUNTIME_DIR, '.push-vapid.json');
const SUBS_FILE = path.join(RUNTIME_DIR, '.push-subscriptions.json');
const NOTIFS_FILE = path.join(RUNTIME_DIR, '.notificaciones-log.json');
const REMINDERS_FILE = path.join(RUNTIME_DIR, '.push-reminders-sent.json');

function b64urlEncode(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function b64urlDecode(str) {
  const clean = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = '='.repeat((4 - (clean.length % 4)) % 4);
  return Buffer.from(clean + pad, 'base64');
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

const TURSO_FILE_MAP = {
  [VAPID_FILE]: 'push_vapid',
  [SUBS_FILE]: 'push_subscriptions',
  [NOTIFS_FILE]: 'push_notifications_log',
  [REMINDERS_FILE]: 'push_reminders_sent'
};

let pendingTursoPushWrites = [];
let lastPushHydrateAt = 0;

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  const tursoKey = TURSO_FILE_MAP[filePath];
  if (tursoKey && isTursoConfigured()) {
    const p = tursoSetJson(tursoKey, data).catch(() => {});
    pendingTursoPushWrites.push(p);
  }
}

export async function flushPushTursoWrites() {
  if (pendingTursoPushWrites.length === 0) return;
  const batch = pendingTursoPushWrites.splice(0);
  await Promise.all(batch);
}

export async function hydratePushStateFromTurso(force = false) {
  if (!isTursoConfigured()) return false;
  if (!force && Date.now() - lastPushHydrateAt < 10000) return true;
  lastPushHydrateAt = Date.now();
  try {
    const [remoteVapid, remoteSubs, remoteNotifs, remoteReminders] = await Promise.all([
      tursoGetJson('push_vapid'),
      tursoGetJson('push_subscriptions'),
      tursoGetJson('push_notifications_log'),
      tursoGetJson('push_reminders_sent')
    ]);
    if (remoteVapid?.publicKey && remoteVapid?.privateKeyPem) {
      vapidCache = remoteVapid;
      fs.writeFileSync(VAPID_FILE, JSON.stringify(remoteVapid, null, 2), 'utf-8');
    }
    if (Array.isArray(remoteSubs)) {
      fs.writeFileSync(SUBS_FILE, JSON.stringify(remoteSubs, null, 2), 'utf-8');
    }
    if (Array.isArray(remoteNotifs)) {
      fs.writeFileSync(NOTIFS_FILE, JSON.stringify(remoteNotifs, null, 2), 'utf-8');
    }
    if (remoteReminders && typeof remoteReminders === 'object') {
      fs.writeFileSync(REMINDERS_FILE, JSON.stringify(remoteReminders, null, 2), 'utf-8');
    }
    return true;
  } catch (err) {
    console.warn('[Push Turso] No se pudo hidratar estado push:', err.message);
    return false;
  }
}

// ======================================================
// GESTIÓN DE LLAVES VAPID (P-256) — AUTO-GENERADAS O POR ENV
// ======================================================
let vapidCache = null;

export function getOrCreateVapidKeys() {
  if (vapidCache) return vapidCache;

  const envPub = String(process.env.UNT_VAPID_PUBLIC_KEY || '').trim();
  const envPrivPem = String(process.env.UNT_VAPID_PRIVATE_PEM || '').trim();
  const envSubject = String(process.env.UNT_VAPID_SUBJECT || 'mailto:cchau@unitru.edu.pe').trim();

  if (envPub && envPrivPem) {
    vapidCache = {
      publicKey: envPub,
      privateKeyPem: envPrivPem.replace(/\\n/g, '\n'),
      subject: envSubject
    };
    return vapidCache;
  }

  const saved = readJson(VAPID_FILE, null);
  if (saved?.publicKey && saved?.privateKeyPem) {
    vapidCache = {
      publicKey: saved.publicKey,
      privateKeyPem: saved.privateKeyPem,
      subject: saved.subject || envSubject
    };
    return vapidCache;
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1'
  });

  // Extraer clave pública cruda sin comprimir (65 bytes: 0x04 || X || Y)
  const spkiDer = publicKey.export({ type: 'spki', format: 'der' });
  const rawPub = spkiDer.subarray(spkiDer.length - 65);
  const publicKeyB64Url = b64urlEncode(rawPub);
  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

  vapidCache = {
    publicKey: publicKeyB64Url,
    privateKeyPem,
    subject: envSubject
  };
  writeJson(VAPID_FILE, vapidCache);
  return vapidCache;
}

export function getVapidPublicKey() {
  const keys = getOrCreateVapidKeys();
  const subs = readJson(SUBS_FILE, []);
  return {
    supported: true,
    publicKey: keys.publicKey,
    totalDispositivos: subs.length,
    dispositivosTesistas: subs.filter((s) => s.rol === 'tesista').length,
    dispositivosSecretaria: subs.filter((s) => s.rol === 'secretaria').length
  };
}

// ======================================================
// RFC 8292: FIRMA JWT VAPID (ES256 IEEE-P1363)
// ======================================================
export function createVapidAuthHeader(endpointUrl) {
  const keys = getOrCreateVapidKeys();
  const u = new URL(endpointUrl);
  const audience = `${u.protocol}//${u.host}`;
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;

  const header = b64urlEncode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const payload = b64urlEncode(JSON.stringify({ aud: audience, exp, sub: keys.subject }));
  const unsigned = `${header}.${payload}`;

  const sign = crypto.createSign('SHA256');
  sign.update(unsigned);
  sign.end();
  const signature = sign.sign({
    key: keys.privateKeyPem,
    dsaEncoding: 'ieee-p1363'
  });

  const jwt = `${unsigned}.${b64urlEncode(signature)}`;
  return `vapid t=${jwt}, k=${keys.publicKey}`;
}

// ======================================================
// RFC 8291: CIFRADO DE PAYLOAD WEB PUSH (aes128gcm)
// ======================================================
export function encryptWebPushPayload(plaintextStr, clientPublicKeyB64Url, clientAuthB64Url) {
  const uaPublic = b64urlDecode(clientPublicKeyB64Url);
  const authSecret = b64urlDecode(clientAuthB64Url);
  if (uaPublic.length !== 65 || uaPublic[0] !== 0x04) {
    throw new Error('Clave pública p256dh inválida en la suscripción push.');
  }
  if (authSecret.length !== 16) {
    throw new Error('Secreto auth inválido en la suscripción push.');
  }

  const serverEcdh = crypto.createECDH('prime256v1');
  const asPublic = serverEcdh.generateKeys(); // 65 bytes sin comprimir
  const ecdhSecret = serverEcdh.computeSecret(uaPublic);
  const salt = crypto.randomBytes(16);

  // IKM = HKDF(salt=auth_secret, ikm=ecdh_secret, info="WebPush: info\0" || ua_public || as_public, len=32)
  const keyInfo = Buffer.concat([
    Buffer.from('WebPush: info\x00', 'utf8'),
    uaPublic,
    asPublic
  ]);
  const ikm = Buffer.from(crypto.hkdfSync('sha256', ecdhSecret, authSecret, keyInfo, 32));

  // CEK (16 bytes) y NONCE (12 bytes) con salt aleatorio
  const cekInfo = Buffer.from('Content-Encoding: aes128gcm\x00', 'utf8');
  const nonceInfo = Buffer.from('Content-Encoding: nonce\x00', 'utf8');
  const cek = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, cekInfo, 16));
  const nonce = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, nonceInfo, 12));

  // Delimitador final de registro RFC 8188: 0x02
  const plaintext = Buffer.concat([Buffer.from(plaintextStr, 'utf8'), Buffer.from([0x02])]);
  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Cabecera aes128gcm: salt (16) || rs (4, uint32BE = 4096) || idlen (1 = 65) || as_public (65)
  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(4096, 0);
  const idlen = Buffer.from([asPublic.length]);

  return Buffer.concat([salt, rs, idlen, asPublic, encrypted, tag]);
}

// ======================================================
// SUSCRIPCIONES POR DISPOSITIVO Y MATRÍCULA
// ======================================================
export function registerPushSubscription(body = {}) {
  const sub = body.subscription || body;
  const endpoint = String(sub?.endpoint || '').trim();
  const p256dh = String(sub?.keys?.p256dh || '').trim();
  const auth = String(sub?.keys?.auth || '').trim();
  const codigoMatricula = String(body.codigoMatricula || '').replace(/\D/g, '').slice(0, 10);
  const rol = body.rol === 'secretaria' ? 'secretaria' : 'tesista';
  const nombre = String(body.nombre || '').trim().slice(0, 120);

  if (!endpoint || !p256dh || !auth) {
    throw new Error('Suscripción push incompleta (falta endpoint o llaves p256dh/auth).');
  }
  if (rol === 'tesista' && codigoMatricula.length !== 10) {
    throw new Error('Ingresa tu matrícula de 10 dígitos para vincular las alertas de tu tesis.');
  }

  const list = readJson(SUBS_FILE, []);
  const now = new Date().toISOString();
  const record = {
    endpoint,
    keys: { p256dh, auth },
    codigoMatricula: rol === 'secretaria' ? 'SECRETARIA' : codigoMatricula,
    rol,
    nombre: nombre || (rol === 'secretaria' ? 'Srta. Celia — Secretaría' : `Tesista ${codigoMatricula}`),
    updatedAt: now
  };

  const idx = list.findIndex((s) => s.endpoint === endpoint);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...record };
  } else {
    list.push({ ...record, createdAt: now });
  }
  writeJson(SUBS_FILE, list);

  return {
    ok: true,
    codigoMatricula: record.codigoMatricula,
    rol: record.rol,
    totalDispositivos: list.length
  };
}

export function unregisterPushSubscription(endpoint) {
  const clean = String(endpoint || '').trim();
  if (!clean) return { ok: true, removed: 0 };
  const list = readJson(SUBS_FILE, []);
  const next = list.filter((s) => s.endpoint !== clean);
  writeJson(SUBS_FILE, next);
  return { ok: true, removed: list.length - next.length };
}

export function getSubscriptionsStats() {
  const list = readJson(SUBS_FILE, []);
  const matriculasActivas = Array.from(
    new Set(list.filter((s) => s.rol === 'tesista').map((s) => s.codigoMatricula))
  );
  return {
    totalDispositivos: list.length,
    tesistasSuscritos: matriculasActivas.length,
    matriculasActivas,
    secretariaSuscrita: list.some((s) => s.rol === 'secretaria')
  };
}

// ======================================================
// BANDEJA PERSISTENTE DE AVISOS (IN-APP + PUSH)
// ======================================================
function appendNotificationLog({ codigoMatricula, title, body, url, tipo, tag }) {
  const logs = readJson(NOTIFS_FILE, []);
  const entry = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    codigoMatricula: String(codigoMatricula || '').trim() || 'GENERAL',
    title: String(title || 'Aviso de Tesis — Ing. Industrial UNT'),
    body: String(body || ''),
    url: String(url || '/'),
    tipo: String(tipo || 'estado'),
    tag: String(tag || 'unt-tesis'),
    createdAt: new Date().toISOString(),
    leida: false
  };
  const next = [entry, ...logs].slice(0, 400);
  writeJson(NOTIFS_FILE, next);
  return entry;
}

export function getNotificationsForMatricula(codigoMatricula) {
  const key = String(codigoMatricula || '').trim();
  if (!key) return [];
  const logs = readJson(NOTIFS_FILE, []);
  return logs.filter((n) => n.codigoMatricula === key || n.codigoMatricula === 'GENERAL').slice(0, 30);
}

export function markNotificationRead(id) {
  const logs = readJson(NOTIFS_FILE, []);
  const next = logs.map((n) => (n.id === id ? { ...n, leida: true } : n));
  writeJson(NOTIFS_FILE, next);
  return { ok: true };
}

// ======================================================
// DESPACHO REAL DE NOTIFICACIÓN WEB PUSH
// ======================================================
async function deliverRawPush(subscription, payloadObj) {
  const payloadStr = JSON.stringify(payloadObj);
  const encryptedBody = encryptWebPushPayload(
    payloadStr,
    subscription.keys.p256dh,
    subscription.keys.auth
  );
  const authHeader = createVapidAuthHeader(subscription.endpoint);

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      TTL: '86400',
      Urgency: 'high',
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      Authorization: authHeader
    },
    body: encryptedBody
  });

  return {
    ok: response.ok,
    status: response.status,
    expired: response.status === 404 || response.status === 410
  };
}

export async function dispatchPushNotification({
  codigoMatricula,
  rol = 'tesista',
  title,
  body,
  url = '/',
  tag = 'unt-tesis',
  tipo = 'estado',
  urgente = true
}) {
  const targetKey = rol === 'secretaria' ? 'SECRETARIA' : String(codigoMatricula || '').replace(/\D/g, '').slice(0, 10);
  if (!targetKey) {
    throw new Error('Se requiere matrícula de 10 dígitos o rol secretaria para notificar.');
  }

  // Guardar siempre en la bandeja interna para que el tesista lo vea aunque no tenga push activo
  const logged = appendNotificationLog({
    codigoMatricula: targetKey,
    title,
    body,
    url,
    tipo,
    tag
  });

  // Respetar silencio nocturno (22:00 a 07:00 hora Perú UTC-5) salvo cambio urgente hecho en vivo
  const horaPeru = (new Date().getUTCHours() + 19) % 24;
  if (!urgente && (horaPeru >= 22 || horaPeru < 7)) {
    return { ok: true, logged, pushedCount: 0, skippedReason: 'horario-nocturno' };
  }

  const allSubs = readJson(SUBS_FILE, []);
  const targets = allSubs.filter((s) => s.codigoMatricula === targetKey);
  if (targets.length === 0) {
    return { ok: true, logged, pushedCount: 0, skippedReason: 'sin-dispositivos-suscritos' };
  }

  const payload = {
    title,
    body,
    url,
    tag,
    icon: '/images/logo-industrial.png',
    badge: '/images/logo-unt.png',
    timestamp: Date.now()
  };

  let pushedCount = 0;
  const expiredEndpoints = new Set();

  for (const sub of targets) {
    try {
      const result = await deliverRawPush(sub, payload);
      if (result.ok) pushedCount += 1;
      else if (result.expired) expiredEndpoints.add(sub.endpoint);
    } catch {
      // No detener el flujo si falla un endpoint individual
    }
  }

  if (expiredEndpoints.size > 0) {
    writeJson(
      SUBS_FILE,
      allSubs.filter((s) => !expiredEndpoints.has(s.endpoint))
    );
  }

  return {
    ok: true,
    logged,
    pushedCount,
    expiredRemoved: expiredEndpoints.size
  };
}

// ======================================================
// RECORDATORIO AUTOMÁTICO DE VÍSPERA DE JUEVES (24h ANTES)
// ======================================================
export async function runThursdayRemindersCheck(sustentaciones = []) {
  if (!Array.isArray(sustentaciones) || sustentaciones.length === 0) {
    return { checked: 0, sent: 0 };
  }

  // Fecha de mañana en hora Perú (UTC-5)
  const nowPeru = new Date(Date.now() - 5 * 3600 * 1000);
  const tomorrow = new Date(nowPeru.getTime() + 24 * 3600 * 1000);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);

  const sentMap = readJson(REMINDERS_FILE, {});
  let sent = 0;

  for (const sust of sustentaciones) {
    if (!sust?.fecha || sust.fecha !== tomorrowIso) continue;
    const dedupKey = `${sust.id || sust.tesistaCodigo}_${tomorrowIso}`;
    if (sentMap[dedupKey]) continue;

    if (sust.tesistaCodigo && String(sust.tesistaCodigo).replace(/\D/g, '').length === 10) {
      await dispatchPushNotification({
        codigoMatricula: sust.tesistaCodigo,
        rol: 'tesista',
        title: `🎓 ¡Mañana sustentas tu tesis! (${sust.horario || '11:00 a.m.'})`,
        body: `Recuerda llegar 1 hora antes con ropa formal y tus diapositivas listas al ${sust.aulaOAuditorio || 'Auditorio de Ing. Industrial'}.`,
        url: '/?vista=instrucciones',
        tag: `vispera-${tomorrowIso}`,
        tipo: 'recordatorio',
        urgente: false
      });
      sent += 1;
    }

    await dispatchPushNotification({
      rol: 'secretaria',
      title: `📅 Mañana sustenta ${sust.tesistaNombre}`,
      body: `${sust.horario || '11:00 a.m. - 1:00 p.m.'} · ${sust.aulaOAuditorio || 'Auditorio'} · Jurado: ${sust.juradoPresidente || 'Confirmar'}`,
      url: '/',
      tag: `sec-vispera-${tomorrowIso}-${sust.id}`,
      tipo: 'recordatorio',
      urgente: false
    });

    sentMap[dedupKey] = new Date().toISOString();
  }

  writeJson(REMINDERS_FILE, sentMap);
  return { checked: sustentaciones.length, sent, targetDate: tomorrowIso };
}
