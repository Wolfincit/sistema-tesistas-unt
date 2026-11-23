/**
 * Motor Real de Google Drive (OAuth 2.0 + REST API v3) como Base de Datos y
 * Almacenamiento Automático de Expedientes PDF y Audios — Ing. Industrial UNT.
 *
 * - Cero dependencias externas (usa fetch y crypto nativos de Node 24).
 * - Cuando Secretaría conecta su Google Drive en 2 clics:
 *     1. Crea automáticamente:
 *          📁 Expedientes_Tesistas/
 *              📁 {Nombre Completo} ({Matricula})/   ← automática por cada tesista
 *          📁 Audios_Consultas/                      ← se borran solos al resolver duda
 *          📁 Formatos_Oficiales/
 *          📄 _BD_Sistema_Tesistas_UNT.json          ← BD compartida multi-PC
 *     2. Los archivos permanecen 100% PRIVADOS en Drive (nunca públicos):
 *        el servidor los transmite de forma segura al visor integrado.
 *     3. Al titularse un alumno, Secretaría puede borrar toda su carpeta + PDFs del Drive en 1 clic.
 * - Mientras Drive aún no esté conectado, funciona automáticamente con almacenamiento
 *   real en disco local del servidor (multi-usuario local + PDFs y audios reales).
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRIVE_CONFIG_PATH = path.join(__dirname, '.drive-config.json');
const LOCAL_DB_PATH = path.join(__dirname, '.local-db.json');
const LOCAL_UPLOADS_DIR = path.join(__dirname, '.local-uploads');
const LOCAL_FILES_INDEX_PATH = path.join(LOCAL_UPLOADS_DIR, 'files-index.json');

const DB_FILE_NAME = '_BD_Sistema_Tesistas_UNT.json';
const FOLDER_EXPEDIENTES = 'Expedientes_Tesistas';
const FOLDER_AUDIOS = 'Audios_Consultas';
const FOLDER_FORMATOS = 'Formatos_Oficiales';

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';
const GOOGLE_DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJsonSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJsonSafe(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function sanitizeFolderName(name) {
  return String(name || 'Tesista')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'Tesista';
}

function formatBytesLabel(bytes) {
  const n = Number(bytes) || 0;
  if (n >= 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

// ======================================================
// ESTADO EN MEMORIA + COLA SERIALIZADA + BÓVEDA CIFRADA AES-256-GCM
// ======================================================
let configCache = null;
let accessTokenCache = { token: null, expiresAt: 0 };
let dbMemoryCache = null;
let driveWriteChain = Promise.resolve();
let pendingOAuthStates = new Map();
let autoHealPromise = null;
let lastAutoHealAt = 0;
let autoHealSummary = {
  healed: false,
  migratedFromOrigin: '',
  currentOrigin: '',
  vaultSynced: false,
  lastHealAt: ''
};

const VAULT_KEY_NAME = 'unt_industrial_drive_vault_v1';

function deriveAesKey(passphrase) {
  const material = String(
    passphrase ||
    process.env.UNT_VAULT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    'UNT-INDUSTRIAL-VAULT-DEFAULT-KEY'
  );
  return crypto.createHash('sha256').update(material).digest();
}

function encryptPayloadAesGcm(obj, passphrase = '') {
  const key = deriveAesKey(passphrase);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plain = Buffer.from(JSON.stringify(obj), 'utf-8');
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
    createdAt: new Date().toISOString()
  };
}

function decryptPayloadAesGcm(envelope, passphrase = '') {
  if (!envelope || !envelope.iv || !envelope.tag || !envelope.data) {
    throw new Error('Formato de seguro cifrado inválido.');
  }
  const key = deriveAesKey(passphrase);
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(envelope.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, 'base64')),
    decipher.final()
  ]);
  return JSON.parse(plain.toString('utf-8'));
}

function isRemoteVaultConfigured() {
  return Boolean(process.env.UNT_VAULT_URL && process.env.UNT_VAULT_TOKEN);
}

async function saveConfigToRemoteVault(cfg) {
  if (!isRemoteVaultConfigured()) return false;
  try {
    const baseUrl = process.env.UNT_VAULT_URL.replace(/\/$/, '');
    const encrypted = encryptPayloadAesGcm({
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      refreshToken: cfg.refreshToken,
      accountEmail: cfg.accountEmail,
      accountName: cfg.accountName,
      rootFolderId: cfg.rootFolderId,
      rootFolderName: cfg.rootFolderName,
      expedientesFolderId: cfg.expedientesFolderId,
      audiosFolderId: cfg.audiosFolderId,
      formatosFolderId: cfg.formatosFolderId,
      dbFileId: cfg.dbFileId,
      connectedAt: cfg.connectedAt
    });
    const res = await fetch(`${baseUrl}/set/${encodeURIComponent(VAULT_KEY_NAME)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.UNT_VAULT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(encrypted)
    });
    autoHealSummary.vaultSynced = res.ok;
    return res.ok;
  } catch (err) {
    console.warn('[Drive Vault] No se pudo guardar en bóveda remota:', err.message);
    return false;
  }
}

async function loadConfigFromRemoteVault() {
  if (!isRemoteVaultConfigured()) return null;
  try {
    const baseUrl = process.env.UNT_VAULT_URL.replace(/\/$/, '');
    const res = await fetch(`${baseUrl}/get/${encodeURIComponent(VAULT_KEY_NAME)}`, {
      headers: { Authorization: `Bearer ${process.env.UNT_VAULT_TOKEN}` }
    });
    if (!res.ok) return null;
    const json = await res.json();
    const rawResult = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
    if (!rawResult || !rawResult.data) return null;
    return decryptPayloadAesGcm(rawResult);
  } catch (err) {
    console.warn('[Drive Vault] No se pudo leer bóveda remota:', err.message);
    return null;
  }
}

function loadConfig() {
  if (configCache) return configCache;
  const fromDisk = readJsonSafe(DRIVE_CONFIG_PATH, {});
  configCache = {
    clientId: process.env.GOOGLE_CLIENT_ID || fromDisk.clientId || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || fromDisk.clientSecret || '',
    refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN || fromDisk.refreshToken || '',
    accountEmail: fromDisk.accountEmail || '',
    accountName: fromDisk.accountName || '',
    rootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || fromDisk.rootFolderId || '',
    rootFolderName: fromDisk.rootFolderName || '',
    expedientesFolderId: fromDisk.expedientesFolderId || '',
    audiosFolderId: fromDisk.audiosFolderId || '',
    formatosFolderId: fromDisk.formatosFolderId || '',
    dbFileId: fromDisk.dbFileId || '',
    connectedAt: fromDisk.connectedAt || '',
    lastServerOrigin: fromDisk.lastServerOrigin || ''
  };
  return configCache;
}

function saveConfig(patch, { syncVault = true } = {}) {
  const current = loadConfig();
  configCache = { ...current, ...patch };
  writeJsonSafe(DRIVE_CONFIG_PATH, configCache);
  if (syncVault && isRemoteVaultConfigured()) {
    saveConfigToRemoteVault(configCache).catch(() => { });
  }
  return configCache;
}

/**
 * SEGURO AUTOMÁTICO DE MIGRACIÓN Y AUTO-RECUPERACIÓN DE SERVIDOR:
 * - Si el sistema arranca en un servidor nuevo o tras un reinicio de Render:
 *   1. Si hay Bóveda Cifrada (UNT_VAULT_URL), descarga y coloca automáticamente
 *      las llaves + token + carpeta de Google Drive sin intervención manual.
 *   2. Si existen GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_DRIVE_REFRESH_TOKEN,
 *      auto-descubre la carpeta raíz (_BD_Sistema_Tesistas_UNT.json / Expedientes_Ing_Industrial_UNT),
 *      restaura los IDs de subcarpetas y recarga toda la BD desde Google Drive automáticamente.
 */
