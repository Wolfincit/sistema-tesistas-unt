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
const MAX_REQ_PER_WINDOW = 90;
const SCRAPER_UA_RE = /(scrapy|python-requests|python-urllib|httrack|libwww-perl|go-http-client|sqlmap|nikto|nmap|masscan)/i;

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

    if (req.url && req.url.startsWith('/api/repositorio/')) {
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
