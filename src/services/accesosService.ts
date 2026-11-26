import { CorreoAutorizado, CuentaSecretaria } from '../types';
import { INITIAL_CORREOS_AUTORIZADOS } from '../data/mockCorreosAutorizados';
import { storageService } from './storageService';
import { driveApiService } from './driveApiService';
import { hashPasswordSalted, verificarPasswordHash, sanitizarTextoSeguro } from '../utils/security';

const CORREOS_KEY = 'unt_industrial_correos_autorizados';
const PADRON_SEEDED_KEY = 'unt_industrial_padron_seeded_v4';
const SECRETARIA_PWD_KEY = 'unt_industrial_secretaria_pwd_hash_v1';
const SECRETARIAS_KEY = 'unt_industrial_cuentas_secretaria_v1';
const SECRETARIAS_DEFAULT_PWD = 'UNT2026*';

const INITIAL_SECRETARIAS: CuentaSecretaria[] = [
  {
    id: 'sec-unt-001',
    correo: 'secretaria.industrial@unitru.edu.pe',
    nombre: 'Secretaría Académica Principal',
    cargo: 'Secretaría de Escuela — Ing. Industrial',
    fechaRegistro: '2026-03-01',
    activo: true,
    password: SECRETARIAS_DEFAULT_PWD,
    passwordCambiada: false
  },
  {
    id: 'sec-unt-002',
    correo: 'grados.industrial@unitru.edu.pe',
    nombre: 'Asistente de Grados y Títulos',
    cargo: 'Mesa de Partes y Expedientes — Ing. Industrial',
    fechaRegistro: '2026-03-01',
    activo: true,
    password: SECRETARIAS_DEFAULT_PWD,
    passwordCambiada: false
  }
];

function normalizarRegistroConHash(c: CorreoAutorizado): CorreoAutorizado {
  const basePwd = c.password || c.codigoMatricula;
  return {
    ...c,
    password: hashPasswordSalted(basePwd),
    passwordCambiada: Boolean(c.passwordCambiada)
  };
}