export async function autoHealDriveConnection(currentOrigin = '') {
  if (autoHealPromise) return autoHealPromise;
  if (Date.now() - lastAutoHealAt < 5000 && configCache?.dbFileId) {
    return autoHealSummary;
  }

  autoHealPromise = (async () => {
    try {
      let cfg = loadConfig();

      // Detectar cambio de servidor / dominio
      if (currentOrigin && cfg.lastServerOrigin && cfg.lastServerOrigin !== currentOrigin) {
        autoHealSummary.migratedFromOrigin = cfg.lastServerOrigin;
        autoHealSummary.currentOrigin = currentOrigin;
        console.log(`[Seguro Servidor] Cambio de servidor detectado: ${cfg.lastServerOrigin} -> ${currentOrigin}`);
      } else if (currentOrigin) {
        autoHealSummary.currentOrigin = currentOrigin;
      }

      // Paso 1: Si faltan credenciales o refreshToken, intentar auto-recuperar desde la Bóveda Cifrada remota
      if ((!cfg.clientId || !cfg.clientSecret || !cfg.refreshToken) && isRemoteVaultConfigured()) {
        const recovered = await loadConfigFromRemoteVault();
        if (recovered) {
          cfg = saveConfig(
            {
              clientId: cfg.clientId || recovered.clientId || '',
              clientSecret: cfg.clientSecret || recovered.clientSecret || '',
              refreshToken: cfg.refreshToken || recovered.refreshToken || '',
              accountEmail: cfg.accountEmail || recovered.accountEmail || '',
              accountName: cfg.accountName || recovered.accountName || '',
              rootFolderId: cfg.rootFolderId || recovered.rootFolderId || '',
              rootFolderName: cfg.rootFolderName || recovered.rootFolderName || '',
              expedientesFolderId: cfg.expedientesFolderId || recovered.expedientesFolderId || '',
              audiosFolderId: cfg.audiosFolderId || recovered.audiosFolderId || '',
              formatosFolderId: cfg.formatosFolderId || recovered.formatosFolderId || '',
              dbFileId: cfg.dbFileId || recovered.dbFileId || '',
              connectedAt: cfg.connectedAt || recovered.connectedAt || ''
            },
            { syncVault: false }
          );
          autoHealSummary.healed = true;
          autoHealSummary.vaultSynced = true;
          console.log('[Seguro Servidor] Llaves y vínculo de Google Drive auto-restaurados desde Bóveda Cifrada.');
        }
      }

      // Paso 2: Si ya tiene llaves + refreshToken, auto-descubrir carpeta raíz y subcarpetas si faltan tras reinicio/migración
      if (cfg.clientId && cfg.clientSecret && cfg.refreshToken) {
        let rootId = cfg.rootFolderId;

        // Auto-descubrir la carpeta donde vive _BD_Sistema_Tesistas_UNT.json si rootFolderId no estaba seteado
        if (!rootId) {
          const qDbGlobal = `name = '${DB_FILE_NAME}' and trashed = false`;
          const dbRes = await driveFetch(
            `${GOOGLE_DRIVE_API}/files?${new URLSearchParams({
              q: qDbGlobal,
              fields: 'files(id,name,parents)',
              pageSize: '1',
              supportsAllDrives: 'true',
              includeItemsFromAllDrives: 'true'
            }).toString()}`
          );
          if (dbRes.ok) {
            const dbData = await dbRes.json();
            const foundDb = dbData.files?.[0];
            if (foundDb?.parents?.[0]) {
              rootId = foundDb.parents[0];
              saveConfig({ rootFolderId: rootId, dbFileId: foundDb.id }, { syncVault: false });
              cfg = loadConfig();
            }
          }
        }

        if (rootId && (!cfg.expedientesFolderId || !cfg.audiosFolderId || !cfg.formatosFolderId || !cfg.dbFileId || !cfg.rootFolderName)) {
          await selectRootFolder(rootId);
          autoHealSummary.healed = true;
          console.log('[Seguro Servidor] Estructura de Google Drive y Base de Datos restauradas automáticamente.');
        } else if (rootId && cfg.dbFileId) {
          await reloadDbFromDrive();
        }
      }

      if (currentOrigin && cfg.lastServerOrigin !== currentOrigin) {
        saveConfig({ lastServerOrigin: currentOrigin }, { syncVault: false });
      }
      autoHealSummary.lastHealAt = new Date().toISOString();
      lastAutoHealAt = Date.now();
      return autoHealSummary;
    } catch (err) {
      console.warn('[Seguro Servidor] Auto-recuperación omitida:', err.message);
      return autoHealSummary;
    } finally {
      autoHealPromise = null;
    }
  })();

  return autoHealPromise;
}

