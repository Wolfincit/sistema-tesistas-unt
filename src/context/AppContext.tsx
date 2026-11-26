import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserProfile,
  UserRole,
  ReservaAuditorio,
  BloqueoFecha,
  DocumentoExpediente,
  TipoDocumentoId,
  TimeSlot,
  FormatoInstitucional,
  ConsultaTesista,
  CorreoAutorizado,
  CuentaSecretaria,
  ComunicadoGeneral,
  FaqItem,
  DriveStatusInfo
} from '../types';
import { MOCK_USERS } from '../data/mockUsers';
import { TIME_SLOTS } from '../data/mockAuditorio';
import { auditorioService } from '../services/auditorioService';
import { documentosService } from '../services/documentosService';
import { formatosService } from '../services/formatosService';
import { consultasService } from '../services/consultasService';
import { accesosService } from '../services/accesosService';
import { comunicadosService } from '../services/comunicadosService';
import { faqService } from '../services/faqService';
import { storageService } from '../services/storageService';
import { driveApiService } from '../services/driveApiService';
import confetti from 'canvas-confetti';

export interface ToastMessage {
  id: string;
  tipo: 'success' | 'error' | 'info' | 'warning';
  titulo: string;
  mensaje: string;
}

interface AppContextType {
  usuario: UserProfile | null;
  rolActual: UserRole;
  cambiarRolDemo: () => void;
  iniciarSesion: (email: string, rolElegido?: UserRole, password?: string) => boolean;
  cerrarSesion: () => void;
  cambiarMiPassword: (passwordActual: string, nuevaPassword: string) => Promise<boolean>;
  resetearPasswordTesista: (id: string) => Promise<void>;

  // Auditorio
  reservas: ReservaAuditorio[];
  bloqueos: BloqueoFecha[];
  fechasHabilitadas: string[];
  slotsPorFecha: Record<string, string[]>;
  defaultSlots: string[];
  getSlotsFecha: (fecha: string) => string[];
  actualizarSlotsFecha: (fecha: string, nuevosSlots: string[]) => Promise<void>;
  restablecerSlotsFecha: (fecha: string) => Promise<void>;
  actualizarSlotsDefault: (nuevosSlots: string[]) => Promise<void>;
  crearPreReserva: (datos: {
    fecha: string;
    horario: TimeSlot;
    codigoMatricula: string;
    tituloTesis: string;
    asesor: string;
  }) => Promise<void>;
  editarReserva: (id: string, datos: { tituloTesis: string; asesor: string }) => Promise<void>;
  cancelarReservaPorTesista: (id: string) => Promise<void>;
  aprobarReserva: (id: string) => Promise<void>;
  rechazarReserva: (id: string, motivo?: string) => Promise<void>;
  cambiarEstadoReserva: (id: string, nuevoEstado: 'confirmada' | 'pre-reserva' | 'rechazada', motivo?: string) => Promise<void>;
  liberarReserva: (id: string) => Promise<void>;
  toggleBloqueoFecha: (fecha: string, motivo?: string) => Promise<void>;
  toggleHabilitarFecha: (fecha: string) => Promise<void>;
  habilitarTodosMes: (year: number, month: number) => Promise<void>;
  inhabilitarTodosMes: (year: number, month: number) => Promise<void>;

  // Documentos
  documentos: DocumentoExpediente[];
  subirDocumento: (tipoId: TipoDocumentoId, archivo: File | { name: string; size: string }) => Promise<void>;
  revisarDocumento: (id: string, estado: 'Aprobado' | 'Observado', observacion?: string) => Promise<void>;
  eliminarDocumento: (id: string) => Promise<void>;
  eliminarExpedienteTesistaCompleto: (params: {
    tesistaId: string;
    tesistaNombre: string;
    tesistaCodigo: string;
  }) => Promise<void>;
  editarTituloDocumento: (id: string, nuevoNombre: string) => Promise<void>;

  // Formatos Oficiales (Subidos por Secretaría, descargados por Tesistas)
  formatos: FormatoInstitucional[];
  subirFormato: (datos: {
    nombre: string;
    descripcion: string;
    formato: 'PDF' | 'DOCX' | 'XLSX';
    archivoNombre: string;
    peso: string;
    tipo: string;
  }) => Promise<void>;
  eliminarFormato: (id: string) => Promise<void>;

  // Consultas y Preguntas en Tiempo Real (Texto y Audio)
  consultas: ConsultaTesista[];
  crearConsulta: (datos: { asunto: string; mensaje: string }) => Promise<void>;
  responderConsulta: (params: {
    id: string;
    respuestaTexto?: string;
    respuestaAudioDuracion?: string;
    respuestaAudioUrl?: string;
    audioBlob?: Blob | null;
  }) => Promise<void>;
  evaluarResolucionConsulta: (id: string, conforme: boolean, repreguntaTexto?: string) => Promise<void>;
  eliminarConsulta: (id: string) => Promise<void>;

  // Control de Accesos y Padrón de Egresados + Múltiples Secretarias Independientes
  correosAutorizados: CorreoAutorizado[];
  cuentasSecretaria: CuentaSecretaria[];
  agregarCorreoAutorizado: (datos: {
    correo: string;
    nombreGraduando: string;
    codigoMatricula: string;
    promocion?: string;
  }) => Promise<void>;
  editarCorreoAutorizado: (id: string, datos: Partial<CorreoAutorizado>) => Promise<void>;
  toggleActivoCorreo: (id: string) => Promise<void>;
  eliminarCorreoAutorizado: (id: string) => Promise<void>;
  eliminarCorreosMultiple: (ids: string[]) => Promise<void>;
  vaciarPadron: () => Promise<void>;
  importarCorreosMasivo: (textoOArchivo: string) => Promise<{ agregados: number; omitidos: number }>;
  restablecerPadron: () => Promise<void>;
  agregarSecretaria: (datos: {
    correo: string;
    nombre: string;
    cargo: string;
    passwordInicial?: string;
  }) => Promise<void>;
  toggleActivoSecretaria: (id: string) => Promise<void>;
  eliminarSecretaria: (id: string) => Promise<void>;
  resetearPasswordSecretaria: (id: string) => Promise<void>;

  // Comunicados Generales con Nota de Voz
  comunicados: ComunicadoGeneral[];
  emitirComunicado: (datos: {
    titulo: string;
    mensaje: string;
    audioUrl?: string;
    audioDuracion?: string;
    audioBlob?: Blob | null;
  }) => Promise<void>;
  marcarLeidoComunicado: (id: string) => Promise<void>;
  eliminarComunicado: (id: string) => Promise<void>;

  // Google Drive como BD y Almacenamiento
  driveStatus: DriveStatusInfo | null;
  refrescarDriveStatus: () => Promise<DriveStatusInfo | null>;

  // Preguntas Frecuentes (Alimentadas y editables por Secretaría)
  faqs: FaqItem[];
  agregarFaq: (datos: { pregunta: string; respuesta: string; categoria?: string }) => Promise<void>;
  editarFaq: (id: string, datos: { pregunta: string; respuesta: string; categoria?: string }) => Promise<void>;
  eliminarFaq: (id: string) => Promise<void>;

