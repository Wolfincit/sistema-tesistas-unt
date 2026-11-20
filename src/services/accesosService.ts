import { CorreoAutorizado } from '../types';
import { INITIAL_CORREOS_AUTORIZADOS } from '../data/mockCorreosAutorizados';
import { storageService } from './storageService';
import { hashPasswordSalted, verificarPasswordHash, sanitizarTextoSeguro } from '../utils/security';

const CORREOS_KEY = 'unt_industrial_correos_autorizados';
const PADRON_SEEDED_KEY = 'unt_industrial_padron_seeded_v4';
const SECRETARIA_PWD_KEY = 'unt_industrial_secretaria_pwd_hash_v1';

function normalizarRegistroConHash(c: CorreoAutorizado): CorreoAutorizado {
  const basePwd = c.password || c.codigoMatricula;
  return {
    ...c,
    password: hashPasswordSalted(basePwd),
    passwordCambiada: Boolean(c.passwordCambiada)
  };
}

export const accesosService = {
  async getCorreos(): Promise<CorreoAutorizado[]> {
    const actuales = storageService.get<CorreoAutorizado[]>(CORREOS_KEY, INITIAL_CORREOS_AUTORIZADOS);
    const yaSembrado = storageService.get<boolean>(PADRON_SEEDED_KEY, false);
    if (!yaSembrado && actuales.length === 0) {
      const hashedInit = INITIAL_CORREOS_AUTORIZADOS.map(normalizarRegistroConHash);
      storageService.set(CORREOS_KEY, hashedInit);
      storageService.set(PADRON_SEEDED_KEY, true);
      return hashedInit;
    }

    // Migrar silenciosamente cualquier registro previo sin hash SHA-256
    let requiereGuardado = false;
    const seguros = actuales.map((c) => {
      if (!c.password || !c.password.startsWith('sha256:')) {
        requiereGuardado = true;
        return normalizarRegistroConHash(c);
      }
      return c;
    });

    if (requiereGuardado) {
      storageService.set(CORREOS_KEY, seguros);
    }
    return seguros;
  },

  async saveCorreos(correos: CorreoAutorizado[]): Promise<void> {
    storageService.set(CORREOS_KEY, correos.map(normalizarRegistroConHash));
  },

  getSecretariaPasswordHash(): string {
    const stored = storageService.get<string>(SECRETARIA_PWD_KEY, '');
    if (!stored) {
      const defHash = hashPasswordSalted('UNT2026*');
      storageService.set(SECRETARIA_PWD_KEY, defHash);
      return defHash;
    }
    return stored.startsWith('sha256:') ? stored : hashPasswordSalted(stored);
  },

  verificarSecretariaPassword(rawPassword: string): boolean {
    return verificarPasswordHash(rawPassword, this.getSecretariaPasswordHash());
  },

  cambiarSecretariaPassword(passwordActual: string, nuevaPassword: string): void {
    if (!this.verificarSecretariaPassword(passwordActual)) {
      throw new Error('La contraseña actual de Secretaría no es correcta.');
    }
    const limpia = sanitizarTextoSeguro(nuevaPassword);
    if (limpia.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }
    storageService.set(SECRETARIA_PWD_KEY, hashPasswordSalted(limpia));
  },

  verificarPasswordRegistro(registro: CorreoAutorizado, rawPassword: string): boolean {
    const stored = registro.password || hashPasswordSalted(registro.codigoMatricula);
    return verificarPasswordHash(rawPassword, stored);
  },

  async validarAcceso(correo: string, password?: string): Promise<boolean> {
    const normalizado = correo.trim().toLowerCase();
    const correos = await this.getCorreos();
    return correos.some(
      (c) =>
        c.correo.toLowerCase() === normalizado &&
        c.activo &&
        (!password || this.verificarPasswordRegistro(c, password))
    );
  },

  async agregarCorreo(datos: {
    correo: string;
    nombreGraduando: string;
    codigoMatricula: string;
    promocion?: string;
  }): Promise<CorreoAutorizado> {
    const correos = await this.getCorreos();
    const normalizado = sanitizarTextoSeguro(datos.correo).toLowerCase();
    const codLimpio = sanitizarTextoSeguro(datos.codigoMatricula);

    if (correos.some((c) => c.correo.toLowerCase() === normalizado)) {
      throw new Error(`El correo ${normalizado} ya se encuentra registrado en el padrón.`);
    }

    const nuevo: CorreoAutorizado = {
      id: `cor-${Date.now()}`,
      correo: normalizado,
      nombreGraduando: sanitizarTextoSeguro(datos.nombreGraduando),
      codigoMatricula: codLimpio,
      promocion: sanitizarTextoSeguro(datos.promocion || '2026-I'),
      fechaHabilitacion: new Date().toISOString().split('T')[0],
      activo: true,
      password: hashPasswordSalted(codLimpio),
      passwordCambiada: false
    };

    const actualizados = [nuevo, ...correos];
    await this.saveCorreos(actualizados);
    return nuevo;
  },

  async cambiarPasswordTesista(
    correo: string,
    passwordActual: string,
    nuevaPassword: string
  ): Promise<CorreoAutorizado> {
    const correos = await this.getCorreos();
    const normalizado = correo.trim().toLowerCase();
    const idx = correos.findIndex((c) => c.correo.toLowerCase() === normalizado);
    if (idx === -1) {
      throw new Error('No se encontró el registro del tesista en el padrón.');
    }

    if (!this.verificarPasswordRegistro(correos[idx], passwordActual)) {
      throw new Error('La contraseña actual ingresada no es correcta.');
    }

    const limpia = sanitizarTextoSeguro(nuevaPassword);
    if (limpia.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    correos[idx] = {
      ...correos[idx],
      password: hashPasswordSalted(limpia),
      passwordCambiada: true
    };
    await this.saveCorreos(correos);
    return correos[idx];
  },

  async resetearPasswordAMatricula(id: string): Promise<CorreoAutorizado> {
    const correos = await this.getCorreos();
    const idx = correos.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Registro no encontrado.');

    correos[idx] = {
      ...correos[idx],
      password: hashPasswordSalted(correos[idx].codigoMatricula),
      passwordCambiada: false
    };
    await this.saveCorreos(correos);
    return correos[idx];
  },

  async importarDesdeTextoOArchivo(contenido: string): Promise<{ agregados: number; omitidos: number }> {
    const correosActuales = await this.getCorreos();
    const correosExistentesSet = new Set(correosActuales.map((c) => c.correo.toLowerCase()));

    const regexEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const encontrados = contenido.match(regexEmail) || [];

    let agregados = 0;
    let omitidos = 0;
    const nuevos: CorreoAutorizado[] = [];

    const now = new Date().toISOString().split('T')[0];

    for (const email of encontrados) {
      const emailLimpio = email.toLowerCase().trim();
      if (!correosExistentesSet.has(emailLimpio)) {
        correosExistentesSet.add(emailLimpio);

        const userPart = emailLimpio.split('@')[0];
        const nombreFormateado = userPart
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
        const codGenerado = `1021${Math.floor(100000 + Math.random() * 900000)}`;

        nuevos.push({
          id: `cor-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          correo: emailLimpio,
          nombreGraduando: `Graduando (${nombreFormateado})`,
          codigoMatricula: codGenerado,
          promocion: '2026-I',
          fechaHabilitacion: now,
          activo: true,
          password: hashPasswordSalted(codGenerado),
          passwordCambiada: false
        });
        agregados++;
      } else {
        omitidos++;
      }
    }

    if (nuevos.length > 0) {
      await this.saveCorreos([...nuevos, ...correosActuales]);
    }

    return { agregados, omitidos };
  },

  async editarCorreo(id: string, datos: Partial<CorreoAutorizado>): Promise<CorreoAutorizado> {
    const correos = await this.getCorreos();
    const idx = correos.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Registro no encontrado.');

    const actual = correos[idx];
    const nuevoCodigo = datos.codigoMatricula ? sanitizarTextoSeguro(datos.codigoMatricula) : actual.codigoMatricula;
    const updated: CorreoAutorizado = {
      ...actual,
      ...datos,
      codigoMatricula: nuevoCodigo,
      password: actual.passwordCambiada ? actual.password : hashPasswordSalted(nuevoCodigo)
    };
    correos[idx] = updated;
    await this.saveCorreos(correos);
    return updated;
  },

  async toggleActivo(id: string): Promise<CorreoAutorizado> {
    const correos = await this.getCorreos();
    const idx = correos.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Registro no encontrado.');

    correos[idx].activo = !correos[idx].activo;
    await this.saveCorreos(correos);
    return correos[idx];
  },

  async eliminarCorreo(id: string): Promise<void> {
    const correos = await this.getCorreos();
    const filtrados = correos.filter((c) => c.id !== id);
    await this.saveCorreos(filtrados);
  },

  async eliminarMultiple(ids: string[]): Promise<void> {
    const idsSet = new Set(ids);
    const correos = await this.getCorreos();
    const filtrados = correos.filter((c) => !idsSet.has(c.id));
    await this.saveCorreos(filtrados);
  },

  async restablecerPadron(): Promise<CorreoAutorizado[]> {
    const hashed = INITIAL_CORREOS_AUTORIZADOS.map(normalizarRegistroConHash);
    await this.saveCorreos(hashed);
    return hashed;
  },

  async limpiarPadron(): Promise<void> {
    await this.saveCorreos([]);
  }
};
