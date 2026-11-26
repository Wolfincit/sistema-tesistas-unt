/**
 * Adaptador Serverless para Vercel — Sistema de Tesistas Ing. Industrial UNT
 * Redirige /healthz y /api/* al motor Node.js unificado (server/index.mjs) sin reescribir lógica.
 */

import { handleApiRequest } from '../server/index.mjs';
import { getTursoConfigInfo } from '../server/tursoEngine.mjs';
import { getEmailStatusHydrated } from '../server/emailEngine.mjs';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  const url = String(req.url || '/');

  if (url === '/healthz' || url.startsWith('/healthz?')) {
    const mailSt = await getEmailStatusHydrated();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        status: 'ok',
        runtime: 'vercel-serverless',
        service: 'sistema-tesistas-unt',
        turso: getTursoConfigInfo(),
        emailReady: Boolean(mailSt.serverTransportReady),
        emailMode: mailSt.mode
      })
    );
    return;
  }

  const handled = await handleApiRequest(req, res);
  if (!handled && !res.writableEnded) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Ruta API no encontrada.' }));
  }
}