export function exportMigrationBundle(passphrase) {
  const pass = String(passphrase || '').trim();
  if (pass.length < 6) {
    throw new Error('Ingrese una clave de respaldo de al menos 6 caracteres para cifrar el paquete de migración.');
  }
  const cfg = loadConfig();
  if (!cfg.clientId || !cfg.clientSecret) {
    throw new Error('Primero configure las llaves de Google OAuth antes de generar el seguro de migración.');
  }
  const envelope = encryptPayloadAesGcm(
    {
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      refreshToken: cfg.refreshToken,
      accountEmail: cfg.accountEmail,
      accountName: cfg.accountName,
      rootFolderId: cfg.rootFolderId,
      rootFolderName: cfg.rootFolderName,
      expedientesFolderId: cfg.expedientesFolderId,
      audiosFolderId: cfg.audiosFolderId,
      formatosFolderId: cfg.formatosFolderId,
      dbFileId: cfg.dbFileId
    },
    pass
  );

  return {
    format: 'UNT_INDUSTRIAL_SERVER_SHIELD_V1',
    accountEmail: cfg.accountEmail || '',
    rootFolderName: cfg.rootFolderName || '',
    envelope
  };
}

export async function importMigrationBundle(bundle, passphrase) {
  const pass = String(passphrase || '').trim();
  if (!pass) throw new Error('Debe ingresar la clave de respaldo del archivo .untkey.');
  const envelope = bundle?.envelope || bundle;
  let decrypted;
  try {
    decrypted = decryptPayloadAesGcm(envelope, pass);
  } catch {
    throw new Error('Clave incorrecta o archivo de seguro .untkey dañado.');
  }
  if (!decrypted.clientId || !decrypted.clientSecret) {
    throw new Error('El paquete no contiene llaves válidas de Google OAuth.');
  }

  accessTokenCache = { token: null, expiresAt: 0 };
  saveConfig({
    clientId: decrypted.clientId,
    clientSecret: decrypted.clientSecret,
    refreshToken: decrypted.refreshToken || '',
    accountEmail: decrypted.accountEmail || '',
    accountName: decrypted.accountName || '',
    rootFolderId: decrypted.rootFolderId || '',
    rootFolderName: decrypted.rootFolderName || '',
    expedientesFolderId: decrypted.expedientesFolderId || '',
    audiosFolderId: decrypted.audiosFolderId || '',
    formatosFolderId: decrypted.formatosFolderId || '',
    dbFileId: decrypted.dbFileId || ''
  });

  await autoHealDriveConnection();
  return getDriveStatus();
}

export function getEnvMigrationSnippet() {
  const cfg = loadConfig();
  const lines = [
    '# Seguro de Migración de Servidor — Sistema Tesistas Ing. Industrial UNT',
    '# Pegue estas variables en Render -> Environment o en el archivo .env de cualquier servidor nuevo:',
    `GOOGLE_CLIENT_ID=${cfg.clientId || ''}`,
    `GOOGLE_CLIENT_SECRET=${cfg.clientSecret || ''}`,
    `GOOGLE_DRIVE_REFRESH_TOKEN=${cfg.refreshToken || ''}`,
    `GOOGLE_DRIVE_ROOT_FOLDER_ID=${cfg.rootFolderId || ''}`
  ];
  return {
    ready: Boolean(cfg.clientId && cfg.clientSecret),
    hasDriveLink: Boolean(cfg.refreshToken && cfg.rootFolderId),
    envText: lines.join('\n')
  };
}

function isDriveConnected() {
  const cfg = loadConfig();
  return Boolean(cfg.clientId && cfg.clientSecret && cfg.refreshToken);
}

function isDriveReadyWithFolder() {
  const cfg = loadConfig();
  return Boolean(isDriveConnected() && cfg.rootFolderId);
}

// ======================================================
// AUTENTICACIÓN OAUTH 2.0 (GOOGLE DRIVE)
// ======================================================
export function saveOAuthCredentials({ clientId, clientSecret }) {
  const cid = String(clientId || '').trim();
  const csec = String(clientSecret || '').trim();
  if (!cid || !csec) {
    throw new Error('Debe ingresar tanto el Client ID como el Client Secret de Google.');
  }
  accessTokenCache = { token: null, expiresAt: 0 };
  saveConfig({ clientId: cid, clientSecret: csec });
  return { ok: true };
}

export function buildOAuthAuthUrl(origin) {
  const cfg = loadConfig();
  if (!cfg.clientId || !cfg.clientSecret) {
    throw new Error('Falta configurar las credenciales OAuth de Google (Client ID y Client Secret).');
  }
  const state = crypto.randomBytes(16).toString('hex');
  pendingOAuthStates.set(state, { origin, createdAt: Date.now() });
  // Limpiar estados viejos (> 15 min)
  for (const [k, v] of pendingOAuthStates.entries()) {
    if (Date.now() - v.createdAt > 15 * 60 * 1000) pendingOAuthStates.delete(k);
  }

  const redirectUri = `${origin.replace(/\/$/, '')}/api/drive/callback`;
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: DRIVE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state
  });

  return {
    authUrl: `${GOOGLE_OAUTH_URL}?${params.toString()}`,
    redirectUri
  };
}

export async function handleOAuthCallback({ code, state, origin }) {
  const cfg = loadConfig();
  const stateEntry = pendingOAuthStates.get(state);
  if (stateEntry) pendingOAuthStates.delete(state);

  const effectiveOrigin = stateEntry?.origin || origin;
  const redirectUri = `${effectiveOrigin.replace(/\/$/, '')}/api/drive/callback`;

  const body = new URLSearchParams({
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || 'Google rechazó la autorización.');
  }

  const refreshToken = tokenData.refresh_token || cfg.refreshToken;
  if (!refreshToken) {
    throw new Error('Google no entregó refresh_token. Intente revocar permisos previos y volver a conectar.');
  }

  accessTokenCache = {
    token: tokenData.access_token,
    expiresAt: Date.now() + Math.max(60, (tokenData.expires_in || 3500) - 120) * 1000
  };

  // Obtener nombre y correo de la cuenta conectada
  let accountEmail = cfg.accountEmail;
  let accountName = cfg.accountName;
  try {
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    if (userRes.ok) {
      const u = await userRes.json();
      accountEmail = u.email || accountEmail;
      accountName = u.name || accountName;
    }
  } catch {
    // non-fatal
  }

  saveConfig({
    refreshToken,
    accountEmail,
    accountName,
    connectedAt: new Date().toISOString()
  });

  return { accountEmail, accountName };
}