function normalizarSecretariaConHash(s: CuentaSecretaria): CuentaSecretaria {
  const basePwd = s.password || SECRETARIAS_DEFAULT_PWD;
  return {
    ...s,
    password: hashPasswordSalted(basePwd),
    passwordCambiada: Boolean(s.passwordCambiada)
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
    const hashed = correos.map(normalizarRegistroConHash);
    storageService.set(CORREOS_KEY, hashed);
    await driveApiService.saveCollection('correosAutorizados', hashed);
  },

  // =====================================================
  // GESTIÓN INDEPENDIENTE DE MÚLTIPLES SECRETARIAS
  // =====================================================
  async getSecretarias(): Promise<CuentaSecretaria[]> {
    const actuales = storageService.get<CuentaSecretaria[]>(SECRETARIAS_KEY, []);
    if (actuales.length === 0) {
      const hashedInit = INITIAL_SECRETARIAS.map(normalizarSecretariaConHash);
      storageService.set(SECRETARIAS_KEY, hashedInit);
      return hashedInit;
    }

    let requiereGuardado = false;
    const seguras = actuales.map((s) => {
      if (!s.password || !s.password.startsWith('sha256:')) {
        requiereGuardado = true;
        return normalizarSecretariaConHash(s);
      }
      return s;
    });

    if (requiereGuardado) {
      storageService.set(SECRETARIAS_KEY, seguras);
    }
    return seguras;
  },

  async saveSecretarias(secretarias: CuentaSecretaria[]): Promise<void> {
    const hashed = secretarias.map(normalizarSecretariaConHash);
    storageService.set(SECRETARIAS_KEY, hashed);
    await driveApiService.saveCollection('cuentasSecretaria', hashed);
  },

  verificarPasswordSecretariaRegistro(registro: CuentaSecretaria, rawPassword: string): boolean {
    const stored = registro.password || hashPasswordSalted(SECRETARIAS_DEFAULT_PWD);
    return verificarPasswordHash(rawPassword, stored);
  },

  async agregarSecretaria(datos: {
    correo: string;
    nombre: string;
    cargo: string;
    passwordInicial?: string;
  }): Promise<CuentaSecretaria> {
    const actuales = await this.getSecretarias();
    const normalizado = sanitizarTextoSeguro(datos.correo).toLowerCase();
    if (!normalizado.endsWith('@unitru.edu.pe')) {
      throw new Error('Las cuentas de Secretaría deben usar correo institucional @unitru.edu.pe.');
    }
    if (actuales.some((s) => s.correo.toLowerCase() === normalizado)) {
      throw new Error(`La cuenta ${normalizado} ya existe en el personal de Secretaría.`);
    }
    const pwdInicial = sanitizarTextoSeguro(datos.passwordInicial || SECRETARIAS_DEFAULT_PWD);
    if (pwdInicial.length < 6) {
      throw new Error('La contraseña inicial debe tener al menos 6 caracteres.');
    }

    const nueva: CuentaSecretaria = {
      id: `sec-${Date.now()}`,
      correo: normalizado,
      nombre: sanitizarTextoSeguro(datos.nombre),
      cargo: sanitizarTextoSeguro(datos.cargo || 'Secretaría Académica'),
      fechaRegistro: new Date().toISOString().split('T')[0],
      activo: true,
      password: hashPasswordSalted(pwdInicial),
      passwordCambiada: pwdInicial !== SECRETARIAS_DEFAULT_PWD
    };

    await this.saveSecretarias([nueva, ...actuales]);
    return nueva;
  },

  async toggleActivoSecretaria(id: string): Promise<CuentaSecretaria> {
    const actuales = await this.getSecretarias();
    const idx = actuales.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Cuenta de Secretaría no encontrada.');
    const activas = actuales.filter((s) => s.activo);
    if (actuales[idx].activo && activas.length <= 1) {
      throw new Error('Debe permanecer al menos una cuenta activa de Secretaría Académica.');
    }
    actuales[idx].activo = !actuales[idx].activo;
    await this.saveSecretarias(actuales);
    return actuales[idx];
  },

  async eliminarSecretaria(id: string): Promise<void> {
    const actuales = await this.getSecretarias();
    const restantes = actuales.filter((s) => s.id !== id);
    if (restantes.filter((s) => s.activo).length === 0) {
      throw new Error('No puede eliminar la última cuenta activa de Secretaría Académica.');
    }
    await this.saveSecretarias(restantes);
  },

  async cambiarPasswordSecretariaPorCorreo(
    correo: string,
    passwordActual: string,
    nuevaPassword: string
  ): Promise<CuentaSecretaria> {
    const actuales = await this.getSecretarias();
    const normalizado = correo.trim().toLowerCase();
    const idx = actuales.findIndex((s) => s.correo.toLowerCase() === normalizado);
    if (idx === -1) {
      throw new Error('No se encontró la cuenta de Secretaría.');
    }
    if (!this.verificarPasswordSecretariaRegistro(actuales[idx], passwordActual)) {
      throw new Error('La contraseña actual ingresada no es correcta.');
    }
    const limpia = sanitizarTextoSeguro(nuevaPassword);
    if (limpia.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }
    actuales[idx] = {
      ...actuales[idx],
      password: hashPasswordSalted(limpia),
      passwordCambiada: true
    };
    await this.saveSecretarias(actuales);
    return actuales[idx];
  },

  async resetearPasswordSecretaria(id: string): Promise<CuentaSecretaria> {
    const actuales = await this.getSecretarias();
    const idx = actuales.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Cuenta de Secretaría no encontrada.');
    actuales[idx] = {
      ...actuales[idx],
      password: hashPasswordSalted(SECRETARIAS_DEFAULT_PWD),
      passwordCambiada: false
    };
    await this.saveSecretarias(actuales);
    return actuales[idx];
  },

  async actualizarPerfilSecretaria(
    correoActual: string,
    datos: { nombre: string; correo: string; cargo: string }
  ): Promise<CuentaSecretaria> {
    const actuales = await this.getSecretarias();
    const viejo = correoActual.trim().toLowerCase();
    const nuevoCorreo = sanitizarTextoSeguro(datos.correo).toLowerCase();
    const nuevoNombre = sanitizarTextoSeguro(datos.nombre);
    const nuevoCargo = sanitizarTextoSeguro(datos.cargo || 'Secretaría de Escuela — Ing. Industrial');

    if (!nuevoCorreo.endsWith('@unitru.edu.pe')) {
      throw new Error('El correo de acceso de Secretaría debe terminar en @unitru.edu.pe.');
    }
    if (nuevoNombre.length < 3) {
      throw new Error('Ingrese un nombre válido (mínimo 3 caracteres).');
    }

    const idx = actuales.findIndex((s) => s.correo.toLowerCase() === viejo);
    if (
      nuevoCorreo !== viejo &&
      actuales.some((s, i) => i !== idx && s.correo.toLowerCase() === nuevoCorreo)
    ) {
      throw new Error(`El correo ${nuevoCorreo} ya está registrado en otra cuenta de Secretaría.`);
    }

    if (idx !== -1) {
      actuales[idx] = {
        ...actuales[idx],
        correo: nuevoCorreo,
        nombre: nuevoNombre,
        cargo: nuevoCargo
      };
      await this.saveSecretarias(actuales);
      return actuales[idx];
    }

    const creada: CuentaSecretaria = {
      id: `sec-${Date.now()}`,
      correo: nuevoCorreo,
      nombre: nuevoNombre,
      cargo: nuevoCargo,
      fechaRegistro: new Date().toISOString().split('T')[0],
      activo: true,
      password: this.getSecretariaPasswordHash(),
      passwordCambiada: true
    };
    await this.saveSecretarias([creada, ...actuales]);
    return creada;
  },

  async configurarRecuperacionSecretaria(
    correoActual: string,
    pregunta: string,
    respuestaSecreta: string
  ): Promise<CuentaSecretaria> {
    const actuales = await this.getSecretarias();
    const normalizado = correoActual.trim().toLowerCase();
    const preguntaLimpia = sanitizarTextoSeguro(pregunta);
    const respuestaLimpia = sanitizarTextoSeguro(respuestaSecreta).toLowerCase();

    if (preguntaLimpia.length < 5) {
      throw new Error('Escriba una pregunta o referencia de recuperación clara (mínimo 5 caracteres).');
    }
    if (respuestaLimpia.length < 3) {
      throw new Error('La palabra o código de recuperación debe tener al menos 3 caracteres.');
    }

    const idx = actuales.findIndex((s) => s.correo.toLowerCase() === normalizado);
    const hashRespuesta = hashPasswordSalted(respuestaLimpia);

    if (idx !== -1) {
      actuales[idx] = {
        ...actuales[idx],
        preguntaRecuperacion: preguntaLimpia,
        respuestaRecuperacionHash: hashRespuesta
      };
      await this.saveSecretarias(actuales);
      return actuales[idx];
    }

    const creada: CuentaSecretaria = {
      id: `sec-${Date.now()}`,
      correo: normalizado,
      nombre: 'Secretaría Académica',
      cargo: 'Secretaría de Escuela — Ing. Industrial',
      fechaRegistro: new Date().toISOString().split('T')[0],
      activo: true,
      password: this.getSecretariaPasswordHash(),
      passwordCambiada: true,
      preguntaRecuperacion: preguntaLimpia,
      respuestaRecuperacionHash: hashRespuesta
    };
    await this.saveSecretarias([creada, ...actuales]);
    return creada;
  },

  getSecretariaPasswordHash(): string {
    const stored = storageService.get<string>(SECRETARIA_PWD_KEY, '');
    if (!stored) {
      const defHash = hashPasswordSalted(SECRETARIAS_DEFAULT_PWD);
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
    if (correos.some((c) => c.codigoMatricula.trim().toLowerCase() === codLimpio.toLowerCase())) {
      throw new Error(`El código de matrícula ${codLimpio} ya pertenece a otro graduando en el padrón.`);
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
    const codigosExistentesSet = new Set(correosActuales.map((c) => c.codigoMatricula.trim().toLowerCase()));

    const regexEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const lineas = contenido.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let agregados = 0;
    let omitidos = 0;
    const nuevos: CorreoAutorizado[] = [];
    const now = new Date().toISOString().split('T')[0];

    const generarCodigoUnico = (): string => {
      let intento = `1021${Math.floor(100000 + Math.random() * 900000)}`;
      while (codigosExistentesSet.has(intento.toLowerCase())) {
        intento = `1021${Math.floor(100000 + Math.random() * 900000)}`;
      }
      codigosExistentesSet.add(intento.toLowerCase());
      return intento;
    };

    for (const linea of lineas) {
      // Soportar filas estructuradas (CSV / Excel / TSV): correo, nombre, matricula, promocion
      const columnas = linea.split(/[,;\t|]+/).map((col) => col.replace(/^"|"$/g, '').trim()).filter(Boolean);
      const colEmailIdx = columnas.findIndex((col) => regexEmail.test(col));
      if (colEmailIdx === -1) continue;

      const matchEmail = columnas[colEmailIdx].match(regexEmail);
      if (!matchEmail) continue;
      const emailLimpio = matchEmail[0].toLowerCase().trim();

      if (correosExistentesSet.has(emailLimpio)) {
        omitidos++;
        continue;
      }
      correosExistentesSet.add(emailLimpio);

      // Extraer columnas opcionales de matrícula, nombre y promoción
      const otrasCols = columnas.filter((_, idx) => idx !== colEmailIdx);
      const colMatricula = otrasCols.find((col) => /^\d{6,12}$/.test(col));
      const colPromocion = otrasCols.find((col) => /^20\d{2}(-[IV12]+)?$/i.test(col));
      const colNombre = otrasCols.find((col) => col !== colMatricula && col !== colPromocion && col.length >= 3);

      const userPart = emailLimpio.split('@')[0];
      const nombrePorDefecto = userPart
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

      let codFinal = colMatricula ? sanitizarTextoSeguro(colMatricula) : '';
      if (!codFinal || codigosExistentesSet.has(codFinal.toLowerCase())) {
        codFinal = generarCodigoUnico();
      } else {
        codigosExistentesSet.add(codFinal.toLowerCase());
      }

      nuevos.push({
        id: `cor-${Date.now()}-${agregados}-${Math.random().toString(36).substring(2, 6)}`,
        correo: emailLimpio,
        nombreGraduando: colNombre ? sanitizarTextoSeguro(colNombre) : `Graduando (${nombrePorDefecto})`,
        codigoMatricula: codFinal,
        promocion: colPromocion ? sanitizarTextoSeguro(colPromocion) : '2026-I',
        fechaHabilitacion: now,
        activo: true,
        password: hashPasswordSalted(codFinal),
        passwordCambiada: false
      });
      agregados++;
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
