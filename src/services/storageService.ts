/**
 * Generic LocalStorage wrapper to persist state between page reloads
 * and facilitate future institutional database integration.
 */

const SCHEMA_VERSION_KEY = 'unt_industrial_schema_v';
const CURRENT_SCHEMA_VERSION = '2026.11.25-v4-clean';

const OPERATIONAL_KEYS = [
  'unt_industrial_tesis',
  'unt_industrial_reservas',
  'unt_industrial_bloqueos',
  'unt_industrial_fechas_habilitadas',
  'unt_industrial_slots_por_fecha',
  'unt_industrial_slots_default',
  'unt_industrial_documentos',
  'unt_industrial_consultas',
  'unt_industrial_comunicados_generales',
  'unt_industrial_correos_autorizados',
  'unt_industrial_user_session',
  'unt_industrial_seguimiento_logistico_v1',
  'unt_industrial_seguimiento_logistico_v2',
  'unt_industrial_directorio_jurado_v1',
  'unt_industrial_directorio_jurado_v2',
  'unt_industrial_instrucciones_pasos_v1',
  'unt_industrial_instrucciones_pasos_v2',
  'unt_industrial_faqs_v1',
  'unt_industrial_faqs_v2'
];

export const storageService = {
  /**
   * Garantiza que cualquier dato de pruebas antiguas en el navegador se limpie
   * automáticamente al cargar la versión de producción limpia.
   */
  ensureCleanProductionSchema(): void {
    try {
      const current = localStorage.getItem(SCHEMA_VERSION_KEY);
      if (current !== CURRENT_SCHEMA_VERSION) {
        OPERATIONAL_KEYS.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION);
      }
    } catch (e) {
      console.warn('Error verificando versión de esquema localStorage:', e);
    }
  },

  resetAllOperationalData(): void {
    try {
      OPERATIONAL_KEYS.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION);
    } catch (e) {
      console.warn('Error limpiando datos operativos:', e);
    }
  },

  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Error writing to localStorage key "${key}":`, e);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Error removing localStorage key "${key}":`, e);
    }
  }
};