export async function disconnectDrive() {
  accessTokenCache = { token: null, expiresAt: 0 };
  saveConfig({
    refreshToken: '',
    accountEmail: '',
    accountName: '',
    rootFolderId: '',
    rootFolderName: '',
    expedientesFolderId: '',
    audiosFolderId: '',
    formatosFolderId: '',
    dbFileId: '',
    connectedAt: ''
  });
  return { ok: true };
}

async function getValidAccessToken() {
  const cfg = loadConfig();
  if (!cfg.clientId || !cfg.clientSecret || !cfg.refreshToken) {
    throw new Error('Google Drive no está conectado.');
  }

  if (accessTokenCache.token && Date.now() < accessTokenCache.expiresAt) {
    return accessTokenCache.token;
  }

  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: cfg.refreshToken,
    grant_type: 'refresh_token'
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`No se pudo renovar el acceso a Google Drive: ${data.error_description || data.error || res.status}`);
  }

  accessTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, (data.expires_in || 3500) - 120) * 1000
  };
  return accessTokenCache.token;
}

async function driveFetch(url, options = {}) {
  const token = await getValidAccessToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}

// ======================================================
// ESTADO, CUOTA DE 15 GB Y EXPLORADOR DE CARPETAS DRIVE
// ======================================================
export async function getDriveStatus(origin = '') {
  await autoHealDriveConnection(origin);
  const cfg = loadConfig();
  const hasEnvCredentials = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const configured = Boolean(cfg.clientId && cfg.clientSecret);
  const connected = isDriveConnected();
  const redirectUri = origin ? `${origin.replace(/\/$/, '')}/api/drive/callback` : '/api/drive/callback';

  let quota = null;
  let accountEmail = cfg.accountEmail;
  let accountName = cfg.accountName;
  let errorConexion = null;

  if (connected) {
    try {
      const aboutRes = await driveFetch(`${GOOGLE_DRIVE_API}/about?fields=user(displayName,emailAddress),storageQuota(limit,usage,usageInDrive)`);
      if (aboutRes.ok) {
        const about = await aboutRes.json();
        accountEmail = about.user?.emailAddress || accountEmail;
        accountName = about.user?.displayName || accountName;
        if (accountEmail !== cfg.accountEmail || accountName !== cfg.accountName) {
          saveConfig({ accountEmail, accountName });
        }
        const usedBytes = Number(about.storageQuota?.usage || 0);
        const limitBytes = Number(about.storageQuota?.limit || 15 * 1024 * 1024 * 1024);
        const percent = limitBytes > 0 ? Math.min(100, Math.round((usedBytes / limitBytes) * 1000) / 10) : 0;
        quota = {
          usedBytes,
          limitBytes,
          usedLabel: formatBytesLabel(usedBytes),
          limitLabel: limitBytes > 0 ? formatBytesLabel(limitBytes) : 'Ilimitado',
          percent
        };
      } else {
        const errTxt = await aboutRes.text();
        errorConexion = `Error consultando Google Drive (${aboutRes.status}): ${errTxt.slice(0, 140)}`;
      }
    } catch (err) {
      errorConexion = err.message;
    }
  }

  // Calcular espacio local usado como referencia si está en modo local
  const localIndex = readJsonSafe(LOCAL_FILES_INDEX_PATH, {});
  const localFilesCount = Object.keys(localIndex).length;
  const localBytes = Object.values(localIndex).reduce((acc, f) => acc + (Number(f.sizeBytes) || 0), 0);

  return {
    configured,
    hasEnvCredentials,
    connected: connected && !errorConexion,
    errorConexion,
    accountEmail,
    accountName,
    redirectUri,
    rootFolderId: cfg.rootFolderId || '',
    rootFolderName: cfg.rootFolderName || '',
    rootFolderUrl: cfg.rootFolderId ? `https://drive.google.com/drive/folders/${cfg.rootFolderId}` : '',
    expedientesFolderId: cfg.expedientesFolderId || '',
    audiosFolderId: cfg.audiosFolderId || '',
    formatosFolderId: cfg.formatosFolderId || '',
    dbFileId: cfg.dbFileId || '',
    storageMode: isDriveReadyWithFolder() && !errorConexion ? 'google-drive' : 'local-server',
    quota,
    localStats: {
      filesCount: localFilesCount,
      usedBytes: localBytes,
      usedLabel: formatBytesLabel(localBytes)
    },
    hasBackupEnvHint: Boolean(cfg.refreshToken && !process.env.GOOGLE_DRIVE_REFRESH_TOKEN),
    serverShield: {
      envLoaded: hasEnvCredentials,
      vaultConfigured: isRemoteVaultConfigured(),
      vaultSynced: autoHealSummary.vaultSynced,
      autoHealed: autoHealSummary.healed,
      migratedFromOrigin: autoHealSummary.migratedFromOrigin || '',
      currentOrigin: origin || autoHealSummary.currentOrigin || ''
    }
  };
}

export async function listDriveFolders(parentId = 'root', searchQuery = '') {
  const safeParent = String(parentId || 'root').replace(/'/g, '');
  const cleanSearch = String(searchQuery || '').replace(/'/g, '').trim();

  let q = `mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (cleanSearch) {
    q += ` and name contains '${cleanSearch}'`;
  } else {
    q += ` and '${safeParent}' in parents`;
  }

  const params = new URLSearchParams({
    q,
    fields: 'files(id,name,modifiedTime,parents,webViewLink)',
    orderBy: 'name',
    pageSize: '60',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true'
  });

  const res = await driveFetch(`${GOOGLE_DRIVE_API}/files?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'No se pudieron listar las carpetas de Google Drive.');
  }

  let currentFolder = { id: 'root', name: 'Mi Unidad', parentId: null };
  if (safeParent !== 'root') {
    const infoRes = await driveFetch(
      `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(safeParent)}?fields=id,name,parents,webViewLink&supportsAllDrives=true`
    );
    if (infoRes.ok) {
      const f = await infoRes.json();
      currentFolder = {
        id: f.id,
        name: f.name,
        parentId: Array.isArray(f.parents) && f.parents.length > 0 ? f.parents[0] : 'root',
        webViewLink: f.webViewLink
      };
    }
  }

  return {
    currentFolder,
    folders: (data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      modifiedTime: f.modifiedTime,
      webViewLink: f.webViewLink || `https://drive.google.com/drive/folders/${f.id}`
    }))
  };
}