  // Notificaciones
  toasts: ToastMessage[];
  agregarToast: (tipo: 'success' | 'error' | 'info' | 'warning', titulo: string, mensaje: string) => void;
  removerToast: (id: string) => void;

  // Estado de carga
  cargando: boolean;
  refrescarTodo: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const USER_SESSION_KEY = 'unt_industrial_user_session_v2';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Asegurar estado limpio de producción si el navegador conserva datos de pruebas anteriores
  storageService.ensureCleanProductionSchema();

  // Por defecto inicia en Modo Público Abierto (solo la Secretaria tiene inicio de sesión exclusivo)
  const [usuario, setUsuario] = useState<UserProfile | null>(() => {
    const saved = storageService.get<UserProfile | null>(USER_SESSION_KEY, null);
    if (saved && saved.rol !== 'secretaria') {
      storageService.remove(USER_SESSION_KEY);
      return null;
    }
    return saved;
  });
  const [reservas, setReservas] = useState<ReservaAuditorio[]>([]);
  const [bloqueos, setBloqueos] = useState<BloqueoFecha[]>([]);
  const [fechasHabilitadas, setFechasHabilitadas] = useState<string[]>([]);
  const [slotsPorFecha, setSlotsPorFecha] = useState<Record<string, string[]>>({});
  const [defaultSlots, setDefaultSlots] = useState<string[]>([...TIME_SLOTS]);
  const [documentos, setDocumentos] = useState<DocumentoExpediente[]>([]);
  const [formatos, setFormatos] = useState<FormatoInstitucional[]>([]);
  const [consultas, setConsultas] = useState<ConsultaTesista[]>([]);
  const [correosAutorizados, setCorreosAutorizados] = useState<CorreoAutorizado[]>([]);
  const [cuentasSecretaria, setCuentasSecretaria] = useState<CuentaSecretaria[]>([]);
  const [ultimoTesistaActivo, setUltimoTesistaActivo] = useState<UserProfile | null>(null);
  const [ultimaSecretariaActiva, setUltimaSecretariaActiva] = useState<UserProfile | null>(null);
  const [comunicados, setComunicados] = useState<ComunicadoGeneral[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [driveStatus, setDriveStatus] = useState<DriveStatusInfo | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const rolActual: UserRole = usuario ? usuario.rol : 'tesista';

  const agregarToast = (tipo: 'success' | 'error' | 'info' | 'warning', titulo: string, mensaje: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const nuevoToast: ToastMessage = { id, tipo, titulo, mensaje };
    setToasts((prev) => [...prev.slice(-1), nuevoToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removerToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refrescarDriveStatus = async (): Promise<DriveStatusInfo | null> => {
    const status = await driveApiService.getStatus();
    setDriveStatus(status);
    return status;
  };

  const cargarDatos = async (forceDrivePull = false) => {
    try {
      // 1. Intentar sincronizar primero desde la BD compartida del servidor / Google Drive
      const [remoteDb, statusDrive] = await Promise.all([
        driveApiService.getDbState(forceDrivePull),
        driveApiService.getStatus()
      ]);
      if (statusDrive) setDriveStatus(statusDrive);

      if (remoteDb?.collections) {
        const c = remoteDb.collections;
        if (Array.isArray(c.reservas)) storageService.set('unt_industrial_reservas', c.reservas);
        if (Array.isArray(c.bloqueos)) storageService.set('unt_industrial_bloqueos', c.bloqueos);
        if (Array.isArray(c.fechasHabilitadas)) storageService.set('unt_industrial_fechas_habilitadas', c.fechasHabilitadas);
        if (c.slotsPorFecha && typeof c.slotsPorFecha === 'object') storageService.set('unt_industrial_slots_by_date', c.slotsPorFecha);
        if (Array.isArray(c.defaultSlots)) storageService.set('unt_industrial_slots_default', c.defaultSlots);
        if (Array.isArray(c.documentos)) storageService.set('unt_industrial_documentos', c.documentos);
        if (Array.isArray(c.formatos)) storageService.set('unt_industrial_formatos_oficiales', c.formatos);
        if (Array.isArray(c.consultas)) storageService.set('unt_industrial_consultas', c.consultas);
        if (Array.isArray(c.correosAutorizados)) storageService.set('unt_industrial_correos_autorizados', c.correosAutorizados);
        if (Array.isArray(c.cuentasSecretaria)) storageService.set('unt_industrial_cuentas_secretaria_v1', c.cuentasSecretaria);
        if (Array.isArray(c.comunicados)) storageService.set('unt_industrial_comunicados_generales', c.comunicados);
        if (Array.isArray(c.faqs)) storageService.set('unt_industrial_faqs_v3', c.faqs);
        if (Array.isArray(c.seguimientoLogistico)) storageService.set('unt_industrial_seguimiento_logistico_v3', c.seguimientoLogistico);
        if (Array.isArray(c.directorioJurado)) storageService.set('unt_industrial_directorio_jurado_v3', c.directorioJurado);
        if (Array.isArray(c.sustentacionesJueves)) storageService.set('unt_industrial_sustentaciones_jueves_v2', c.sustentacionesJueves);
        if (Array.isArray(c.historialDespachos)) storageService.set('unt_industrial_historial_despachos_v1', c.historialDespachos);
        if (Array.isArray(c.instruccionesSustentacion)) storageService.set('unt_industrial_instrucciones_pasos_v3', c.instruccionesSustentacion);
        if (Array.isArray(c.dudasSinResponder)) storageService.set('unt_industrial_dudas_pendientes_v1', c.dudasSinResponder);
        if (c.configColacion && typeof c.configColacion === 'object') storageService.set('unt_industrial_config_colacion_v1', c.configColacion);
      }

      const [res, blq, hab, docs, slotsMap, defSlots, fmts, cons, corrs, secs, coms, faqsList] = await Promise.all([
        auditorioService.getReservas(),
        auditorioService.getBloqueos(),
        auditorioService.getFechasHabilitadas(),
        documentosService.getAll(),
        auditorioService.getSlotsByDate(),
        auditorioService.getDefaultSlots(),
        formatosService.getFormatos(),
        consultasService.getConsultas(),
        accesosService.getCorreos(),
        accesosService.getSecretarias(),
        comunicadosService.getComunicados(),
        faqService.getFaqs()
      ]);
      setReservas(res);
      setBloqueos(blq);
      setFechasHabilitadas(hab);
      setDocumentos(docs);
      setSlotsPorFecha(slotsMap || {});
      setDefaultSlots(defSlots && defSlots.length > 0 ? defSlots : [...TIME_SLOTS]);
      setFormatos(fmts);
      setConsultas(cons);
      setCorreosAutorizados(corrs);
      setCuentasSecretaria(secs);
      setComunicados(coms);
      setFaqs(faqsList);
    } catch (error) {
      console.error('Error cargando datos del sistema:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos(false);
  }, []);

  // Sincronización multi-PC automática cada 20s mientras haya una sesión privada activa
  useEffect(() => {
    if (!usuario) return;
    const timer = setInterval(() => {
      cargarDatos(false);
    }, 20000);
    return () => clearInterval(timer);
  }, [usuario?.id]);

  const cambiarRolDemo = () => {
    const nuevoRol: UserRole = rolActual === 'tesista' ? 'secretaria' : 'tesista';

    if (usuario?.rol === 'tesista') {
      setUltimoTesistaActivo(usuario);
    } else if (usuario?.rol === 'secretaria') {
      setUltimaSecretariaActiva(usuario);
    }

    let nuevoUsuario: UserProfile;
    if (nuevoRol === 'tesista') {
      if (ultimoTesistaActivo) {
        nuevoUsuario = ultimoTesistaActivo;
      } else {
        const primerTesista = correosAutorizados.find((c) => c.activo) || correosAutorizados[0];
        nuevoUsuario = primerTesista
          ? {
              id: `usr-${primerTesista.codigoMatricula}`,
              email: primerTesista.correo,
              nombre: primerTesista.nombreGraduando,
              rol: 'tesista',
              codigoMatricula: primerTesista.codigoMatricula,
              departamento: 'Escuela Profesional de Ingeniería Industrial',
              facultad: 'Facultad de Ingeniería (UNT)'
            }
          : MOCK_USERS.tesista;
      }
    } else {
      if (ultimaSecretariaActiva) {
        nuevoUsuario = ultimaSecretariaActiva;
      } else {
        const primeraSec = cuentasSecretaria.find((s) => s.activo) || cuentasSecretaria[0];
        nuevoUsuario = primeraSec
          ? {
              id: primeraSec.id,
              email: primeraSec.correo,
              nombre: primeraSec.nombre,
              rol: 'secretaria',
              codigoMatricula: 'SEC-UNT',
              departamento: primeraSec.cargo,
              facultad: 'Facultad de Ingeniería (UNT)'
            }
          : MOCK_USERS.secretaria;
      }
    }

    setUsuario(nuevoUsuario);
    storageService.set(USER_SESSION_KEY, nuevoUsuario);
    agregarToast(
      'info',
      'Modo Evaluación (Rotación Temporal)',
      `Vista activa: ${nuevoRol === 'tesista' ? `Tesista (${nuevoUsuario.nombre})` : `${nuevoUsuario.nombre} (${nuevoUsuario.email})`}`
    );
  };

  const iniciarSesion = (email: string, rolElegido?: UserRole, password?: string): boolean => {
    const emailNormalizado = email.toLowerCase().trim();
    const pwdLimpia = (password || '').trim();
    if (!emailNormalizado.includes('@') || /[<>"';]/.test(emailNormalizado)) {
      agregarToast('error', 'Correo inválido', 'Ingrese una dirección de correo válida.');
      return false;
    }

    // Detectar automáticamente si el correo pertenece al padrón independiente de Secretarias
    const registroSecretaria = cuentasSecretaria.find(
      (s) => s.correo.toLowerCase() === emailNormalizado
    );
    let roleToAssign: UserRole = rolElegido || 'tesista';
    if (registroSecretaria && rolElegido !== 'tesista') {
      roleToAssign = 'secretaria';
    } else if (!registroSecretaria && rolElegido === 'secretaria') {
      roleToAssign = 'secretaria';
    }

    // CONTROL DE ACCESO ESTRICTO CON CONTRASEÑA INDEPENDIENTE PARA TESISTAS
    if (roleToAssign === 'tesista') {
      const registroCorreo = correosAutorizados.find(
        (c) => c.correo.toLowerCase() === emailNormalizado
      );

      if (!registroCorreo) {
        agregarToast(
          'error',
          'Credenciales Inválidas',
          'El correo o la contraseña no coinciden con ningún tesista habilitado por Secretaría Académica.'
        );
        return false;
      }

      if (!registroCorreo.activo) {
        agregarToast(
          'warning',
          'Acceso Suspendido',
          'Su acceso al módulo de titulación se encuentra temporalmente suspendido por Secretaría Académica.'
        );
        return false;
      }

      if (!accesosService.verificarPasswordRegistro(registroCorreo, pwdLimpia)) {
        agregarToast(
          'error',
          'Contraseña Incorrecta',
          'La contraseña ingresada es incorrecta. Recuerde que su contraseña inicial es su Número de Matrícula.'
        );
        return false;
      }

      const loggedUser: UserProfile = {
        id: `usr-${registroCorreo.codigoMatricula}`,
        email: emailNormalizado,
        nombre: registroCorreo.nombreGraduando,
        rol: 'tesista',
        codigoMatricula: registroCorreo.codigoMatricula,
        departamento: 'Escuela Profesional de Ingeniería Industrial',
        facultad: 'Facultad de Ingeniería (UNT)'
      };

      setUsuario(loggedUser);
      setUltimoTesistaActivo(loggedUser);
      storageService.set(USER_SESSION_KEY, loggedUser);
      agregarToast('success', 'Acceso de Tesista Acreditado', `Bienvenido(a) al Módulo de Titulación, ${loggedUser.nombre}`);
      return true;
    }

    // CONTROL DE ACCESO EXCLUSIVO PARA SECRETARÍA (@unitru.edu.pe)
    if (!emailNormalizado.endsWith('@unitru.edu.pe')) {
      agregarToast('error', 'Acceso denegado', 'Secretaría Académica requiere correo institucional @unitru.edu.pe');
      return false;
    }

    // Permitir tanto cuentas registradas en cuentasSecretaria como cualquier correo @unitru.edu.pe de la Secretaria con la clave institucional
    if (registroSecretaria) {
      if (!registroSecretaria.activo) {
        agregarToast('warning', 'Cuenta Suspendida', 'Esta cuenta de Secretaría se encuentra suspendida temporalmente.');
        return false;
      }
      if (!accesosService.verificarPasswordSecretariaRegistro(registroSecretaria, pwdLimpia)) {
        agregarToast('error', 'Contraseña Incorrecta', 'La contraseña de Secretaría no es válida.');
        return false;
      }
    } else {
      if (!accesosService.verificarSecretariaPassword(pwdLimpia)) {
        agregarToast('error', 'Contraseña Incorrecta', 'La contraseña exclusiva de Secretaría Académica no es válida.');
        return false;
      }
    }

    const secUser: UserProfile = {
      id: registroSecretaria ? registroSecretaria.id : 'sec-unt-celia',
      email: emailNormalizado,
      nombre: registroSecretaria ? registroSecretaria.nombre : 'Srta. Celia — Secretaría Académica',
      rol: 'secretaria',
      codigoMatricula: 'SEC-UNT',
      departamento: registroSecretaria ? registroSecretaria.cargo : 'Secretaría de Escuela — Ingeniería Industrial',
      facultad: 'Facultad de Ingeniería (UNT)'
    };
    setUsuario(secUser);
    setUltimaSecretariaActiva(secUser);
    storageService.set(USER_SESSION_KEY, secUser);
    agregarToast('success', 'Panel de Secretaría Académica', `Bienvenida, ${secUser.nombre}`);
    return true;
  };

  const cambiarMiPassword = async (passwordActual: string, nuevaPassword: string): Promise<boolean> => {
    if (!usuario) return false;
    try {
      if (usuario.rol === 'secretaria') {
        const existeEnLista = cuentasSecretaria.some(
          (s) => s.correo.toLowerCase() === usuario.email.toLowerCase()
        );
        if (existeEnLista) {
          const actualizada = await accesosService.cambiarPasswordSecretariaPorCorreo(
            usuario.email,
            passwordActual,
            nuevaPassword
          );
          setCuentasSecretaria((prev) =>
            prev.map((s) => (s.id === actualizada.id ? actualizada : s))
          );
        }
        try {
          accesosService.cambiarSecretariaPassword(passwordActual, nuevaPassword);
        } catch (err) {
          if (!existeEnLista) throw err;
        }
      } else {
        const actualizado = await accesosService.cambiarPasswordTesista(
          usuario.email,
          passwordActual,
          nuevaPassword
        );
        setCorreosAutorizados((prev) =>
          prev.map((c) => (c.id === actualizado.id ? actualizado : c))
        );
      }
      agregarToast(
        'success',
        'Contraseña Actualizada',
        'Su nueva contraseña personal quedó guardada de forma segura (hash SHA-256).'
      );
      return true;
    } catch (e: any) {
      agregarToast('error', 'No se pudo cambiar la contraseña', e.message || 'Verifique los datos.');
      return false;
    }
  };

  const resetearPasswordTesista = async (id: string): Promise<void> => {
    try {
      const actualizado = await accesosService.resetearPasswordAMatricula(id);
      setCorreosAutorizados((prev) =>
        prev.map((c) => (c.id === actualizado.id ? actualizado : c))
      );
      agregarToast(
        'info',
        'Contraseña Restablecida',
        `La contraseña de ${actualizado.nombreGraduando} volvió a ser su N° de Matrícula (${actualizado.codigoMatricula}).`
      );
    } catch (e: any) {
      agregarToast('error', 'Error al restablecer contraseña', e.message);
    }
  };

  const cerrarSesion = () => {
    setUsuario(null);
    storageService.remove(USER_SESSION_KEY);
    agregarToast('info', 'Modo Público Activo', 'Saliste del área privada. El Repositorio de Tesis permanece abierto al público.');
  };

  const crearPreReserva = async (datos: {
    fecha: string;
    horario: TimeSlot;
    codigoMatricula: string;
    tituloTesis: string;
    asesor: string;
  }) => {
    if (!usuario) return;
    try {
      const nueva = await auditorioService.crearPreReserva({
        ...datos,
        tesistaId: usuario.id,
        tesistaNombre: usuario.nombre
      });
      setReservas((prev) => [nueva, ...prev]);
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (_) { }
      agregarToast(
        'success',
        'Pre-reserva Registrada',
        `Su solicitud para el ${datos.fecha} (${datos.horario}) ha quedado en estado pendiente de aprobación.`
      );
    } catch (e: any) {
      agregarToast('error', 'Conflicto de Horario', e.message || 'No se pudo completar la reserva.');
    }
  };

  // REGLA ESTRICTA: Solo se puede confirmar si el tesista tiene sus 5 requisitos 100% conformes
  const aprobarReserva = async (id: string) => {
    try {
      const reservaObj = reservas.find((r) => r.id === id);
      if (reservaObj) {
        const docsTesista = documentos.filter(
          (d) => d.tesistaId === reservaObj.tesistaId || d.tesistaCodigo === reservaObj.codigoMatricula
        );
        const reqsAprobados = docsTesista.filter((d) => d.estado === 'Aprobado').length;
        if (reqsAprobados < 5) {
          agregarToast(
            'error',
            'Expediente Incompleto',
            `No es posible confirmar la sustentación de ${reservaObj.tesistaNombre}. Cuenta con ${reqsAprobados}/5 requisitos aprobados. Debe tener los 5 conformes.`
          );
          return;
        }
      }

      const res = await auditorioService.cambiarEstadoReserva(id, 'confirmada');
      setReservas((prev) => prev.map((r) => (r.id === id ? res : r)));
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.5 }
        });
      } catch (_) { }
      agregarToast('success', 'Sustentación Confirmada', `La fecha y hora del auditorio fue confirmada satisfactoriamente.`);
    } catch (e: any) {
      agregarToast('error', 'Error al procesar', e.message);
    }
  };

  const rechazarReserva = async (id: string, motivo?: string) => {
    try {
      const res = await auditorioService.cambiarEstadoReserva(id, 'rechazada', motivo);
      setReservas((prev) => prev.map((r) => (r.id === id ? res : r)));
      agregarToast('warning', 'Reserva Cancelada', `El horario ha sido liberado para otros postulantes.`);
    } catch (e: any) {
      agregarToast('error', 'Error', e.message);
    }
  };

  const cambiarEstadoReserva = async (
    id: string,
    nuevoEstado: 'confirmada' | 'pre-reserva' | 'rechazada',
    motivo?: string
  ) => {
    try {
      if (nuevoEstado === 'confirmada') {
        const reservaObj = reservas.find((r) => r.id === id);
        if (reservaObj) {
          const docsTesista = documentos.filter(
            (d) => d.tesistaId === reservaObj.tesistaId || d.tesistaCodigo === reservaObj.codigoMatricula
          );
          const reqsAprobados = docsTesista.filter((d) => d.estado === 'Aprobado').length;
          if (reqsAprobados < 5) {
            agregarToast(
              'error',
              'Expediente Incompleto',
              `No se puede confirmar la sustentación: el graduando tiene ${reqsAprobados}/5 requisitos aprobados. Debe regularizar sus 5 documentos.`
            );
            return;
          }
        }
      }

      const res = await auditorioService.cambiarEstadoReserva(id, nuevoEstado, motivo);
      setReservas((prev) => prev.map((r) => (r.id === id ? res : r)));
      const nombresEstados = {
        confirmada: 'Sustentación Confirmada',
        'pre-reserva': 'Pre-reserva Pendiente',
        rechazada: 'Horario Liberado'
      };
      agregarToast('success', 'Estado Modificado', `El horario quedó en estado: ${nombresEstados[nuevoEstado]}.`);
    } catch (e: any) {
      agregarToast('error', 'Error al modificar estado', e.message);
    }
  };

  const liberarReserva = async (id: string) => {
    try {
      await auditorioService.liberarReserva(id);
      setReservas((prev) => prev.filter((r) => r.id !== id));
      agregarToast('info', 'Horario Liberado', 'Se canceló la reserva y el bloque vuelve a estar disponible.');
    } catch (e: any) {
      agregarToast('error', 'Error al liberar horario', e.message);
    }
  };

  const editarReserva = async (id: string, datos: { tituloTesis: string; asesor: string }) => {
    try {
      const res = await auditorioService.editarReserva(id, datos);
      setReservas((prev) => prev.map((r) => (r.id === id ? res : r)));
      agregarToast('success', 'Reserva Actualizada', 'Los datos del proyecto y docente asesor fueron corregidos.');
    } catch (e: any) {
      agregarToast('error', 'Error al editar reserva', e.message);
    }
  };

  const cancelarReservaPorTesista = async (id: string) => {
    try {
      await auditorioService.liberarReserva(id);
      setReservas((prev) => prev.filter((r) => r.id !== id));
      agregarToast('info', 'Reserva Cancelada', 'Ha cancelado su reserva. El horario ha quedado disponible en el auditorio.');
    } catch (e: any) {
      agregarToast('error', 'Error al cancelar reserva', e.message);
    }
  };

  const toggleBloqueoFecha = async (fecha: string, motivo?: string) => {
    try {
      const resultado = await auditorioService.toggleBloqueoFecha(
        fecha,
        motivo || 'Feriado / Evento Institucional',
        usuario?.nombre || 'Secretaría'
      );
      const updatedBloqueos = await auditorioService.getBloqueos();
      setBloqueos(updatedBloqueos);

      if (resultado.bloqueado) {
        agregarToast('info', 'Fecha Bloqueada', `El día ${fecha} quedó inhabilitado para sustentaciones.`);
      } else {
        agregarToast('success', 'Fecha Habilitada', `El día ${fecha} fue liberado para reservas.`);
      }
    } catch (e: any) {
      agregarToast('error', 'Error', e.message);
    }
  };

  const toggleHabilitarFecha = async (fecha: string) => {
    try {
      await auditorioService.toggleHabilitarFecha(fecha);
      const nuevas = await auditorioService.getFechasHabilitadas();
      setFechasHabilitadas(nuevas);
    } catch (e: any) {
      agregarToast('error', 'Error al cambiar estado', e.message);
    }
  };

  const getSlotsFecha = (fecha: string): string[] => {
    if (slotsPorFecha[fecha] && slotsPorFecha[fecha].length > 0) {
      return slotsPorFecha[fecha];
    }
    return defaultSlots && defaultSlots.length > 0 ? defaultSlots : [...TIME_SLOTS];
  };

  const actualizarSlotsFecha = async (fecha: string, nuevosSlots: string[]) => {
    try {
      const mapaActualizado = await auditorioService.saveSlotsForFecha(fecha, nuevosSlots);
      setSlotsPorFecha({ ...mapaActualizado });
      agregarToast('success', 'Horario Modificado', `Se actualizaron los bloques de atención para el día ${fecha}.`);
    } catch (e: any) {
      agregarToast('error', 'Error al modificar horarios', e.message);
    }
  };

  const restablecerSlotsFecha = async (fecha: string) => {
    try {
      const mapaActualizado = await auditorioService.resetSlotsForFecha(fecha);
      setSlotsPorFecha({ ...mapaActualizado });
      agregarToast('info', 'Horario Estándar', `Se restablecieron los 4 bloques base para el día ${fecha}.`);
    } catch (e: any) {
      agregarToast('error', 'Error al restablecer horarios', e.message);
    }
  };

  const actualizarSlotsDefault = async (nuevosSlots: string[]) => {
    try {
      const slotsGuardados = await auditorioService.saveDefaultSlots(nuevosSlots);
      setDefaultSlots(slotsGuardados);
      agregarToast('success', 'Horario Predeterminado', 'Se actualizaron los bloques horarios generales del sistema.');
    } catch (e: any) {
      agregarToast('error', 'Error al guardar horarios generales', e.message);
    }
  };

  const habilitarTodosMes = async (year: number, month: number) => {
    try {
      const nuevas = await auditorioService.habilitarTodosMes(year, month);
      setFechasHabilitadas(nuevas);
      agregarToast('success', 'Días Habilitados', 'Todos los días laborables del mes quedaron habilitados.');
    } catch (e: any) {
      agregarToast('error', 'Error al habilitar mes', e.message);
    }
  };

  const inhabilitarTodosMes = async (year: number, month: number) => {
    try {
      const nuevas = await auditorioService.inhabilitarTodosMes(year, month);
      setFechasHabilitadas(nuevas);
      agregarToast('info', 'Días Inhabilitados', 'Todos los días del mes quedaron inhabilitados.');
    } catch (e: any) {
      agregarToast('error', 'Error al inhabilitar mes', e.message);
    }
  };

  const subirDocumento = async (tipoId: TipoDocumentoId, archivo: File | { name: string; size: string }) => {
    if (!usuario) return;
    try {
      const codigoTesista = usuario.codigoMatricula || '1021400219';
      const existente = documentos.find(
        (d) => d.tesistaId === usuario.id && d.tipoId === tipoId
      );

      let tamanoFormateado =
        'size' in archivo && typeof archivo.size === 'number'
          ? `${(archivo.size / (1024 * 1024)).toFixed(2)} MB`
          : 'size' in archivo && typeof archivo.size === 'string'
          ? archivo.size
          : '1.5 MB';

      let archivoFileId: string | undefined;
      let archivoUrl: string | undefined;
      let driveFileUrl: string | undefined;
      let driveFolderId: string | undefined;
      let driveFolderUrl: string | undefined;
      let almacenamiento: 'google-drive' | 'local' | undefined;

      // Subida real de bytes del PDF al servidor / Google Drive (crea carpeta del alumno automáticamente)
      if (archivo instanceof File) {
        const uploaded = await driveApiService.uploadDocumento({
          file: archivo,
          tesistaId: usuario.id,
          tesistaNombre: usuario.nombre,
          tesistaCodigo: codigoTesista,
          tipoId,
          anteriorFileId: existente?.archivoFileId
        });
        archivoFileId = uploaded.fileId;
        archivoUrl = uploaded.previewUrl;
        driveFileUrl = uploaded.driveFileUrl || undefined;
        driveFolderId = uploaded.driveFolderId || undefined;
        driveFolderUrl = uploaded.driveFolderUrl || undefined;
        almacenamiento = uploaded.storage;
        tamanoFormateado = uploaded.sizeLabel || tamanoFormateado;
      }

      const docActualizado = await documentosService.subirDocumento({
        tesistaId: usuario.id,
        tesistaNombre: usuario.nombre,
        tesistaCodigo: codigoTesista,
        tipoId,
        nombreArchivo: archivo.name,
        archivoTamano: tamanoFormateado,
        archivoFileId,
        archivoUrl,
        driveFileUrl,
        driveFolderId,
        driveFolderUrl,
        almacenamiento
      });

      setDocumentos((prev) => {
        const existeIdx = prev.findIndex((d) => d.id === docActualizado.id);
        if (existeIdx >= 0) {
          const clon = [...prev];
          clon[existeIdx] = docActualizado;
          return clon;
        }
        return [...prev, docActualizado];
      });

      refrescarDriveStatus();
      agregarToast(
        'success',
        almacenamiento === 'google-drive' ? 'PDF Guardado en Google Drive' : 'Documento Registrado',
        almacenamiento === 'google-drive'
          ? `"${archivo.name}" se guardó automáticamente en su carpeta de Google Drive. Estado: En revisión.`
          : `Se cargó "${archivo.name}". Su estado pasó a: En revisión.`
      );
    } catch (e: any) {
      agregarToast('error', 'Error al cargar', e.message);
    }
  };

  // REGLA ESTRICTA: Si se observa un documento, se libera automáticamente la reserva del auditorio
  const revisarDocumento = async (id: string, estado: 'Aprobado' | 'Observado', observacion?: string) => {
    try {
      const revisor = usuario?.nombre || 'Secretaría Académica';
      const docRevisado = await documentosService.revisarDocumento({
        id,
        estado,
        observacion,
        revisadoPor: revisor
      });

      setDocumentos((prev) => prev.map((d) => (d.id === id ? docRevisado : d)));

      if (estado === 'Aprobado') {
        agregarToast('success', 'Documento Aprobado', `Se dio conformidad al requisito.`);
      } else {
        // Al observar un requisito: liberar automáticamente cualquier reserva de este tesista para evitar cuellos de botella
        const todasReservas = await auditorioService.getReservas();
        let huboLiberacion = false;

        const reservasActualizadas = todasReservas.map((r) => {
          if (
            (r.tesistaId === docRevisado.tesistaId || r.codigoMatricula === docRevisado.tesistaCodigo) &&
            r.estado !== 'rechazada'
          ) {
            huboLiberacion = true;
            return {
              ...r,
              estado: 'rechazada' as const,
              comentarioAdmin: `Turno liberado por Secretaría: Se observó el requisito "${docRevisado.nombreDocumento}". Debe subsanar para volver a solicitar fecha.`
            };
          }
          return r;
        });

        if (huboLiberacion) {
          await auditorioService.saveReservas(reservasActualizadas);
          setReservas(reservasActualizadas);
          agregarToast(
            'warning',
            'Turno de Auditorio Liberado',
            `Al observarse "${docRevisado.nombreDocumento}", la reserva de auditorio fue liberada para evitar cuellos de botella hasta su subsanación.`
          );
        } else {
          agregarToast('warning', 'Documento Observado', `Se registró la observación para que el tesista subsane el expediente.`);
        }
      }
    } catch (e: any) {
      agregarToast('error', 'Error al revisar', e.message);
    }
  };

  const eliminarDocumento = async (id: string) => {
    try {
      const docReseteado = await documentosService.eliminarDocumento(id);
      setDocumentos((prev) => prev.map((d) => (d.id === id ? docReseteado : d)));
      refrescarDriveStatus();
      agregarToast('info', 'Documento Eliminado', `Se retiró el archivo del expediente. El requisito volvió al estado Pendiente.`);
    } catch (e: any) {
      agregarToast('error', 'Error al eliminar documento', e.message);
    }
  };

  const eliminarExpedienteTesistaCompleto = async (params: {
    tesistaId: string;
    tesistaNombre: string;
    tesistaCodigo: string;
  }) => {
    try {
      const docsTesista = documentos.filter(
        (d) => d.tesistaId === params.tesistaId || d.tesistaCodigo === params.tesistaCodigo
      );
      const driveFolderId = docsTesista.find((d) => d.driveFolderId)?.driveFolderId || '';
      const fileIds = docsTesista.map((d) => d.archivoFileId || '').filter(Boolean);

      const resDrive = await driveApiService.deleteTesistaFolder({
        tesistaId: params.tesistaId,
        tesistaNombre: params.tesistaNombre,
        tesistaCodigo: params.tesistaCodigo,
        driveFolderId,
        fileIds
      });

      const docsRestantes = await documentosService.eliminarExpedientePorTesista(params.tesistaId);
      setDocumentos(docsRestantes);

      // Liberar también sus reservas si quedaron en el calendario
      const todasReservas = await auditorioService.getReservas();
      const reservasRestantes = todasReservas.filter(
        (r) => r.tesistaId !== params.tesistaId && r.codigoMatricula !== params.tesistaCodigo
      );
      if (reservasRestantes.length !== todasReservas.length) {
        await auditorioService.saveReservas(reservasRestantes);
        setReservas(reservasRestantes);
      }

      refrescarDriveStatus();
      agregarToast(
        'success',
        'Expediente Titulado y Eliminado',
        resDrive.deletedFromDrive
          ? `Se eliminó la carpeta individual de ${params.tesistaNombre} y todos sus PDFs de Google Drive para liberar espacio.`
          : `Se eliminó el expediente completo y los archivos de ${params.tesistaNombre}.`
      );
    } catch (e: any) {
      agregarToast('error', 'Error al eliminar expediente', e.message || 'No se pudo completar la limpieza.');
    }
  };

  const editarTituloDocumento = async (id: string, nuevoNombre: string) => {
    try {
      const docActualizado = await documentosService.editarTituloDocumento(id, nuevoNombre);
      setDocumentos((prev) => prev.map((d) => (d.id === id ? docActualizado : d)));
      agregarToast('success', 'Título Actualizado', `El archivo se renombró a: "${docActualizado.nombreArchivo}".`);
    } catch (e: any) {
      agregarToast('error', 'Error al actualizar título', e.message);
    }
  };

  // Gestión de Formatos Oficiales (Subidos por Secretaría, descargados por Tesistas)
  const subirFormato = async (datos: {
    nombre: string;
    descripcion: string;
    formato: 'PDF' | 'DOCX' | 'XLSX';
    archivoNombre: string;
    peso: string;
    tipo: string;
  }) => {
    try {
      const nuevo = await formatosService.subirFormato({
        ...datos,
        subidoPor: usuario?.nombre || 'Secretaría Académica'
      });
      setFormatos((prev) => [nuevo, ...prev]);
      agregarToast('success', 'Formato Oficial Publicado', `Se publicó la plantilla "${datos.nombre}" para descarga de tesistas.`);
    } catch (e: any) {
      agregarToast('error', 'Error al subir formato', e.message);
    }
  };

  const eliminarFormato = async (id: string) => {
    try {
      await formatosService.eliminarFormato(id);
      setFormatos((prev) => prev.filter((f) => f.id !== id));
      agregarToast('info', 'Formato Retirado', 'El formato oficial fue eliminado del repositorio.');
    } catch (e: any) {
      agregarToast('error', 'Error al eliminar', e.message);
    }
  };

  // Consultas y Preguntas en Tiempo Real
  const crearConsulta = async (datos: { asunto: string; mensaje: string }) => {
    if (!usuario) return;
    try {
      const nueva = await consultasService.crearConsulta({
        tesistaId: usuario.id,
        tesistaNombre: usuario.nombre,
        tesistaCodigo: usuario.codigoMatricula || '1021400219',
        asunto: datos.asunto,
        mensaje: datos.mensaje
      });
      setConsultas((prev) => [nueva, ...prev]);
      agregarToast('success', 'Consulta Enviada', 'Su consulta fue enviada a Secretaría Académica en tiempo real.');
    } catch (e: any) {
      agregarToast('error', 'Error al enviar consulta', e.message);
    }
  };

  const responderConsulta = async (params: {
    id: string;
    respuestaTexto?: string;
    respuestaAudioDuracion?: string;
    respuestaAudioUrl?: string;
    audioBlob?: Blob | null;
  }) => {
    try {
      let audioUrlFinal = params.respuestaAudioUrl;
      let audioFileIdFinal: string | undefined;

      if (params.audioBlob) {
        const up = await driveApiService.uploadAudio(
          params.audioBlob,
          `consulta_${params.id}_${Date.now()}.webm`
        );
        audioUrlFinal = up.audioUrl;
        audioFileIdFinal = up.fileId;
      }

      const respondida = await consultasService.responderConsulta({
        id: params.id,
        respuestaTexto: params.respuestaTexto,
        respuestaAudioDuracion: params.respuestaAudioDuracion,
        respuestaAudioUrl: audioUrlFinal,
        respuestaAudioFileId: audioFileIdFinal,
        respondidoPor: usuario?.nombre || 'Secretaría Académica'
      });
      setConsultas((prev) => prev.map((c) => (c.id === params.id ? respondida : c)));
      agregarToast('success', 'Consulta Respondida', `Se envió la respuesta privada ${params.respuestaAudioDuracion ? 'con nota de voz' : ''} al tesista.`);
    } catch (e: any) {
      agregarToast('error', 'Error al responder', e.message);
    }
  };

  const evaluarResolucionConsulta = async (id: string, conforme: boolean, repreguntaTexto?: string) => {
    try {
      const resultado = await consultasService.evaluarResolucion({ id, conforme, repreguntaTexto });
      if (resultado.eliminada) {
        setConsultas((prev) => prev.filter((c) => c.id !== id));
        agregarToast(
          'success',
          'Consulta Resuelta y Eliminada',
          'Confirmaste que tu duda quedó resuelta. La consulta y sus notas de voz adjuntas fueron eliminadas automáticamente para liberar espacio.'
        );
      } else {
        const updated = resultado.consulta;
        setConsultas((prev) => prev.map((c) => (c.id === id ? updated : c)));
        if (updated.estado === 'Cerrada') {
          agregarToast('warning', 'Límite de Intentos Alcanzado', 'Se completaron los 2 intentos de aclaración para este ticket.');
        } else {
          agregarToast('info', 'Aclaración Enviada', `Su consulta fue reabierta para Secretaría (Intento ${updated.intentosReapertura} de 2).`);
        }
      }
    } catch (e: any) {
      agregarToast('error', 'Error al procesar evaluación', e.message);
    }
  };

  const eliminarConsulta = async (id: string) => {
    try {
      await consultasService.eliminarConsulta(id);
      setConsultas((prev) => prev.filter((c) => c.id !== id));
      agregarToast(
        'info',
        'Consulta Eliminada',
        'El ticket y sus notas de voz adjuntas fueron eliminados del sistema.'
      );
    } catch (e: any) {
      agregarToast('error', 'Error al eliminar', e.message);
    }
  };

  // Control de Accesos y Padrón de Egresados
  const agregarCorreoAutorizado = async (datos: {
    correo: string;
    nombreGraduando: string;
    codigoMatricula: string;
    promocion?: string;
  }) => {
    try {
      const nuevo = await accesosService.agregarCorreo(datos);
      setCorreosAutorizados((prev) => [nuevo, ...prev]);
      agregarToast('success', 'Correo Habilitado', `El graduando ${datos.nombreGraduando} fue incorporado al padrón oficial.`);
    } catch (e: any) {
      agregarToast('error', 'Error', e.message);
    }
  };

  const editarCorreoAutorizado = async (id: string, datos: Partial<CorreoAutorizado>) => {
    try {
      const updated = await accesosService.editarCorreo(id, datos);
      setCorreosAutorizados((prev) => prev.map((c) => (c.id === id ? updated : c)));
      agregarToast('success', 'Registro Actualizado', 'Los datos del graduando fueron actualizados.');
    } catch (e: any) {
      agregarToast('error', 'Error al editar', e.message);
    }
  };

  const toggleActivoCorreo = async (id: string) => {
    try {
      const updated = await accesosService.toggleActivo(id);
      setCorreosAutorizados((prev) => prev.map((c) => (c.id === id ? updated : c)));
      agregarToast('info', 'Estado Modificado', `Acceso ${updated.activo ? 'Habilitado' : 'Suspendido'}.`);
    } catch (e: any) {
      agregarToast('error', 'Error', e.message);
    }
  };

  const eliminarCorreoAutorizado = async (id: string) => {
    try {
      await accesosService.eliminarCorreo(id);
      setCorreosAutorizados((prev) => prev.filter((c) => c.id !== id));
      agregarToast('info', 'Registro Eliminado', 'El correo fue retirado del padrón de egresados.');
    } catch (e: any) {
      agregarToast('error', 'Error al eliminar', e.message);
    }
  };

  const importarCorreosMasivo = async (textoOArchivo: string) => {
    try {
      const res = await accesosService.importarDesdeTextoOArchivo(textoOArchivo);
      const actualizados = await accesosService.getCorreos();
      setCorreosAutorizados(actualizados);
      agregarToast(
        'success',
        'Importación Exitosa',
        `Se procesaron y habilitaron ${res.agregados} nuevos correos en el padrón (${res.omitidos} ya existían).`
      );
      return res;
    } catch (e: any) {
      agregarToast('error', 'Error al importar', e.message);
      return { agregados: 0, omitidos: 0 };
    }
  };

  const restablecerPadron = async () => {
    try {
      const base = await accesosService.restablecerPadron();
      setCorreosAutorizados(base);
      agregarToast('info', 'Padrón Restablecido', 'Se recargaron los correos oficiales de la promoción de egresados.');
    } catch (e: any) {
      agregarToast('error', 'Error al restablecer', e.message);
    }
  };

  const eliminarCorreosMultiple = async (ids: string[]) => {
    try {
      await accesosService.eliminarMultiple(ids);
      setCorreosAutorizados((prev) => prev.filter((c) => !ids.includes(c.id)));
      agregarToast('info', 'Registros Eliminados', `Se eliminaron ${ids.length} correos del padrón de egresados.`);
    } catch (e: any) {
      agregarToast('error', 'Error al eliminar selección', e.message);
    }
  };

  const vaciarPadron = async () => {
    try {
      await accesosService.limpiarPadron();
      setCorreosAutorizados([]);
      agregarToast('warning', 'Padrón Vaciado', 'Se eliminaron todos los correos del padrón.');
    } catch (e: any) {
      agregarToast('error', 'Error al vaciar padrón', e.message);
    }
  };

  // Gestión Independiente de Cuentas de Secretaría Académica
  const agregarSecretaria = async (datos: {
    correo: string;
    nombre: string;
    cargo: string;
    passwordInicial?: string;
  }) => {
    try {
      const nueva = await accesosService.agregarSecretaria(datos);
      setCuentasSecretaria((prev) => [nueva, ...prev]);
      agregarToast(
        'success',
        'Secretaria Registrada',
        `Se creó la cuenta independiente para ${nueva.nombre} (${nueva.correo}).`
      );
    } catch (e: any) {
      agregarToast('error', 'No se pudo registrar cuenta', e.message);
    }
  };

  const toggleActivoSecretaria = async (id: string) => {
    try {
      const updated = await accesosService.toggleActivoSecretaria(id);
      setCuentasSecretaria((prev) => prev.map((s) => (s.id === id ? updated : s)));
      agregarToast(
        'info',
        'Estado Actualizado',
        `Cuenta de Secretaría ${updated.activo ? 'Habilitada' : 'Suspendida'}.`
      );
    } catch (e: any) {
      agregarToast('error', 'Operación bloqueada', e.message);
    }
  };

  const eliminarSecretaria = async (id: string) => {
    try {
      await accesosService.eliminarSecretaria(id);
      setCuentasSecretaria((prev) => prev.filter((s) => s.id !== id));
      agregarToast('info', 'Cuenta Retirada', 'Se eliminó la cuenta independiente de Secretaría.');
    } catch (e: any) {
      agregarToast('error', 'Operación bloqueada', e.message);
    }
  };

  const resetearPasswordSecretaria = async (id: string) => {
    try {
      const updated = await accesosService.resetearPasswordSecretaria(id);
      setCuentasSecretaria((prev) => prev.map((s) => (s.id === id ? updated : s)));
      agregarToast(
        'info',
        'Clave Restablecida',
        `La contraseña de ${updated.nombre} volvió a la clave institucional base (UNT2026*).`
      );
    } catch (e: any) {
      agregarToast('error', 'Error al restablecer clave', e.message);
    }
  };

  // Comunicados Generales con Nota de Voz
  const emitirComunicado = async (datos: {
    titulo: string;
    mensaje: string;
    audioUrl?: string;
    audioDuracion?: string;
    audioBlob?: Blob | null;
  }) => {
    try {
      let audioUrlFinal = datos.audioUrl;
      let audioFileIdFinal: string | undefined;

      if (datos.audioBlob) {
        const up = await driveApiService.uploadAudio(
          datos.audioBlob,
          `comunicado_${Date.now()}.webm`
        );
        audioUrlFinal = up.audioUrl;
        audioFileIdFinal = up.fileId;
      }

      const nuevo = await comunicadosService.emitirComunicado({
        titulo: datos.titulo,
        mensaje: datos.mensaje,
        audioUrl: audioUrlFinal,
        audioFileId: audioFileIdFinal,
        audioDuracion: datos.audioDuracion,
        autor: usuario?.nombre || 'Secretaría Académica'
      });
      setComunicados((prev) => [nuevo, ...prev]);
      agregarToast('success', 'Comunicado Emitido', 'Se notificó a los tesistas mediante nota de voz y circular oficial.');
    } catch (e: any) {
      agregarToast('error', 'Error al emitir comunicado', e.message);
    }
  };

  const marcarLeidoComunicado = async (id: string) => {
    try {
      const userId = usuario?.id;
      await comunicadosService.marcarLeido(id, userId);
      setComunicados((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          if (userId) {
            const previos = c.leidoPor || [];
            return { ...c, leidoPor: previos.includes(userId) ? previos : [...previos, userId] };
          }
          return { ...c, leido: true };
        })
      );
    } catch (e: any) {
      console.error(e);
    }
  };

  const eliminarComunicado = async (id: string) => {
    try {
      await comunicadosService.eliminarComunicado(id);
      setComunicados((prev) => prev.filter((c) => c.id !== id));
      agregarToast('info', 'Comunicado Eliminado', 'Se retiró el comunicado de las notificaciones.');
    } catch (e: any) {
      agregarToast('error', 'Error al eliminar comunicado', e.message);
    }
  };

  const agregarFaq = async (datos: { pregunta: string; respuesta: string; categoria?: string }) => {
    try {
      const nueva = await faqService.agregarFaq(datos);
      setFaqs((prev) => [nueva, ...prev]);
      agregarToast('success', 'Pregunta Frecuente Guardada', 'Se publicó la pregunta y respuesta para los tesistas.');
    } catch (e: any) {
      agregarToast('error', 'Error', e.message);
    }
  };

  const editarFaq = async (id: string, datos: { pregunta: string; respuesta: string; categoria?: string }) => {
    try {
      const editada = await faqService.editarFaq(id, datos);
      setFaqs((prev) => prev.map((f) => (f.id === id ? editada : f)));
      agregarToast('success', 'Pregunta Actualizada', 'Se guardaron los cambios en Preguntas Frecuentes.');
    } catch (e: any) {
      agregarToast('error', 'Error', e.message);
    }
  };

  const eliminarFaq = async (id: string) => {
    try {
      await faqService.eliminarFaq(id);
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      agregarToast('info', 'Pregunta Eliminada', 'Se retiró la pregunta frecuente.');
    } catch (e: any) {
      agregarToast('error', 'Error', e.message);
    }
  };

  return (
    <AppContext.Provider
      value={{
        usuario,
        rolActual,
        cambiarRolDemo,
        iniciarSesion,
        cerrarSesion,
        cambiarMiPassword,
        resetearPasswordTesista,
        reservas,
        bloqueos,
        fechasHabilitadas,
        slotsPorFecha,
        defaultSlots,
        getSlotsFecha,
        actualizarSlotsFecha,
        restablecerSlotsFecha,
        actualizarSlotsDefault,
        crearPreReserva,
        editarReserva,
        cancelarReservaPorTesista,
        aprobarReserva,
        rechazarReserva,
        cambiarEstadoReserva,
        liberarReserva,
        toggleBloqueoFecha,
        toggleHabilitarFecha,
        habilitarTodosMes,
        inhabilitarTodosMes,
        documentos,
        subirDocumento,
        revisarDocumento,
        eliminarDocumento,
        eliminarExpedienteTesistaCompleto,
        editarTituloDocumento,
        formatos,
        subirFormato,
        eliminarFormato,
        consultas,
        crearConsulta,
        responderConsulta,
        evaluarResolucionConsulta,
        eliminarConsulta,
        correosAutorizados,
        cuentasSecretaria,
        agregarCorreoAutorizado,
        editarCorreoAutorizado,
        toggleActivoCorreo,
        eliminarCorreoAutorizado,
        eliminarCorreosMultiple,
        vaciarPadron,
        importarCorreosMasivo,
        restablecerPadron,
        agregarSecretaria,
        toggleActivoSecretaria,
        eliminarSecretaria,
        resetearPasswordSecretaria,
        comunicados,
        emitirComunicado,
        marcarLeidoComunicado,
        eliminarComunicado,
        faqs,
        agregarFaq,
        editarFaq,
        eliminarFaq,
        driveStatus,
        refrescarDriveStatus,
        toasts,
        agregarToast,
        removerToast,
        cargando,
        refrescarTodo: () => cargarDatos(true)
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp debe ser utilizado dentro de un AppProvider');
  }
  return ctx;
};
