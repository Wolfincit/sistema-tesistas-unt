/**
 * Cargador nativo de archivo .env (cero dependencias).
 * Se ejecuta al iniciar el servidor para leer automáticamente credenciales de fábrica
 * (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN, UNT_VAULT_URL, etc.)
 * en cualquier servidor o PC sin sobrescribir variables ya inyectadas por la nube (Render/Docker).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch (err) {
    console.warn(`[EnvLoader] No se pudo leer ${filePath}:`, err.message);
  }
}

parseEnvFile(path.join(ROOT_DIR, '.env'));
parseEnvFile(path.join(ROOT_DIR, '.env.local'));
parseEnvFile(path.join(__dirname, '.env'));