export async function createDriveFolder(name, parentId = 'root') {
  const cleanName = sanitizeFolderName(name);
  const metadata = {
    name: cleanName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId || 'root']
  };

  const res = await driveFetch(`${GOOGLE_DRIVE_API}/files?fields=id,name,webViewLink&supportsAllDrives=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(metadata)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'No se pudo crear la carpeta en Google Drive.');
  }
  return {
    id: data.id,
    name: data.name,
    webViewLink: data.webViewLink || `https://drive.google.com/drive/folders/${data.id}`
  };
}

async function findOrCreateSubfolder(parentId, folderName) {
  const escaped = folderName.replace(/'/g, "\\'");
  const q = `'${parentId}' in parents and name = '${escaped}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const params = new URLSearchParams({
    q,
    fields: 'files(id,name,webViewLink)',
    pageSize: '1',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true'
  });

  const searchRes = await driveFetch(`${GOOGLE_DRIVE_API}/files?${params.toString()}`);
  const searchData = await searchRes.json();
  if (searchRes.ok && searchData.files && searchData.files.length > 0) {
    const f = searchData.files[0];
    return {
      id: f.id,
      name: f.name,
      webViewLink: f.webViewLink || `https://drive.google.com/drive/folders/${f.id}`
    };
  }

  return createDriveFolder(folderName, parentId);
}

function extractFolderIdFromInput(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';
  // Formato: https://drive.google.com/drive/folders/1AbCdEf...
  const m1 = raw.match(/\/folders\/([a-zA-Z0-9_-]{10,})/);
  if (m1) return m1[1];
  // Formato: ?id=1AbCdEf...
  const m2 = raw.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m2) return m2[1];
  return raw;
}

export async function selectRootFolder(folderIdOrLink) {
  const folderId = extractFolderIdFromInput(folderIdOrLink);
  if (!folderId) {
    throw new Error('Debe seleccionar o pegar un enlace de carpeta válido.');
  }

  // Verificar acceso a la carpeta elegida
  let folderName = 'Mi Unidad';
  let resolvedId = folderId;
  if (folderId !== 'root') {
    const checkRes = await driveFetch(
      `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(folderId)}?fields=id,name,mimeType,trashed&supportsAllDrives=true`
    );
    const checkData = await checkRes.json();
    if (!checkRes.ok || checkData.trashed) {
      throw new Error('No se pudo acceder a esa carpeta de Google Drive. Verifique que pertenece a su cuenta o tiene permisos de editor.');
    }
    if (checkData.mimeType !== 'application/vnd.google-apps.folder') {
      throw new Error('El enlace ingresado no corresponde a una carpeta de Google Drive.');
    }
    folderName = checkData.name;
    resolvedId = checkData.id;
  }

  // Crear automáticamente la estructura oficial de carpetas
  const [expFolder, audFolder, fmtFolder] = await Promise.all([
    findOrCreateSubfolder(resolvedId, FOLDER_EXPEDIENTES),
    findOrCreateSubfolder(resolvedId, FOLDER_AUDIOS),
    findOrCreateSubfolder(resolvedId, FOLDER_FORMATOS)
  ]);

  // Buscar si ya existe _BD_Sistema_Tesistas_UNT.json dentro de esa carpeta
  const qDb = `'${resolvedId}' in parents and name = '${DB_FILE_NAME}' and trashed = false`;
  const dbSearchRes = await driveFetch(
    `${GOOGLE_DRIVE_API}/files?${new URLSearchParams({ q: qDb, fields: 'files(id,name)', pageSize: '1', supportsAllDrives: 'true', includeItemsFromAllDrives: 'true' }).toString()}`
  );
  const dbSearchData = await dbSearchRes.json();
  let dbFileId = dbSearchData.files?.[0]?.id || '';

  saveConfig({
    rootFolderId: resolvedId,
    rootFolderName: folderName,
    expedientesFolderId: expFolder.id,
    audiosFolderId: audFolder.id,
    formatosFolderId: fmtFolder.id,
    dbFileId
  });

  if (dbFileId) {
    // Cargar BD existente desde Drive para restaurar todos los datos!
    await reloadDbFromDrive();
  } else {
    // Subir la BD actual hacia el Drive recién conectado
    const currentDb = loadLocalDb();
    await flushDbToDrive(currentDb);
  }

  return getDriveStatus();
}

// ======================================================
// BASE DE DATOS COMPARTIDA EN GOOGLE DRIVE + FALLBACK LOCAL
// ======================================================
function loadLocalDb() {
  if (dbMemoryCache) return dbMemoryCache;
  dbMemoryCache = readJsonSafe(LOCAL_DB_PATH, {
    version: 1,
    updatedAt: new Date().toISOString(),
    collections: {}
  });
  if (!dbMemoryCache.collections) dbMemoryCache.collections = {};
  return dbMemoryCache;
}

async function reloadDbFromDrive() {
  const cfg = loadConfig();
  if (!isDriveReadyWithFolder() || !cfg.dbFileId) return loadLocalDb();

  try {
    const res = await driveFetch(`${GOOGLE_DRIVE_API}/files/${encodeURIComponent(cfg.dbFileId)}?alt=media&supportsAllDrives=true`);
    if (res.ok) {
      const parsed = await res.json();
      if (parsed && typeof parsed === 'object') {
        dbMemoryCache = {
          version: parsed.version || 1,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          collections: parsed.collections || {}
        };
        writeJsonSafe(LOCAL_DB_PATH, dbMemoryCache);
        return dbMemoryCache;
      }
    }
  } catch (err) {
    console.warn('[Drive DB] No se pudo leer BD desde Drive, usando copia local:', err.message);
  }
  return loadLocalDb();
}

