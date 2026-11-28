/**
 * Motor de Publicación Directa de Flyers a Página de Facebook (Meta Graph API v22.0)
 * Escuela Profesional de Ingeniería Industrial — Universidad Nacional de Trujillo.
 *
 * - Cero dependencias externas (usa fetch, FormData y Blob nativos de Node 22/24).
 * - Publica ÚNICAMENTE la imagen del flyer (sin texto/caption), tal como lo usa la Escuela.
 * - Soporta configuración desde variables de entorno (FACEBOOK_PAGE_ID + FACEBOOK_PAGE_ACCESS_TOKEN)
 *   o desde el panel de Secretaría (guardado permanentemente en Turso).
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tursoGetJson, tursoSetJson } from './tursoEngine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RUNTIME_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'unt-tesistas-runtime')
  : __dirname;
if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });

const FB_CONFIG_PATH = path.join(RUNTIME_DIR, '.facebook-config.json');
const FB_TURSO_KEY = 'unt_facebook_page_config_v1';
const GRAPH_API_BASE = 'https://graph.facebook.com/v22.0';

let memoryConfig = null;

function readLocalConfig() {
  try {
    if (fs.existsSync(FB_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(FB_CONFIG_PATH, 'utf-8'));
    }
  } catch {
    // Silencioso
  }
  return null;
}

function writeLocalConfig(cfg) {
  try {
    if (!cfg) {
      if (fs.existsSync(FB_CONFIG_PATH)) fs.unlinkSync(FB_CONFIG_PATH);
      return;
    }
    fs.writeFileSync(FB_CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch {
    // Silencioso
  }
}

async function resolveActiveConfig() {
  const envPageId = String(process.env.FACEBOOK_PAGE_ID || '').trim();
  const envToken = String(process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '').trim();

  // 1. Revisar Turso primero para permitir actualizar desde el panel si desean
  const fromTurso = await tursoGetJson(FB_TURSO_KEY).catch(() => null);
  if (fromTurso && fromTurso.pageId && fromTurso.pageAccessToken) {
    memoryConfig = fromTurso;
    writeLocalConfig(fromTurso);
    return { ...fromTurso, source: 'turso' };
  }

  // 2. Variables de entorno (Vercel / servidor)
  if (envPageId && envToken) {
    return {
      pageId: envPageId,
      pageAccessToken: envToken,
      pageName: String(process.env.FACEBOOK_PAGE_NAME || 'Escuela de Ingeniería Industrial UNT').trim(),
      pageUrl: `https://www.facebook.com/${envPageId}`,
      updatedAt: '',
      source: 'env'
    };
  }

  // 3. Caché local en memoria o disco
  const local = memoryConfig || readLocalConfig();
  if (local && local.pageId && local.pageAccessToken) {
    return { ...local, source: 'local' };
  }

  return null;
}

export async function getFacebookStatusHydrated() {
  const cfg = await resolveActiveConfig();
  if (!cfg) {
    return {
      connected: false,
      pageId: '',
      pageName: '',
      pageUrl: 'https://www.facebook.com/escueladeingenieriaindustrialunt',
      source: 'none'
    };
  }
  return {
    connected: true,
    pageId: cfg.pageId,
    pageName: cfg.pageName || 'Página de Facebook UNT',
    pageUrl: cfg.pageUrl || `https://www.facebook.com/${cfg.pageId}`,
    source: cfg.source || 'turso'
  };
}

export async function saveFacebookConfig({ pageId, pageAccessToken, pageName }) {
  const cleanId = String(pageId || '').trim();
  const cleanToken = String(pageAccessToken || '').trim();
  if (!cleanId) {
    throw new Error('Ingrese el ID de la Página de Facebook (Page ID).');
  }
  if (!cleanToken || cleanToken.length < 20) {
    throw new Error('Ingrese un Token de Acceso de Página válido generado en Meta Developers.');
  }

  // Verificar token y obtener el nombre real de la página directamente en Meta Graph API
  let verifiedName = String(pageName || '').trim();
  let verifiedUrl = `https://www.facebook.com/${cleanId}`;
  try {
    const checkUrl = `${GRAPH_API_BASE}/${encodeURIComponent(cleanId)}?fields=id,name,link&access_token=${encodeURIComponent(cleanToken)}`;
    const checkRes = await fetch(checkUrl);
    const checkData = await checkRes.json().catch(() => ({}));
    if (!checkRes.ok || checkData?.error) {
      const fbMsg = checkData?.error?.message || `Meta respondió con código ${checkRes.status}`;
      throw new Error(`Meta rechazó la conexión: ${fbMsg}`);
    }
    if (checkData.name) verifiedName = String(checkData.name);
    if (checkData.link) verifiedUrl = String(checkData.link);
  } catch (err) {
    throw new Error(err?.message || 'No se pudo validar el Token con Facebook Graph API.');
  }

  const saved = {
    pageId: cleanId,
    pageAccessToken: cleanToken,
    pageName: verifiedName || 'Escuela de Ingeniería Industrial UNT',
    pageUrl: verifiedUrl,
    updatedAt: new Date().toISOString()
  };

  memoryConfig = saved;
  writeLocalConfig(saved);
  await tursoSetJson(FB_TURSO_KEY, saved).catch(() => {});

  return {
    connected: true,
    pageId: saved.pageId,
    pageName: saved.pageName,
    pageUrl: saved.pageUrl,
    source: 'turso'
  };
}

export async function disconnectFacebook() {
  memoryConfig = null;
  writeLocalConfig(null);
  await tursoSetJson(FB_TURSO_KEY, { pageId: '', pageAccessToken: '', pageName: '' }).catch(() => {});
  return getFacebookStatusHydrated();
}

export async function publishFlyerImageToFacebook({ imageDataUrl, fileName }) {
  const cfg = await resolveActiveConfig();
  if (!cfg || !cfg.pageId || !cfg.pageAccessToken) {
    throw new Error(
      'Falta conectar la API de Facebook (Page ID y Token) en el botón de configuración (⚙️).'
    );
  }

  const rawDataUrl = String(imageDataUrl || '').trim();
  const match = rawDataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('No hay una imagen de flyer válida lista para publicar.');
  }

  const mimeType = match[1] || 'image/png';
  const base64Body = match[2].replace(/\s+/g, '');
  const imgBuffer = Buffer.from(base64Body, 'base64');
  if (imgBuffer.length < 100) {
    throw new Error('La imagen del flyer está vacía o dañada.');
  }

  const safeFileName = String(fileName || 'Flyer_UNT_Industrial.png').replace(/[^a-zA-Z0-9._-]/g, '_');
  const form = new FormData();
  form.append('source', new Blob([imgBuffer], { type: mimeType }), safeFileName);
  form.append('published', 'true');
  form.append('access_token', cfg.pageAccessToken);

  const endpoint = `${GRAPH_API_BASE}/${encodeURIComponent(cfg.pageId)}/photos`;
  const fbRes = await fetch(endpoint, {
    method: 'POST',
    body: form
  });
  const fbJson = await fbRes.json().catch(() => ({}));

  if (!fbRes.ok || fbJson?.error) {
    const fbErr = fbJson?.error?.message || `Error HTTP ${fbRes.status} de Meta Graph API.`;
    throw new Error(`No se pudo publicar en Facebook: ${fbErr}`);
  }

  const photoId = String(fbJson.id || '');
  const postId = String(fbJson.post_id || fbJson.id || '');
  const postUrl = photoId
    ? `https://www.facebook.com/photo/?fbid=${encodeURIComponent(photoId)}`
    : cfg.pageUrl || `https://www.facebook.com/${cfg.pageId}`;

  return {
    ok: true,
    photoId,
    postId,
    postUrl,
    pageName: cfg.pageName || 'Facebook UNT',
    message: `Flyer publicado directamente en ${cfg.pageName || 'la Página de Facebook'}.`
  };
}
