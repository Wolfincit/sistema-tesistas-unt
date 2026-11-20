/**
 * Servidor de Producción Independiente — Sistema de Gestión de Tesistas UNT
 * Sirve la aplicación web compilada (dist/) y la API en tiempo real del
 * Repositorio Multi-Universidad de Ingeniería Industrial (/api/repositorio/*).
 * Listo para desplegar bajo cualquier dominio institucional (ej. industrial.unitru.edu.pe).
 *
 * Uso:
 *   npm run build
 *   npm start
 *   (o PORT=8080 node server/index.mjs)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import {
  UNIVERSIDADES_CONFIG,
  buscarTesisEnVivo,
  abrirStreamPdfReal
} from './repositorioEngine.mjs';
import {
  saveOAuthCredentials,
  buildOAuthAuthUrl,
  handleOAuthCallback,
  disconnectDrive,
  getDriveStatus,
  listDriveFolders,
  createDriveFolder,
  selectRootFolder,
  getDbState,
  saveDbCollection,
  uploadDocumentoTesista,
  uploadAudioFile,
  uploadFormatoFile,
  streamFileById,
  deleteFileById,
  deleteTesistaFolderComplete
} from './googleDriveEngine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.pdf': 'application/pdf'
};

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQ_PER_WINDOW = 180;
const SCRAPER_UA_RE = /(scrapy|python-requests|python-urllib|httrack|libwww-perl|go-http-client|sqlmap|nikto|nmap|masscan)/i;

function getRequestOrigin(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`).split(',')[0].trim();
  return `${proto}://${host}`;
}

function readRawBody(req, maxBytes = 27 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('El archivo excede el tamaño máximo permitido (25 MB).'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJsonBody(req, maxBytes = 5 * 1024 * 1024) {
  const raw = await readRawBody(req, maxBytes);
  if (!raw.length) return {};
  return JSON.parse(raw.toString('utf-8'));
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function decodeHeaderVal(val, fallback = '') {
  if (!val) return fallback;
  try {
    return decodeURIComponent(String(val));
  } catch {
    return String(val);
  }
}

export async function handleApiRequest(req, res) {
  // Cabeceras de blindaje y seguridad Anti-Scraping / Anti-XSS
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const ua = String(req.headers['user-agent'] || '');
  if (SCRAPER_UA_RE.test(ua)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Acceso denegado: Herramienta de scraping automatizado bloqueada.' }));
    return true;
  }

  const clientIp = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local').split(',')[0].trim();
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp) || { count: 0, start: now };
  if (now - entry.start > RATE_LIMIT_WINDOW_MS) {
    entry.count = 1;
    entry.start = now;
  } else {
    entry.count += 1;
  }
  rateLimitMap.set(clientIp, entry);

  if (entry.count > MAX_REQ_PER_WINDOW) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Demasiadas peticiones. Protección anti-scraping activada temporalmente.' }));
    return true;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (urlObj.pathname === '/api/repositorio/universidades') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.end(
      JSON.stringify({
        universidades: UNIVERSIDADES_CONFIG.map(({ id, sigla, nombre, rankingLabel, fija, base, coleccionNombre }) => ({
          id,
          sigla,
          nombre,
          rankingLabel,
          fija,
          base,
          coleccionNombre
        }))
      })
    );
    return true;
  }

  if (urlObj.pathname === '/api/repositorio/buscar') {
    const query = urlObj.searchParams.get('q') || '';
    const unisRaw = urlObj.searchParams.get('universidades') || 'UNT';
    const universidades = unisRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const limitePorUni = Math.min(20, Math.max(4, parseInt(urlObj.searchParams.get('limit') || '10', 10) || 10));

    try {
      const data = await buscarTesisEnVivo({ query, universidades, limitePorUni });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(data));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Error consultando repositorios externos', detalle: err.message }));
    }
    return true;
  }

  if (urlObj.pathname === '/api/repositorio/pdf') {
    const mode = urlObj.searchParams.get('mode') === 'download' ? 'download' : 'inline';
    const uni = urlObj.searchParams.get('uni') || 'UNT';
    const uuid = urlObj.searchParams.get('uuid') || '';
    const url = urlObj.searchParams.get('url') || '';
    const autor = urlObj.searchParams.get('autor') || 'Tesista';
    const anio = urlObj.searchParams.get('anio') || '2025';
    const handle = urlObj.searchParams.get('handle') || 'https://repositorio.unitru.edu.pe';

    const slugAutor =
      autor
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 32) || 'Autor';
    const fileName = `Tesis_${uni}_${anio}_${slugAutor}.pdf`;
    const directBitstream = url && url.startsWith('http') ? url : handle;

    try {
      const streamInfo = await abrirStreamPdfReal({ uni, uuid, url });
      if (streamInfo && streamInfo.body) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/pdf');
        if (streamInfo.contentLength) {
          res.setHeader('Content-Length', String(streamInfo.contentLength));
        }
        res.setHeader(
          'Content-Disposition',
          `${mode === 'download' ? 'attachment' : 'inline'}; filename="${fileName}"`
        );
        res.setHeader('Cache-Control', 'public, max-age=1800');
        Readable.fromWeb(streamInfo.body).pipe(res);
        return true;
      }
    } catch {
      // Fallback below
    }

    // Redirigir directamente al bitstream oficial (para que el navegador del usuario lo abra con su sesión)
    res.statusCode = 302;
    res.setHeader('Location', directBitstream);
    res.end();
    return true;
  }

  // ======================================================
  // API GOOGLE DRIVE (OAUTH 2.0 + EXPLORADOR DE CARPETAS)
  // ======================================================
  if (urlObj.pathname === '/api/drive/status' && req.method === 'GET') {
    try {
      const status = await getDriveStatus(getRequestOrigin(req));
      sendJson(res, 200, status);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return true;
  }

  if (urlObj.pathname === '/api/drive/credentials' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const out = saveOAuthCredentials(body);
      sendJson(res, 200, out);
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return true;
  }

  if (urlObj.pathname === '/api/drive/auth-url' && req.method === 'GET') {
    try {
      const out = buildOAuthAuthUrl(getRequestOrigin(req));
      sendJson(res, 200, out);
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return true;
  }

  if (urlObj.pathname === '/api/drive/callback' && req.method === 'GET') {
    const code = urlObj.searchParams.get('code') || '';
    const state = urlObj.searchParams.get('state') || '';
    const errParam = urlObj.searchParams.get('error') || '';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (errParam || !code) {
      res.statusCode = 200;
      res.end(`<!doctype html><html lang="es"><body style="font-family:system-ui;padding:32px;text-align:center;background:#f8fafc;color:#0f172a">
        <h2>Autorización cancelada</h2>
        <p>${errParam || 'No se recibió código de Google.'}</p>
        <script>
          if (window.opener) window.opener.postMessage({ type: 'UNT_DRIVE_ERROR', error: ${JSON.stringify(errParam || 'Autorización cancelada')} }, '*');
          setTimeout(() => window.close(), 1500);
        </script>
      </body></html>`);
      return true;
    }

    try {
      const info = await handleOAuthCallback({ code, state, origin: getRequestOrigin(req) });
      res.statusCode = 200;
      res.end(`<!doctype html><html lang="es"><body style="font-family:system-ui;padding:32px;text-align:center;background:#082F64;color:#fff">
        <h2 style="margin-bottom:8px;">✅ Google Drive conectado correctamente</h2>
        <p style="color:#bfdbfe;font-size:14px;">Cuenta: <strong>${info.accountEmail || 'Google Drive'}</strong></p>
        <p style="font-size:12px;color:#fde68a;">Esta ventana se cerrará automáticamente...</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'UNT_DRIVE_CONNECTED', email: ${JSON.stringify(info.accountEmail || '')}, name: ${JSON.stringify(info.accountName || '')} }, '*');
          }
          setTimeout(() => window.close(), 900);
        </script>
      </body></html>`);
    } catch (err) {
      res.statusCode = 200;
      res.end(`<!doctype html><html lang="es"><body style="font-family:system-ui;padding:32px;text-align:center;background:#fff1f2;color:#881337">
        <h2>No se pudo conectar Google Drive</h2>
        <p>${err.message}</p>
        <script>
          if (window.opener) window.opener.postMessage({ type: 'UNT_DRIVE_ERROR', error: ${JSON.stringify(err.message)} }, '*');
        </script>
      </body></html>`);
    }
    return true;
  }

  if (urlObj.pathname === '/api/drive/disconnect' && req.method === 'POST') {
    try {
      const out = await disconnectDrive();
      sendJson(res, 200, out);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return true;
  }

  if (urlObj.pathname === '/api/drive/folders' && req.method === 'GET') {
    try {
      const parentId = urlObj.searchParams.get('parentId') || 'root';
      const q = urlObj.searchParams.get('q') || '';
      const out = await listDriveFolders(parentId, q);
      sendJson(res, 200, out);
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return true;
  }

  if (urlObj.pathname === '/api/drive/folders' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const out = await createDriveFolder(body.name || 'Expedientes_Ing_Industrial_UNT', body.parentId || 'root');
      sendJson(res, 200, out);
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return true;
  }

  if (urlObj.pathname === '/api/drive/select-root' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const out = await selectRootFolder(body.folderIdOrLink || body.folderId || '');
      sendJson(res, 200, out);
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return true;
  }

  // ======================================================
  // API BASE DE DATOS COMPARTIDA (GOOGLE DRIVE / LOCAL)
  // ======================================================
  if (urlObj.pathname === '/api/db/state' && req.method === 'GET') {
    try {
      const force = urlObj.searchParams.get('force') === '1';
      const state = await getDbState({ forceDrivePull: force });
      sendJson(res, 200, state);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return true;
  }

  if (urlObj.pathname.startsWith('/api/db/collection/') && req.method === 'PUT') {
    try {
      const name = decodeURIComponent(urlObj.pathname.slice('/api/db/collection/'.length));
      const body = await readJsonBody(req, 10 * 1024 * 1024);
      const out = await saveDbCollection(name, body.data);
      sendJson(res, 200, out);
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return true;
  }

  // ======================================================
  // API SUBIDA, VISOR Y BORRADO REAL DE ARCHIVOS (PDF / AUDIOS / FORMATOS)
  // ======================================================
  if (urlObj.pathname === '/api/files/upload-documento' && req.method === 'POST') {
    try {
      const buffer = await readRawBody(req, 26 * 1024 * 1024);
      const out = await uploadDocumentoTesista({
        tesistaId: decodeHeaderVal(req.headers['x-tesista-id'], 'tesista'),
        tesistaNombre: decodeHeaderVal(req.headers['x-tesista-nombre'], 'Tesista UNT'),
        tesistaCodigo: decodeHeaderVal(req.headers['x-tesista-codigo'], ''),
        tipoId: decodeHeaderVal(req.headers['x-tipo-id'], 'documento'),
        fileName: decodeHeaderVal(req.headers['x-file-name'], 'documento.pdf'),
        mimeType: String(req.headers['content-type'] || 'application/pdf'),
        anteriorFileId: decodeHeaderVal(req.headers['x-anterior-file-id'], ''),
        buffer
      });
      sendJson(res, 200, out);
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return true;
  }

  if (urlObj.pathname === '/api/files/upload-audio' && req.method === 'POST') {
    try {
      const buffer = await readRawBody(req, 13 * 1024 * 1024);
      const out = await uploadAudioFile({
        fileName: decodeHeaderVal(req.headers['x-file-name'], `nota_voz_${Date.now()}.webm`),
        mimeType: String(req.headers['content-type'] || 'audio/webm'),
        buffer
      });
      sendJson(res, 200, out);
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return true;
  }

  if (urlObj.pathname === '/api/files/upload-formato' && req.method === 'POST') {
    try {
      const buffer = await readRawBody(req, 26 * 1024 * 1024);
      const out = await uploadFormatoFile({
        fileName: decodeHeaderVal(req.headers['x-file-name'], 'formato_unt.pdf'),
        mimeType: String(req.headers['content-type'] || 'application/pdf'),
        buffer
      });
      sendJson(res, 200, out);
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return true;
  }

  if (urlObj.pathname === '/api/files/delete-tesista-folder' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const out = await deleteTesistaFolderComplete(body);
      sendJson(res, 200, out);
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return true;
  }

  if (urlObj.pathname.startsWith('/api/files/') && req.method === 'GET') {
    try {
      const fileId = urlObj.pathname.slice('/api/files/'.length);
      const download = urlObj.searchParams.get('download') === '1';
      const customName = urlObj.searchParams.get('name') || '';
      await streamFileById(fileId, res, { download, customName });
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return true;
  }

  if (urlObj.pathname.startsWith('/api/files/') && req.method === 'DELETE') {
    try {
      const fileId = urlObj.pathname.slice('/api/files/'.length);
      const out = await deleteFileById(fileId);
      sendJson(res, 200, out);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return true;
  }

  return false;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/healthz') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ status: 'ok', service: 'sistema-tesistas-unt' }));
      return;
    }

    if (
      req.url &&
      (req.url.startsWith('/api/repositorio/') ||
        req.url.startsWith('/api/drive/') ||
        req.url.startsWith('/api/db/') ||
        req.url.startsWith('/api/files/'))
    ) {
      const handled = await handleApiRequest(req, res);
      if (handled) return;
    }

    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let safePath = path.normalize(decodeURIComponent(urlObj.pathname)).replace(/^(\.\.[/\\])+/, '');
    if (safePath === '/' || safePath === '\\') safePath = 'index.html';

    let filePath = path.join(DIST_DIR, safePath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.end('Build no encontrado. Ejecute "npm run build" primero.');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    if (safePath.includes('assets')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-cache');
    }
    fs.createReadStream(filePath).pipe(res);
  });

  server.listen(PORT, HOST, () => {
    console.log(`✅ Sistema de Gestión de Tesistas UNT listo en http://${HOST}:${PORT}`);
  });
}