async function uploadBufferToDriveResumable({ buffer, mimeType, fileName, parentId, existingFileId = '' }) {
  const token = await getValidAccessToken();
  const isUpdate = Boolean(existingFileId);

  const initUrl = isUpdate
    ? `${GOOGLE_DRIVE_UPLOAD_API}/files/${encodeURIComponent(existingFileId)}?uploadType=resumable&supportsAllDrives=true`
    : `${GOOGLE_DRIVE_UPLOAD_API}/files?uploadType=resumable&supportsAllDrives=true`;

  const metadata = isUpdate
    ? { name: fileName }
    : { name: fileName, parents: [parentId] };

  const initRes = await fetch(initUrl, {
    method: isUpdate ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(buffer.length)
    },
    body: JSON.stringify(metadata)
  });

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`Error iniciando subida a Google Drive (${initRes.status}): ${errText.slice(0, 180)}`);
  }

  const uploadUrl = initRes.headers.get('location');
  if (!uploadUrl) {
    throw new Error('Google Drive no devolvió la URL de carga resumable.');
  }

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(buffer.length)
    },
    body: buffer
  });

  const fileData = await putRes.json();
  if (!putRes.ok || !fileData.id) {
    throw new Error(fileData.error?.message || `Error subiendo archivo a Google Drive (${putRes.status})`);
  }

  return {
    id: fileData.id,
    name: fileData.name || fileName,
    webViewLink: `https://drive.google.com/file/d/${fileData.id}/view`
  };
}

async function flushDbToDrive(dbObj) {
  const cfg = loadConfig();
  if (!isDriveReadyWithFolder()) return;

  const jsonBuffer = Buffer.from(JSON.stringify(dbObj, null, 2), 'utf-8');
  const uploaded = await uploadBufferToDriveResumable({
    buffer: jsonBuffer,
    mimeType: 'application/json',
    fileName: DB_FILE_NAME,
    parentId: cfg.rootFolderId,
    existingFileId: cfg.dbFileId || ''
  });

  if (uploaded.id && uploaded.id !== cfg.dbFileId) {
    saveConfig({ dbFileId: uploaded.id });
  }
}

function enqueueDriveSync(dbSnapshot) {
  if (!isDriveReadyWithFolder()) return Promise.resolve();
  driveWriteChain = driveWriteChain
    .then(() => flushDbToDrive(dbSnapshot))
    .catch((err) => {
      console.error('[Drive DB Sync Error]', err.message);
    });
  return driveWriteChain;
}

let lastDrivePullAt = 0;
export async function getDbState({ forceDrivePull = false, origin = '' } = {}) {
  await autoHealDriveConnection(origin);
  const cfg = loadConfig();
  if (isDriveReadyWithFolder() && cfg.dbFileId && (forceDrivePull || Date.now() - lastDrivePullAt > 12000)) {
    lastDrivePullAt = Date.now();
    await reloadDbFromDrive();
  }
  const db = loadLocalDb();
  return {
    updatedAt: db.updatedAt,
    storageMode: isDriveReadyWithFolder() ? 'google-drive' : 'local-server',
    collections: db.collections || {}
  };
}

export async function saveDbCollection(collectionName, value) {
  const allowed = new Set([
    'correosAutorizados',
    'cuentasSecretaria',
    'reservas',
    'bloqueos',
    'fechasHabilitadas',
    'slotsPorFecha',
    'defaultSlots',
    'documentos',
    'formatos',
    'consultas',
    'comunicados',
    'faqs',
    'seguimientoLogistico',
    'directorioJurado',
    'historialDespachos',
    'sustentacionesJueves',
    'instruccionesSustentacion'
  ]);
  if (!allowed.has(collectionName)) {
    throw new Error(`Colección no permitida: ${collectionName}`);
  }

  const db = loadLocalDb();
  db.collections[collectionName] = value;
  db.updatedAt = new Date().toISOString();
  writeJsonSafe(LOCAL_DB_PATH, db);

  // Sincronización en cola atómica hacia _BD_Sistema_Tesistas_UNT.json en Google Drive
  await enqueueDriveSync(JSON.parse(JSON.stringify(db)));
  return { ok: true, updatedAt: db.updatedAt, storageMode: isDriveReadyWithFolder() ? 'google-drive' : 'local-server' };
}

// ======================================================
// SUBIDA REAL DE PDFs, AUDIOS, FORMATOS Y BORRADO EN DRIVE
// ======================================================
function saveFileLocally({ fileId, fileName, mimeType, buffer, folderName, tesistaId = '' }) {
  ensureDir(LOCAL_UPLOADS_DIR);
  const subDir = path.join(LOCAL_UPLOADS_DIR, sanitizeFolderName(folderName || 'general'));
  ensureDir(subDir);
  const diskName = `${fileId}_${sanitizeFolderName(fileName)}`;
  const diskPath = path.join(subDir, diskName);
  fs.writeFileSync(diskPath, buffer);

  const index = readJsonSafe(LOCAL_FILES_INDEX_PATH, {});
  index[fileId] = {
    fileId,
    fileName,
    mimeType,
    sizeBytes: buffer.length,
    diskPath,
    folderName: sanitizeFolderName(folderName || 'general'),
    tesistaId,
    createdAt: new Date().toISOString()
  };
  writeJsonSafe(LOCAL_FILES_INDEX_PATH, index);
  return index[fileId];
}

