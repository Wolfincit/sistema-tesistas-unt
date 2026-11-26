/**
 * Cliente Ligero Nativo de Turso (libSQL HTTP Pipeline API v2) — Cero Dependencias Externas
 *
 * - Usa únicamente fetch() nativo de Node 22/24.
 * - Plan gratuito permanente de Turso: sin tarjeta, 5 GB, nunca se pausa en vacaciones.
 * - Variables de entorno:
 *     UNT_TURSO_URL        -> ej. libsql://tesistas-unt-xxx.turso.io  o  https://tesistas-unt-xxx.turso.io
 *     UNT_TURSO_AUTH_TOKEN -> Token JWT generado en Turso
 * - Si no están configuradas, todas las funciones devuelven null/false sin romper el modo local.
 */

let schemaReadyPromise = null;

function normalizeTursoHttpUrl(rawUrl) {
  const clean = String(rawUrl || '').trim();
  if (!clean) return '';
  if (clean.startsWith('libsql://')) return `https://${clean.slice('libsql://'.length).replace(/\/+$/, '')}`;
  if (clean.startsWith('https://') || clean.startsWith('http://')) return clean.replace(/\/+$/, '');
  return `https://${clean.replace(/\/+$/, '')}`;
}

export function isTursoConfigured() {
  return Boolean(
    normalizeTursoHttpUrl(process.env.UNT_TURSO_URL || process.env.TURSO_DATABASE_URL) &&
      String(process.env.UNT_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || '').trim()
  );
}

export function getTursoConfigInfo() {
  const baseUrl = normalizeTursoHttpUrl(process.env.UNT_TURSO_URL || process.env.TURSO_DATABASE_URL);
  const hasToken = Boolean(String(process.env.UNT_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || '').trim());
  return {
    configured: Boolean(baseUrl && hasToken),
    host: baseUrl ? new URL(baseUrl).host : ''
  };
}

async function tursoPipeline(requests) {
  const baseUrl = normalizeTursoHttpUrl(process.env.UNT_TURSO_URL || process.env.TURSO_DATABASE_URL);
  const token = String(process.env.UNT_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || '').trim();
  if (!baseUrl || !token) return null;

  const res = await fetch(`${baseUrl}/v2/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [...requests, { type: 'close' }]
    })
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Turso HTTP ${res.status}: ${txt.slice(0, 180)}`);
  }

  const json = await res.json();
  const firstErr = (json.results || []).find((r) => r.type === 'error');
  if (firstErr) {
    throw new Error(firstErr.error?.message || 'Error ejecutando consulta SQL en Turso.');
  }
  return json.results || [];
}

export async function ensureTursoSchema() {
  if (!isTursoConfigured()) return false;
  if (!schemaReadyPromise) {
    schemaReadyPromise = tursoPipeline([
      {
        type: 'execute',
        stmt: {
          sql: `CREATE TABLE IF NOT EXISTS unt_kv_store (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )`
        }
      }
    ])
      .then(() => true)
      .catch((err) => {
        schemaReadyPromise = null;
        console.warn('[Turso] No se pudo inicializar esquema:', err.message);
        return false;
      });
  }
  return schemaReadyPromise;
}

export async function tursoGetJson(key) {
  if (!isTursoConfigured()) return null;
  const ready = await ensureTursoSchema();
  if (!ready) return null;

  try {
    const results = await tursoPipeline([
      {
        type: 'execute',
        stmt: {
          sql: 'SELECT value FROM unt_kv_store WHERE key = ? LIMIT 1',
          args: [{ type: 'text', value: String(key) }]
        }
      }
    ]);
    const rows = results?.[0]?.response?.result?.rows || [];
    if (!rows.length || !rows[0]?.[0]?.value) return null;
    return JSON.parse(rows[0][0].value);
  } catch (err) {
    console.warn(`[Turso] Error leyendo "${key}":`, err.message);
    return null;
  }
}

export async function tursoSetJson(key, data) {
  if (!isTursoConfigured()) return false;
  const ready = await ensureTursoSchema();
  if (!ready) return false;

  try {
    const serialized = JSON.stringify(data);
    const now = new Date().toISOString();
    await tursoPipeline([
      {
        type: 'execute',
        stmt: {
          sql: `INSERT INTO unt_kv_store (key, value, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
          args: [
            { type: 'text', value: String(key) },
            { type: 'text', value: serialized },
            { type: 'text', value: now }
          ]
        }
      }
    ]);
    return true;
  } catch (err) {
    console.warn(`[Turso] Error guardando "${key}":`, err.message);
    return false;
  }
}