export async function uploadDocumentoTesista({
  tesistaId,
  tesistaNombre,
  tesistaCodigo,
  tipoId,
  fileName,
  mimeType = 'application/pdf',
  buffer,
  anteriorFileId = ''
}) {
  if (!buffer || buffer.length === 0) {
    throw new Error('El archivo está vacío.');
  }
  if (buffer.length > 25 * 1024 * 1024) {
    throw new Error('El archivo supera el límite máximo permitido de 25 MB.');
  }

  const studentFolderName = sanitizeFolderName(`${tesistaNombre} (${tesistaCodigo || tesistaId})`);
  const safeFileName = sanitizeFolderName(fileName || `${tipoId || 'documento'}.pdf`);
  const finalFileName = safeFileName.toLowerCase().endsWith('.pdf') ? safeFileName : `${safeFileName}.pdf`;

  // Eliminar versión anterior del mismo requisito para no desperdiciar los 15 GB
  if (anteriorFileId) {
    try {
      await deleteFileById(anteriorFileId);
    } catch {
      // ignore if already gone
    }
  }

  const cfg = loadConfig();
  if (isDriveReadyWithFolder()) {
    // Asegurar carpeta Expedientes_Tesistas y subcarpeta individual con nombre del alumno
    let expFolderId = cfg.expedientesFolderId;
    if (!expFolderId) {
      const exp = await findOrCreateSubfolder(cfg.rootFolderId, FOLDER_EXPEDIENTES);
      expFolderId = exp.id;
      saveConfig({ expedientesFolderId: expFolderId });
    }

    const studentFolder = await findOrCreateSubfolder(expFolderId, studentFolderName);
    const uploaded = await uploadBufferToDriveResumable({
      buffer,
      mimeType: 'application/pdf',
      fileName: finalFileName,
      parentId: studentFolder.id
    });

    const fileId = `gd_${uploaded.id}`;
    return {
      fileId,
      driveFileId: uploaded.id,
      driveFileUrl: uploaded.webViewLink,
      driveFolderId: studentFolder.id,
      driveFolderUrl: studentFolder.webViewLink,
      previewUrl: `/api/files/${encodeURIComponent(fileId)}`,
      sizeBytes: buffer.length,
      sizeLabel: formatBytesLabel(buffer.length),
      storage: 'google-drive',
      folderName: studentFolderName
    };
  }

  // Fallback local real (misma experiencia exacta hasta que conecten Google Drive)
  const localId = `loc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  saveFileLocally({
    fileId: localId,
    fileName: finalFileName,
    mimeType: 'application/pdf',
    buffer,
    folderName: path.join(FOLDER_EXPEDIENTES, studentFolderName),
    tesistaId
  });

  return {
    fileId: localId,
    driveFileId: '',
    driveFileUrl: '',
    driveFolderId: `locfolder_${sanitizeFolderName(tesistaId || tesistaCodigo)}`,
    driveFolderUrl: '',
    previewUrl: `/api/files/${encodeURIComponent(localId)}`,
    sizeBytes: buffer.length,
    sizeLabel: formatBytesLabel(buffer.length),
    storage: 'local',
    folderName: studentFolderName
  };
}

export async function uploadAudioFile({ fileName = 'nota_voz.webm', mimeType = 'audio/webm', buffer }) {
  if (!buffer || buffer.length === 0) {
    throw new Error('El audio está vacío.');
  }
  if (buffer.length > 12 * 1024 * 1024) {
    throw new Error('La nota de voz excede el límite de 12 MB.');
  }

  const safeName = sanitizeFolderName(fileName);
  const cfg = loadConfig();

  if (isDriveReadyWithFolder()) {
    let audFolderId = cfg.audiosFolderId;
    if (!audFolderId) {
      const aud = await findOrCreateSubfolder(cfg.rootFolderId, FOLDER_AUDIOS);
      audFolderId = aud.id;
      saveConfig({ audiosFolderId: audFolderId });
    }

    const uploaded = await uploadBufferToDriveResumable({
      buffer,
      mimeType,
      fileName: safeName,
      parentId: audFolderId
    });

    const fileId = `gd_${uploaded.id}`;
    return {
      fileId,
      audioUrl: `/api/files/${encodeURIComponent(fileId)}`,
      driveFileUrl: uploaded.webViewLink,
      storage: 'google-drive'
    };
  }

  const localId = `loc_aud_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  saveFileLocally({
    fileId: localId,
    fileName: safeName,
    mimeType,
    buffer,
    folderName: FOLDER_AUDIOS
  });

  return {
    fileId: localId,
    audioUrl: `/api/files/${encodeURIComponent(localId)}`,
    driveFileUrl: '',
    storage: 'local'
  };
}

export async function uploadFormatoFile({ fileName, mimeType = 'application/pdf', buffer }) {
  if (!buffer || buffer.length === 0) {
    throw new Error('El archivo de formato está vacío.');
  }
  if (buffer.length > 25 * 1024 * 1024) {
    throw new Error('El formato supera el límite de 25 MB.');
  }

  const safeName = sanitizeFolderName(fileName || 'formato_unt.pdf');
  const cfg = loadConfig();

  if (isDriveReadyWithFolder()) {
    let fmtFolderId = cfg.formatosFolderId;
    if (!fmtFolderId) {
      const fmt = await findOrCreateSubfolder(cfg.rootFolderId, FOLDER_FORMATOS);
      fmtFolderId = fmt.id;
      saveConfig({ formatosFolderId: fmtFolderId });
    }

    const uploaded = await uploadBufferToDriveResumable({
      buffer,
      mimeType,
      fileName: safeName,
      parentId: fmtFolderId
    });

    const fileId = `gd_${uploaded.id}`;
    return {
      fileId,
      fileUrl: `/api/files/${encodeURIComponent(fileId)}`,
      driveFileUrl: uploaded.webViewLink,
      sizeLabel: formatBytesLabel(buffer.length),
      storage: 'google-drive'
    };
  }

  const localId = `loc_fmt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  saveFileLocally({
    fileId: localId,
    fileName: safeName,
    mimeType,
    buffer,
    folderName: FOLDER_FORMATOS
  });

  return {
    fileId: localId,
    fileUrl: `/api/files/${encodeURIComponent(localId)}`,
    driveFileUrl: '',
    sizeLabel: formatBytesLabel(buffer.length),
    storage: 'local'
  };
}

export async function streamFileById(fileId, res, { download = false, customName = '' } = {}) {
  const decodedId = decodeURIComponent(String(fileId || ''));

  if (decodedId.startsWith('gd_')) {
    const rawDriveId = decodedId.slice(3);
    // Obtener metadatos para nombre y tipo MIME reales
    const metaRes = await driveFetch(
      `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(rawDriveId)}?fields=name,mimeType,size&supportsAllDrives=true`
    );
    if (!metaRes.ok) {
      res.statusCode = 404;
      res.end('Archivo no encontrado en Google Drive.');
      return;
    }
    const meta = await metaRes.json();

    const mediaRes = await driveFetch(
      `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(rawDriveId)}?alt=media&supportsAllDrives=true`
    );
    if (!mediaRes.ok || !mediaRes.body) {
      res.statusCode = 502;
      res.end('No se pudo leer el archivo desde Google Drive.');
      return;
    }

    const fileName = sanitizeFolderName(customName || meta.name || 'archivo.pdf');
    res.statusCode = 200;
    res.setHeader('Content-Type', meta.mimeType || 'application/octet-stream');
    if (meta.size) res.setHeader('Content-Length', String(meta.size));
    res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'private, max-age=300');

    const { Readable } = await import('node:stream');
    Readable.fromWeb(mediaRes.body).pipe(res);
    return;
  }

  // Archivo en disco local del servidor
  const index = readJsonSafe(LOCAL_FILES_INDEX_PATH, {});
  const entry = index[decodedId];
  if (!entry || !fs.existsSync(entry.diskPath)) {
    res.statusCode = 404;
    res.end('Archivo no encontrado en almacenamiento.');
    return;
  }

  const fileName = sanitizeFolderName(customName || entry.fileName || 'archivo.pdf');
  const stat = fs.statSync(entry.diskPath);
  res.statusCode = 200;
  res.setHeader('Content-Type', entry.mimeType || 'application/octet-stream');
  res.setHeader('Content-Length', String(stat.size));
  res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${fileName}"`);
  res.setHeader('Cache-Control', 'private, max-age=300');
  fs.createReadStream(entry.diskPath).pipe(res);
}

export async function deleteFileById(fileId) {
  const decodedId = decodeURIComponent(String(fileId || ''));
  if (!decodedId) return { ok: true, deleted: false };

  if (decodedId.startsWith('gd_')) {
    if (!isDriveConnected()) return { ok: true, deleted: false };
    const rawDriveId = decodedId.slice(3);
    // Eliminar permanentemente del Drive para liberar los 15 GB de inmediato
    const delRes = await driveFetch(
      `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(rawDriveId)}?supportsAllDrives=true`,
      { method: 'DELETE' }
    );
    if (!delRes.ok && delRes.status !== 404) {
      // Fallback: mover a papelera si no permite borrado permanente directo
      await driveFetch(`${GOOGLE_DRIVE_API}/files/${encodeURIComponent(rawDriveId)}?supportsAllDrives=true`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ trashed: true })
      });
    }
    return { ok: true, deleted: true, storage: 'google-drive' };
  }

  const index = readJsonSafe(LOCAL_FILES_INDEX_PATH, {});
  const entry = index[decodedId];
  if (entry) {
    try {
      if (fs.existsSync(entry.diskPath)) fs.unlinkSync(entry.diskPath);
    } catch {
      // ignore
    }
    delete index[decodedId];
    writeJsonSafe(LOCAL_FILES_INDEX_PATH, index);
    return { ok: true, deleted: true, storage: 'local' };
  }
  return { ok: true, deleted: false };
}

/**
 * Elimina la carpeta individual completa de un tesista (cuando se titula o Secretaría decide limpiar)
 * tanto en Google Drive (borra la carpeta entera con todos sus PDFs adentro) como en almacenamiento local.
 */
export async function deleteTesistaFolderComplete({
  tesistaId = '',
  tesistaNombre = '',
  tesistaCodigo = '',
  driveFolderId = '',
  fileIds = []
}) {
  let deletedFromDrive = false;
  let deletedLocalCount = 0;

  if (isDriveReadyWithFolder()) {
    let targetFolderId = driveFolderId && !driveFolderId.startsWith('locfolder_') ? driveFolderId : '';

    // Si no nos pasaron el folderId, buscarlo por nombre dentro de Expedientes_Tesistas
    if (!targetFolderId) {
      const cfg = loadConfig();
      if (cfg.expedientesFolderId) {
        const expectedName = sanitizeFolderName(`${tesistaNombre} (${tesistaCodigo || tesistaId})`);
        const escaped = expectedName.replace(/'/g, "\\'");
        const q = `'${cfg.expedientesFolderId}' in parents and name = '${escaped}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        const searchRes = await driveFetch(
          `${GOOGLE_DRIVE_API}/files?${new URLSearchParams({ q, fields: 'files(id,name)', pageSize: '1', supportsAllDrives: 'true', includeItemsFromAllDrives: 'true' }).toString()}`
        );
        const searchData = await searchRes.json();
        if (searchRes.ok && searchData.files?.[0]?.id) {
          targetFolderId = searchData.files[0].id;
        }
      }
    }

    if (targetFolderId) {
      const delRes = await driveFetch(
        `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(targetFolderId)}?supportsAllDrives=true`,
        { method: 'DELETE' }
      );
      if (!delRes.ok && delRes.status !== 404) {
        await driveFetch(`${GOOGLE_DRIVE_API}/files/${encodeURIComponent(targetFolderId)}?supportsAllDrives=true`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ trashed: true })
        });
      }
      deletedFromDrive = true;
    }

    // Borrar también cualquier fileId suelto si quedó fuera de la carpeta
    for (const fid of fileIds || []) {
      if (fid && String(fid).startsWith('gd_')) {
        try {
          await deleteFileById(fid);
        } catch {
          // already deleted with folder
        }
      }
    }
  }

  // Limpiar copia local si existe
  const index = readJsonSafe(LOCAL_FILES_INDEX_PATH, {});
  const idsToDelete = new Set((fileIds || []).filter((f) => f && !String(f).startsWith('gd_')));
  for (const [fid, entry] of Object.entries(index)) {
    if (
      idsToDelete.has(fid) ||
      (tesistaId && entry.tesistaId === tesistaId) ||
      (tesistaCodigo && String(entry.folderName || '').includes(tesistaCodigo))
    ) {
      try {
        if (fs.existsSync(entry.diskPath)) fs.unlinkSync(entry.diskPath);
      } catch {
        // ignore
      }
      delete index[fid];
      deletedLocalCount++;
    }
  }
  writeJsonSafe(LOCAL_FILES_INDEX_PATH, index);

  return {
    ok: true,
    deletedFromDrive,
    deletedLocalCount
  };
}
