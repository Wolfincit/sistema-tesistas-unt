import React, { useState, useMemo, useEffect } from 'react';
import {
  EstacionLogisticaId,
  SemaforoEstadoId,
  SeguimientoTesisItem,
  IngenieroJuradoItem,
  SustentacionJuevesItem,
  DespachoChatAnuncioItem
} from '../data/mockLogisticaSecretaria';
import {
  logisticaSecretariaService,
  EmailConfigStatus
} from '../services/logisticaSecretariaService';
import { InstruccionesSustentacionPage } from './InstruccionesSustentacionPage';
import { useApp } from '../context/AppContext';
import {
  ClipboardList,
  Send,
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  Mail,
  Image as ImageIcon,
  Users,
  UserCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
  AlertTriangle,
  LayoutGrid,
  Table2
} from 'lucide-react';

const sanitizeText = (val: string): string =>
  val.replace(/<[^>]*>?/gm, '').replace(/[<>]/g, '');

const ETAPAS_SIMPLES: { id: EstacionLogisticaId; nombre: string; corto: string; color: string }[] = [
  { id: 1, nombre: '1. Recibido', corto: '1. Recibido', color: 'bg-slate-800 text-white' },
  { id: 2, nombre: '2. En Decanato', corto: '2. Decanato', color: 'bg-amber-500 text-slate-950' },
  { id: 3, nombre: '3. En Jurado (10d)', corto: '3. Jurado', color: 'bg-blue-600 text-white' },
  { id: 4, nombre: '4. Listo Jueves', corto: '4. Jueves', color: 'bg-emerald-600 text-white' }
];

const SEMAFORO_META: Record<
  SemaforoEstadoId,
  { label: string; dot: string; badge: string; rowBorder: string }
> = {
  operativo: {
    label: 'Listo',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    rowBorder: 'border-l-4 border-l-emerald-500'
  },
  atencion: {
    label: 'En Revisión',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-950 border-amber-300',
    rowBorder: 'border-l-4 border-l-amber-500'
  },
  incidencia: {
    label: 'Observado',
    dot: 'bg-rose-600',
    badge: 'bg-rose-100 text-rose-900 border-rose-300',
    rowBorder: 'border-l-4 border-l-rose-600'
  }
};

export const resolverSemaforo = (item: SeguimientoTesisItem): SemaforoEstadoId => {
  if (item.semaforo) return item.semaforo;
  if (item.estacionActual >= 4) return 'operativo';
  return 'atencion';
};

export const SecretariaLogisticsPage: React.FC = () => {
  const { usuario, agregarToast } = useApp();
  const [tab, setTab] = useState<'seguimiento' | 'instrucciones' | 'despacho' | 'calendario'>('seguimiento');

  // Estados sincronizados en todo el sistema
  const [seguimientos, setSeguimientos] = useState<SeguimientoTesisItem[]>(() =>
    logisticaSecretariaService.getSeguimientos()
  );
  const [directorioJurado, setDirectorioJurado] = useState<IngenieroJuradoItem[]>(() =>
    logisticaSecretariaService.getDirectorioJurado()
  );
  const [sustentaciones, setSustentaciones] = useState<SustentacionJuevesItem[]>(() =>
    logisticaSecretariaService.getSustentacionesJueves()
  );
  const [historialChat, setHistorialChat] = useState<DespachoChatAnuncioItem[]>(() =>
    logisticaSecretariaService.getHistorialDespachos()
  );

  // Correo vinculado de la Srta. Celia (cuando está vinculado, solo muestra la tuerca ⚙️)
  const [emailStatus, setEmailStatus] = useState<EmailConfigStatus>({
    configured: false,
    senderEmail: '',
    senderName: 'Srta. Celia — Secretaría Ing. Industrial UNT',
    smtpHost: 'smtp.gmail.com'
  });
  const [modalCorreoAbierto, setModalCorreoAbierto] = useState<boolean>(false);
  const [cfgEmailInput, setCfgEmailInput] = useState<string>('');
  const [cfgNameInput, setCfgNameInput] = useState<string>('Srta. Celia — Secretaría Ing. Industrial UNT');
  const [cfgPassInput, setCfgPassInput] = useState<string>('');
  const [cfgGasUrlInput, setCfgGasUrlInput] = useState<string>('');
  const [modoVinculacion, setModoVinculacion] = useState<'directo' | 'workspace' | 'smtp'>('directo');
  const [codigoGasCopiado, setCodigoGasCopiado] = useState<boolean>(false);

  useEffect(() => {
    logisticaSecretariaService.getEmailStatus().then((st) => {
      setEmailStatus(st);
      if (st.senderEmail) setCfgEmailInput(st.senderEmail);
      if (st.senderName) setCfgNameInput(st.senderName);
      if (st.appsScriptUrl) {
        setCfgGasUrlInput(st.appsScriptUrl);
        setModoVinculacion('workspace');
      }
    });
  }, []);

  // =========================================================
  // ELIMINACIÓN SINCRONIZADA CON ADVERTENCIA CORTA
  // =========================================================
  const [confirmarEliminar, setConfirmarEliminar] = useState<{
    tipo: 'tesista' | 'jurado';
    id: string;
    nombre: string;
    correo: string;
  } | null>(null);

  const ejecutarEliminacionSincronizada = async () => {
    if (!confirmarEliminar) return;
    if (confirmarEliminar.tipo === 'tesista') {
      const nuevosSeg = seguimientos.filter((s) => s.id !== confirmarEliminar.id);
      setSeguimientos(nuevosSeg);
      await logisticaSecretariaService.saveSeguimientos(nuevosSeg);

      const nuevasSust = sustentaciones.filter(
        (s) =>
          s.tesistaId !== confirmarEliminar.id &&
          s.tesistaCorreo.toLowerCase() !== confirmarEliminar.correo.toLowerCase()
      );
      setSustentaciones(nuevasSust);
      await logisticaSecretariaService.saveSustentacionesJueves(nuevasSust);

      setTesistasChecks((prev) =>
        prev.filter((c) => c !== confirmarEliminar.correo.toLowerCase())
      );
      agregarToast('info', 'Tesista Eliminado', `Se quitó a ${confirmarEliminar.nombre} de Seguimiento y de la lista de correos.`);
    } else {
      const nuevosJur = directorioJurado.filter((j) => j.id !== confirmarEliminar.id);
      setDirectorioJurado(nuevosJur);
      await logisticaSecretariaService.saveDirectorioJurado(nuevosJur);
      setJuradoChecks((prev) =>
        prev.filter((c) => c !== confirmarEliminar.correo.toLowerCase())
      );
      agregarToast('info', 'Ingeniero Eliminado', `Se quitó a ${confirmarEliminar.nombre} de la lista del jurado.`);
    }
    setConfirmarEliminar(null);
  };

  // =========================================================
  // 1. MATRIZ DE TRABAJO INTERACTIVA (ZERO-LEARNING CURVE)
  // =========================================================
  const [busquedaSeg, setBusquedaSeg] = useState<string>('');
  const [filtroSemaforo, setFiltroSemaforo] = useState<'todos' | SemaforoEstadoId>('todos');
  const [modoVistaSeg, setModoVistaSeg] = useState<'matriz' | 'tarjetas'>('matriz');
  const [guardadoRecienteId, setGuardadoRecienteId] = useState<string>('');
  const [modalSeguimientoAbierto, setModalSeguimientoAbierto] = useState<boolean>(false);
  const [editandoSeg, setEditandoSeg] = useState<SeguimientoTesisItem | null>(null);

  const [formNombre, setFormNombre] = useState<string>('');
  const [formCodigo, setFormCodigo] = useState<string>('');
  const [formCorreo, setFormCorreo] = useState<string>('');
  const [formTitulo, setFormTitulo] = useState<string>('');
  const [formAsesor, setFormAsesor] = useState<string>('');
  const [formPresidente, setFormPresidente] = useState<string>('');
  const [formSecretario, setFormSecretario] = useState<string>('');
  const [formVocal, setFormVocal] = useState<string>('');
  const [formEstacion, setFormEstacion] = useState<EstacionLogisticaId>(1);
  const [formSemaforo, setFormSemaforo] = useState<SemaforoEstadoId>('atencion');
  const [formNotas, setFormNotas] = useState<string>('');

  const marcarFeedbackGuardado = (id: string) => {
    setGuardadoRecienteId(id);
    setTimeout(() => {
      setGuardadoRecienteId((prev) => (prev === id ? '' : prev));
    }, 1500);
  };

  const abrirModalSeguimiento = (item?: SeguimientoTesisItem) => {
    if (item) {
      setEditandoSeg(item);
      setFormNombre(item.tesistaNombre);
      setFormCodigo(item.codigoMatricula);
      setFormCorreo(item.tesistaCorreo);
      setFormTitulo(item.tituloTesis);
      setFormAsesor(item.asesor);
      setFormPresidente(item.juradoPresidente);
      setFormSecretario(item.juradoSecretario);
      setFormVocal(item.juradoVocal);
      setFormEstacion((item.estacionActual > 4 ? 4 : item.estacionActual) as EstacionLogisticaId);
      setFormSemaforo(resolverSemaforo(item));
      setFormNotas(item.notasSecretaria);
    } else {
      setEditandoSeg(null);
      setFormNombre('');
      setFormCodigo('');
      setFormCorreo('');
      setFormTitulo('');
      setFormAsesor(directorioJurado[0]?.nombre || '');
      setFormPresidente(directorioJurado[0]?.nombre || '');
      setFormSecretario(directorioJurado[1]?.nombre || '');
      setFormVocal(directorioJurado[2]?.nombre || '');
      setFormEstacion(1);
      setFormSemaforo('atencion');
      setFormNotas('');
    }
    setModalSeguimientoAbierto(true);
  };

  const handleGuardarSeguimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    const matriculaDigits = formCodigo.replace(/\D/g, '');
    if (matriculaDigits.length !== 10) {
      agregarToast(
        'warning',
        'Matrícula de 10 dígitos',
        'El número de matrícula debe tener exactamente 10 dígitos (ej. 1511300223).'
      );
      return;
    }
    if (!formNombre.trim() || !formCorreo.trim()) return;

    const nuevo: SeguimientoTesisItem = {
      id: editandoSeg ? editandoSeg.id : `seg-${Date.now()}`,
      codigoMatricula: matriculaDigits,
      tesistaNombre: sanitizeText(formNombre.trim()),
      tesistaCorreo: sanitizeText(formCorreo.trim().toLowerCase()),
      tituloTesis: sanitizeText(formTitulo.trim() || 'Tesis en seguimiento'),
      lineaInvestigacion: editandoSeg?.lineaInvestigacion || 'Ingeniería Industrial',
      asesor: sanitizeText(formAsesor.trim()),
      juradoPresidente: sanitizeText(formPresidente.trim()),
      juradoSecretario: sanitizeText(formSecretario.trim()),
      juradoVocal: sanitizeText(formVocal.trim()),
      estacionActual: formEstacion,
      semaforo: formSemaforo,
      fechaIngresoEstacion: new Date().toISOString().slice(0, 10),
      fechaInicioTramite: editandoSeg?.fechaInicioTramite || new Date().toISOString().slice(0, 10),
      ubicacionFisica: 'En seguimiento',
      esCuelloBotellaExterno: formSemaforo === 'incidencia',
      notasSecretaria: sanitizeText(formNotas.trim()),
      fechaSustentacionProgramada: editandoSeg?.fechaSustentacionProgramada,
      requisitosFisicos: editandoSeg?.requisitosFisicos || {
        futFisico: true,
        voucherTupa: true,
        reporteTurnitin: true,
        constanciaPracticas: true,
        resolucionProyecto: true,
        tresBorradoresJurado: true
      }
    };

    const actualizados = editandoSeg
      ? seguimientos.map((s) => (s.id === editandoSeg.id ? nuevo : s))
      : [nuevo, ...seguimientos];

    setSeguimientos(actualizados);
    await logisticaSecretariaService.saveSeguimientos(actualizados);
    setModalSeguimientoAbierto(false);
    marcarFeedbackGuardado(nuevo.id);
    agregarToast(
      'success',
      editandoSeg ? 'Guardado' : 'Tesista Agregado',
      `${nuevo.tesistaNombre} quedó actualizado en la Matriz y en Correos.`
    );
  };

  const handleCambiarEtapaDirecto = async (id: string, nuevaEtapa: EstacionLogisticaId) => {
    const actualizados = seguimientos.map((s) => {
      if (s.id !== id) return s;
      const nuevoSemaforo: SemaforoEstadoId =
        nuevaEtapa === 4 ? 'operativo' : s.semaforo === 'incidencia' ? 'incidencia' : 'atencion';
      return { ...s, estacionActual: nuevaEtapa, semaforo: nuevoSemaforo };
    });
    setSeguimientos(actualizados);
    marcarFeedbackGuardado(id);
    await logisticaSecretariaService.saveSeguimientos(actualizados);
  };

  const handleCambiarSemaforoDirecto = async (id: string, nuevoSemaforo: SemaforoEstadoId) => {
    const actualizados = seguimientos.map((s) =>
      s.id === id
        ? { ...s, semaforo: nuevoSemaforo, esCuelloBotellaExterno: nuevoSemaforo === 'incidencia' }
        : s
    );
    setSeguimientos(actualizados);
    marcarFeedbackGuardado(id);
    await logisticaSecretariaService.saveSeguimientos(actualizados);
  };

  const handleActualizarNotaDirecto = async (id: string, nuevaNota: string) => {
    const limpia = sanitizeText(nuevaNota);
    const actualizados = seguimientos.map((s) =>
      s.id === id ? { ...s, notasSecretaria: limpia } : s
    );
    setSeguimientos(actualizados);
    marcarFeedbackGuardado(id);
    await logisticaSecretariaService.saveSeguimientos(actualizados);
  };

  // =========================================================
  // 2. ENVÍO DE FLYERS Y CORREOS (FLUJO 1 -> 2 -> 3)
  // =========================================================
  const [asuntoChat, setAsuntoChat] = useState<string>(
    'Sustentación de Tesis — Escuela de Ingeniería Industrial UNT'
  );
  const [mensajeChat, setMensajeChat] = useState<string>('');
  const [flyerPreview, setFlyerPreview] = useState<string>('');
  const [flyerNombre, setFlyerNombre] = useState<string>('');
  const [tesistasChecks, setTesistasChecks] = useState<string[]>([]);
  const [juradoChecks, setJuradoChecks] = useState<string[]>([]);
  const [busquedaTesistaCheck, setBusquedaTesistaCheck] = useState<string>('');
  const [busquedaJuradoCheck, setBusquedaJuradoCheck] = useState<string>('');
  const [enviandoCorreo, setEnviandoCorreo] = useState<boolean>(false);
  const [enlaceGmailListo, setEnlaceGmailListo] = useState<{
    gmailUrl: string;
    mailtoUrl: string;
    destinatarios: string[];
  } | null>(null);

  // Inputs rápidos para añadir tesista o jurado desde las listas de checks
  const [nuevoTesistaNombre, setNuevoTesistaNombre] = useState<string>('');
  const [nuevoTesistaCorreo, setNuevoTesistaCorreo] = useState<string>('');
  const [nuevoIngNombre, setNuevoIngNombre] = useState<string>('');
  const [nuevoIngCorreo, setNuevoIngCorreo] = useState<string>('');

  const handleSubirFlyerImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFlyerPreview(String(reader.result || ''));
      setFlyerNombre(file.name);
    };
    reader.readAsDataURL(file);
  };

  const prepararDespachoParaTesistaYJurado = (seg: SeguimientoTesisItem, fechaJueves?: string) => {
    const fechaStr = fechaJueves || seg.fechaSustentacionProgramada || 'Jueves';
    setAsuntoChat(
      `Sustentación de Tesis: ${seg.tesistaNombre} (${fechaStr} · 11:00 a.m. - 1:00 p.m.)`
    );
    setMensajeChat(
      `Estimados miembros del Jurado y Tesista ${seg.tesistaNombre}:\n\nSe remite el flyer y citación para la sustentación de la tesis "${seg.tituloTesis}", programada para el día jueves ${fechaStr} de 11:00 a.m. a 1:00 p.m.\n\nJurado:\n- Presidente: ${seg.juradoPresidente}\n- Secretario: ${seg.juradoSecretario}\n- Vocal: ${seg.juradoVocal}\n\nAtentamente,\nSrta. Celia — Secretaría de Escuela de Ingeniería Industrial UNT`
    );

    if (seg.tesistaCorreo) {
      setTesistasChecks([seg.tesistaCorreo.toLowerCase()]);
    }
    const nombresJurado = [seg.juradoPresidente, seg.juradoSecretario, seg.juradoVocal]
      .map((n) => n.toLowerCase())
      .filter(Boolean);
    const correosJuradoMatch = directorioJurado
      .filter(
        (ing) =>
          ing.categoria === 'Copia Martes' ||
          nombresJurado.some(
            (nj) =>
              ing.nombre.toLowerCase().includes(nj) ||
              nj.includes(ing.nombre.toLowerCase().replace(/^dr\.\s*|^mg\.\s*|^ing\.\s*/g, '').trim())
          )
      )
      .map((ing) => ing.correo.toLowerCase());
    setJuradoChecks(correosJuradoMatch);

    setTab('despacho');
  };

  const construirEnlacesCorreo = (destinatarios: string[], asunto: string, cuerpo: string) => {
    const toParam = encodeURIComponent(destinatarios.join(','));
    const suParam = encodeURIComponent(asunto);
    const bodyParam = encodeURIComponent(cuerpo);
    const authUserParam = emailStatus.senderEmail
      ? `&authuser=${encodeURIComponent(emailStatus.senderEmail)}`
      : '';
    return {
      gmailUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${toParam}&su=${suParam}&body=${bodyParam}${authUserParam}`,
      mailtoUrl: `mailto:${destinatarios.join(',')}?subject=${suParam}&body=${bodyParam}`,
      destinatarios
    };
  };

  const handleEnviarAnuncioYFlyer = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si escribió un correo en las cajitas inferiores "+" pero no presionó "+", incluirlo automáticamente
    const extraTesista = nuevoTesistaCorreo.trim().toLowerCase();
    const extraIng = nuevoIngCorreo.trim().toLowerCase();
    const listaTesistasFinal = Array.from(
      new Set([
        ...tesistasChecks,
        ...(extraTesista.includes('@') ? [extraTesista] : [])
      ])
    );
    const listaJuradoFinal = Array.from(
      new Set([
        ...juradoChecks,
        ...(extraIng.includes('@') ? [extraIng] : [])
      ])
    );
    const todosDestinatarios = Array.from(new Set([...listaTesistasFinal, ...listaJuradoFinal]));

    if (todosDestinatarios.length === 0) {
      agregarToast('warning', 'Falta seleccionar correos', 'Marque con check [✓] al menos un correo a la derecha.');
      return;
    }

    const textoMensajeFinal =
      mensajeChat.trim() ||
      `Estimado(a):\n\nSe remite comunicado y flyer oficial de la Escuela Profesional de Ingeniería Industrial — Universidad Nacional de Trujillo.\n\nAtentamente,\n${emailStatus.senderName || 'Secretaría de Escuela de Ingeniería Industrial UNT'}`;

    const enlaces = construirEnlacesCorreo(todosDestinatarios, asuntoChat, textoMensajeFinal);
    setEnlaceGmailListo(null);

    // Si hay un Flyer cargado, copiar la imagen automáticamente al portapapeles para pegarla con Ctrl+V si usa Gmail Web
    if (flyerPreview && navigator.clipboard && 'write' in navigator.clipboard) {
      fetch(flyerPreview)
        .then((r) => r.blob())
        .then((blob) => {
          const item = new ClipboardItem({ [blob.type || 'image/png']: blob });
          navigator.clipboard.write([item]).catch(() => {});
        })
        .catch(() => {});
    }

    // Si vinculó su correo en Modo Directo 1 Clic (sin conector Apps Script ni clave SMTP), abrir Gmail SÍNCRONAMENTE antes del await
    let ventanaAbiertaSincrona = false;
    if (!emailStatus.configured) {
      const win = window.open(enlaces.gmailUrl, '_blank');
      ventanaAbiertaSincrona = Boolean(win);
      if (!ventanaAbiertaSincrona) {
        setEnlaceGmailListo(enlaces);
      }
    }

    setEnviandoCorreo(true);
    try {
      const res = await logisticaSecretariaService.enviarDespachoCorreo({
        asunto: asuntoChat,
        mensaje: textoMensajeFinal,
        tesistasCorreos: listaTesistasFinal,
        juradoCorreos: listaJuradoFinal,
        flyerDataUrl: flyerPreview || undefined,
        flyerNombre: flyerNombre || undefined
      });

      const tesistasInfo = seguimientos
        .filter((s) => listaTesistasFinal.includes(s.tesistaCorreo.toLowerCase()))
        .map((s) => ({ nombre: s.tesistaNombre, correo: s.tesistaCorreo }));
      const juradoInfo = directorioJurado
        .filter((j) => listaJuradoFinal.includes(j.correo.toLowerCase()))
        .map((j) => ({ nombre: j.nombre, correo: j.correo }));

      const now = new Date();
      const fechaHora = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const nuevoMsg: DespachoChatAnuncioItem = {
        id: `desp-${Date.now()}`,
        fechaHora,
        asunto: asuntoChat,
        mensaje: textoMensajeFinal,
        flyerDataUrl: flyerPreview || undefined,
        flyerNombre: flyerNombre || undefined,
        tesistasDestinatarios: tesistasInfo,
        juradoDestinatarios: juradoInfo,
        modoEnvio: res.mode,
        enviadoPor: usuario?.nombre || 'Srta. Celia'
      };

      const nuevoHistorial = [nuevoMsg, ...historialChat];
      setHistorialChat(nuevoHistorial);
      await logisticaSecretariaService.saveHistorialDespachos(nuevoHistorial);

      if (res.mode === 'smtp-direct') {
        setEnlaceGmailListo(null);
        agregarToast('success', 'Correo Enviado', res.message);
      } else {
        setEnlaceGmailListo(enlaces);
        if (!ventanaAbiertaSincrona) {
          const win = window.open(enlaces.gmailUrl, '_blank');
          if (win) {
            agregarToast(
              'success',
              'Abierto en Gmail',
              `Se abrió Gmail con el correo para ${todosDestinatarios.join(', ')} listo para enviar.`
            );
          } else {
            agregarToast(
              'info',
              'Correo Preparado',
              'Haz clic en el botón "Abrir en Gmail y Enviar" que apareció abajo.'
            );
          }
        } else {
          agregarToast(
            'success',
            'Listo en Gmail',
            `Se abrió Gmail con ${todosDestinatarios.join(', ')} ya cargado.`
          );
        }
      }
    } catch (err: any) {
      setEnlaceGmailListo(enlaces);
      agregarToast('error', 'Error', err?.message || 'Use el botón directo de Gmail abajo.');
    } finally {
      setEnviandoCorreo(false);
    }
  };

  // =========================================================
  // 3. CALENDARIO COMPACTO (JUEVES 11:00 A.M. - 1:00 P.M.)
  // =========================================================
  const [mesCalendario, setMesCalendario] = useState<number>(10);
  const [anioCalendario, setAnioCalendario] = useState<number>(2026);
  const [fechaJuevesActiva, setFechaJuevesActiva] = useState<string>('2026-11-26');

  const [calTesistaId, setCalTesistaId] = useState<string>('seg-001');
  const [calTesistaNombre, setCalTesistaNombre] = useState<string>('Carlos Eduardo Mendoza Villanueva');
  const [calTesistaCodigo, setCalTesistaCodigo] = useState<string>('1021400219');
  const [calTesistaCorreo, setCalTesistaCorreo] = useState<string>('tesista.industrial@unitru.edu.pe');
  const [calTituloTesis, setCalTituloTesis] = useState<string>(
    'Propuesta de mejora en la gestión logística de almacenes mediante Lean Warehousing para reducir costos operativos en una empresa agroindustrial de La Libertad, 2026'
  );
  const [calAsesor, setCalAsesor] = useState<string>('Dr. Ing. Joe Alexis González Vásquez');
  const [calPresidente, setCalPresidente] = useState<string>('Dr. Ing. Ángel Hernández Molina');
  const [calSecretario, setCalSecretario] = useState<string>('Mg. Ing. Carlos José Sandoval Reyes');
  const [calVocal, setCalVocal] = useState<string>('Dr. Ing. Joe Alexis González Vásquez');
  const [calHorario, setCalHorario] = useState<string>('11:00 a.m. - 01:00 p.m.');

  const seleccionarFechaCalendario = (fechaIso: string) => {
    setFechaJuevesActiva(fechaIso);
    const existente = sustentaciones.find((s) => s.fecha === fechaIso);
    if (existente) {
      setCalTesistaId(existente.tesistaId || '');
      setCalTesistaNombre(existente.tesistaNombre);
      setCalTesistaCodigo(existente.tesistaCodigo);
      setCalTesistaCorreo(existente.tesistaCorreo);
      setCalTituloTesis(existente.tituloTesis);
      setCalAsesor(existente.asesor);
      setCalPresidente(existente.juradoPresidente);
      setCalSecretario(existente.juradoSecretario);
      setCalVocal(existente.juradoVocal);
      setCalHorario(existente.horario || '11:00 a.m. - 01:00 p.m.');
    } else if (seguimientos[0]) {
      cargarTesistaEnCalendario(seguimientos[0].id);
      setCalHorario('11:00 a.m. - 01:00 p.m.');
    }
  };

  const cargarTesistaEnCalendario = (segId: string) => {
    setCalTesistaId(segId);
    const found = seguimientos.find((s) => s.id === segId);
    if (found) {
      setCalTesistaNombre(found.tesistaNombre);
      setCalTesistaCodigo(found.codigoMatricula);
      setCalTesistaCorreo(found.tesistaCorreo);
      setCalTituloTesis(found.tituloTesis);
      setCalAsesor(found.asesor);
      setCalPresidente(found.juradoPresidente);
      setCalSecretario(found.juradoSecretario);
      setCalVocal(found.juradoVocal);
    }
  };

  const handleGuardarSustentacionJueves = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calTesistaNombre.trim()) return;

    const existenteIdx = sustentaciones.findIndex((s) => s.fecha === fechaJuevesActiva);
    const registro: SustentacionJuevesItem = {
      id: existenteIdx >= 0 ? sustentaciones[existenteIdx].id : `jue-${Date.now()}`,
      fecha: fechaJuevesActiva,
      horario: calHorario || '11:00 a.m. - 01:00 p.m.',
      tesistaId: calTesistaId || undefined,
      tesistaNombre: calTesistaNombre.trim(),
      tesistaCodigo: calTesistaCodigo.trim(),
      tesistaCorreo: calTesistaCorreo.trim(),
      tituloTesis: calTituloTesis.trim(),
      asesor: calAsesor.trim(),
      juradoPresidente: calPresidente.trim(),
      juradoSecretario: calSecretario.trim(),
      juradoVocal: calVocal.trim(),
      aulaOAuditorio: 'Auditorio de Ingeniería Industrial UNT',
      estado: 'Programada'
    };

    const nuevas =
      existenteIdx >= 0
        ? sustentaciones.map((s, i) => (i === existenteIdx ? registro : s))
        : [...sustentaciones, registro].sort((a, b) => a.fecha.localeCompare(b.fecha));

    setSustentaciones(nuevas);
    await logisticaSecretariaService.saveSustentacionesJueves(nuevas);

    if (calTesistaId) {
      const segActualizados = seguimientos.map((s) =>
        s.id === calTesistaId
          ? {
            ...s,
            fechaSustentacionProgramada: fechaJuevesActiva,
            estacionActual: 4 as EstacionLogisticaId,
            juradoPresidente: calPresidente,
            juradoSecretario: calSecretario,
            juradoVocal: calVocal
          }
          : s
      );
      setSeguimientos(segActualizados);
      await logisticaSecretariaService.saveSeguimientos(segActualizados);
    }

    agregarToast('success', 'Fecha Guardada', `Sustentación agendada para el ${fechaJuevesActiva}.`);
  };

  const handleEliminarSustentacionFecha = async (fechaIso: string) => {
    const nuevas = sustentaciones.filter((s) => s.fecha !== fechaIso);
    setSustentaciones(nuevas);
    await logisticaSecretariaService.saveSustentacionesJueves(nuevas);
    agregarToast('info', 'Fecha Liberada', `Se quitó la sustentación del ${fechaIso}.`);
  };

  const conteosSemaforo = useMemo(() => {
    const c = { todos: seguimientos.length, operativo: 0, atencion: 0, incidencia: 0 };
    seguimientos.forEach((s) => {
      const sem = resolverSemaforo(s);
      c[sem] += 1;
    });
    return c;
  }, [seguimientos]);

  const seguimientosFiltrados = useMemo(() => {
    return seguimientos.filter((s) => {
      const sem = resolverSemaforo(s);
      if (filtroSemaforo !== 'todos' && sem !== filtroSemaforo) return false;
      if (!busquedaSeg.trim()) return true;
      const q = busquedaSeg.toLowerCase();
      return (
        s.tesistaNombre.toLowerCase().includes(q) ||
        s.codigoMatricula.toLowerCase().includes(q) ||
        s.tituloTesis.toLowerCase().includes(q) ||
        s.asesor.toLowerCase().includes(q)
      );
    });
  }, [seguimientos, busquedaSeg, filtroSemaforo]);

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const diasDelMes = useMemo(() => {
    const primerDiaSemana = new Date(anioCalendario, mesCalendario, 1).getDay();
    const totalDias = new Date(anioCalendario, mesCalendario + 1, 0).getDate();
    const celdas: { dia: number | null; fechaIso: string; esJueves: boolean }[] = [];
    for (let i = 0; i < primerDiaSemana; i++) {
      celdas.push({ dia: null, fechaIso: '', esJueves: false });
    }
    for (let d = 1; d <= totalDias; d++) {
      const dt = new Date(anioCalendario, mesCalendario, d);
      const iso = `${anioCalendario}-${String(mesCalendario + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      celdas.push({ dia: d, fechaIso: iso, esJueves: dt.getDay() === 4 });
    }
    return celdas;
  }, [anioCalendario, mesCalendario]);

  const correoYaVinculado = Boolean(emailStatus.senderEmail);

  return (
    <div className="space-y-5">
      {/* Selector Simple y Secuencial de las 4 Pestañas Exclusivas de la Srta. Celia */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-2xs flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('seguimiento')}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${tab === 'seguimiento'
            ? 'bg-[#082F64] text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <ClipboardList className="w-4 h-4 text-amber-300" />
          <span>1. Seguimiento ({seguimientos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('instrucciones')}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${tab === 'instrucciones'
            ? 'bg-[#082F64] text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <Edit3 className="w-4 h-4 text-amber-300" />
          <span>2. Instrucciones (Editar y Publicar)</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('despacho')}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${tab === 'despacho'
            ? 'bg-[#082F64] text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <Send className="w-4 h-4 text-amber-300" />
          <span>3. Flyers y Correos</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('calendario')}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${tab === 'calendario'
            ? 'bg-[#082F64] text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <Calendar className="w-4 h-4 text-amber-300" />
          <span>4. Calendario (Jueves 11:00 - 1:00)</span>
        </button>
      </div>

      {/* =====================================================================
          2. EDITOR EXCLUSIVO DE INSTRUCCIONES (SOLO PARA LA SECRETARÍA)
         ===================================================================== */}
      {tab === 'instrucciones' && <InstruccionesSustentacionPage modoEdicionSecretaria={true} />}

      {/* =====================================================================
          1. MATRIZ DE TRABAJO INTERACTIVA (ZERO-LEARNING CURVE · SEMÁFORO + 1 CLIC)
         ===================================================================== */}
      {tab === 'seguimiento' && (
        <div className="space-y-4">
          {/* Barra de Control Rápido: Buscador + Semáforos de Estado + Selector Matriz/Tarjetas + Nuevo */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[240px] flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busquedaSeg}
                  onChange={(e) => setBusquedaSeg(e.target.value)}
                  placeholder="Buscar matrícula (10 dígitos), tesista o título..."
                  className="w-full pl-10 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#082F64] focus:outline-hidden font-medium"
                />
                {busquedaSeg && (
                  <button
                    type="button"
                    onClick={() => setBusquedaSeg('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Semáforos de Filtrado en 1 Clic (Verde / Amarillo / Rojo) */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFiltroSemaforo('todos')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${filtroSemaforo === 'todos'
                    ? 'bg-[#082F64] text-white border-[#082F64]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  Todos ({conteosSemaforo.todos})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroSemaforo('operativo')}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${filtroSemaforo === 'operativo'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                    }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                  <span>Listo ({conteosSemaforo.operativo})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroSemaforo('atencion')}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${filtroSemaforo === 'atencion'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs'
                    : 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100'
                    }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                  <span>En Revisión ({conteosSemaforo.atencion})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroSemaforo('incidencia')}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${filtroSemaforo === 'incidencia'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                    : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
                    }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                  <span>Observado ({conteosSemaforo.incidencia})</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Selector de Vista: Matriz (Tabla Interactiva) vs Tarjetas */}
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setModoVistaSeg('matriz')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${modoVistaSeg === 'matriz'
                    ? 'bg-[#082F64] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>Matriz</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModoVistaSeg('tarjetas')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${modoVistaSeg === 'tarjetas'
                    ? 'bg-[#082F64] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Tarjetas</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => abrirModalSeguimiento()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] text-white text-xs font-bold shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Nuevo Tesista</span>
              </button>
            </div>
          </div>

          {/* VISTA 1: MATRIZ DE TRABAJO INTERACTIVA (EDICIÓN EN LÍNEA EN 1 CLIC) */}
          {modoVistaSeg === 'matriz' ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#082F64] text-white text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3.5 font-extrabold">Estado</th>
                      <th className="py-3 px-3.5 font-extrabold">Tesista / Matrícula</th>
                      <th className="py-3 px-3.5 font-extrabold min-w-[220px]">Tesis y Jurado</th>
                      <th className="py-3 px-3.5 font-extrabold min-w-[270px]">Etapa (1 Clic)</th>
                      <th className="py-3 px-3.5 font-extrabold min-w-[240px]">Apuntes / Observación</th>
                      <th className="py-3 px-3.5 font-extrabold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {seguimientosFiltrados.map((item) => {
                      const etapaActual = (item.estacionActual > 4 ? 4 : item.estacionActual) as EstacionLogisticaId;
                      const sem = resolverSemaforo(item);
                      const semMeta = SEMAFORO_META[sem];
                      const guardadoAhora = guardadoRecienteId === item.id;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-blue-50/30 transition-colors ${semMeta.rowBorder}`}
                        >
                          {/* Columna 1: Semáforo en 1 Clic */}
                          <td className="py-3.5 px-3.5 align-top">
                            <div className="flex flex-col gap-1.5">
                              <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
                                {(['operativo', 'atencion', 'incidencia'] as SemaforoEstadoId[]).map(
                                  (estadoKey) => {
                                    const activoSem = sem === estadoKey;
                                    const dotColor =
                                      estadoKey === 'operativo'
                                        ? 'bg-emerald-500'
                                        : estadoKey === 'atencion'
                                          ? 'bg-amber-500'
                                          : 'bg-rose-600';
                                    return (
                                      <button
                                        key={estadoKey}
                                        type="button"
                                        onClick={() => handleCambiarSemaforoDirecto(item.id, estadoKey)}
                                        title={SEMAFORO_META[estadoKey].label}
                                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${activoSem
                                          ? 'bg-white shadow-xs ring-2 ring-slate-400 scale-105'
                                          : 'opacity-40 hover:opacity-90'
                                          }`}
                                      >
                                        <span className={`w-3 h-3 rounded-full ${dotColor}`} />
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold border w-fit ${semMeta.badge}`}
                              >
                                {semMeta.label}
                              </span>
                            </div>
                          </td>

                          {/* Columna 2: Tesista + Matrícula 10 dígitos */}
                          <td className="py-3.5 px-3.5 align-top">
                            <div className="font-black text-slate-900 text-xs leading-snug">
                              {item.tesistaNombre}
                            </div>
                            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono font-bold text-[11px] text-[#082F64]">
                              {item.codigoMatricula}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 truncate max-w-[170px] mt-0.5">
                              {item.tesistaCorreo}
                            </div>
                          </td>

                          {/* Columna 3: Título + Jurado compacto */}
                          <td className="py-3.5 px-3.5 align-top max-w-xs">
                            <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">
                              {item.tituloTesis}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-slate-600">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 truncate max-w-[130px]">
                                <strong>P:</strong> {item.juradoPresidente}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 truncate max-w-[130px]">
                                <strong>S:</strong> {item.juradoSecretario}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 truncate max-w-[130px]">
                                <strong>V:</strong> {item.juradoVocal}
                              </span>
                            </div>
                          </td>

                          {/* Columna 4: Selector de Etapa en 1 Clic */}
                          <td className="py-3.5 px-3.5 align-top">
                            <div className="grid grid-cols-2 gap-1.5">
                              {ETAPAS_SIMPLES.map((et) => {
                                const activo = etapaActual === et.id;
                                const completado = etapaActual > et.id;
                                return (
                                  <button
                                    key={et.id}
                                    type="button"
                                    onClick={() => handleCambiarEtapaDirecto(item.id, et.id)}
                                    className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer truncate ${activo
                                      ? `${et.color} shadow-xs ring-2 ring-offset-1 ring-slate-300`
                                      : completado
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                      }`}
                                  >
                                    {et.corto}
                                  </button>
                                );
                              })}
                            </div>
                          </td>

                          {/* Columna 5: Apuntes Directos en Línea (Offline-First) */}
                          <td className="py-3.5 px-3.5 align-top">
                            <div className="relative">
                              <textarea
                                rows={2}
                                value={item.notasSecretaria}
                                onChange={(e) => handleActualizarNotaDirecto(item.id, e.target.value)}
                                placeholder="Apunte rápido..."
                                className="w-full p-2 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-slate-800 focus:bg-white focus:border-[#082F64] focus:outline-hidden"
                              />
                              {guardadoAhora && (
                                <span className="absolute right-2 bottom-2 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold">
                                  ✓ Guardado
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Columna 6: Botones Grandes de Acción Rápida */}
                          <td className="py-3.5 px-3.5 align-top text-right">
                            <div className="flex flex-col gap-1.5 items-end">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    cargarTesistaEnCalendario(item.id);
                                    setTab('calendario');
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold cursor-pointer"
                                  title="Programar Jueves 11:00 - 1:00"
                                >
                                  <Calendar className="w-3.5 h-3.5 text-[#082F64]" />
                                  <span>{item.fechaSustentacionProgramada || 'Jueves'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => prepararDespachoParaTesistaYJurado(item)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-extrabold cursor-pointer"
                                  title="Enviar Flyer al Jurado, Tesista y copias de los Martes"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Flyer</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => abrirModalSeguimiento(item)}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmarEliminar({
                                      tipo: 'tesista',
                                      id: item.id,
                                      nombre: item.tesistaNombre,
                                      correo: item.tesistaCorreo
                                    })
                                  }
                                  className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* VISTA 2: TARJETAS VISUALES */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seguimientosFiltrados.map((item) => {
                const etapaActual = item.estacionActual > 4 ? 4 : item.estacionActual;
                const sem = resolverSemaforo(item);
                const semMeta = SEMAFORO_META[sem];
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${semMeta.rowBorder}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900">{item.tesistaNombre}</h3>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${semMeta.badge}`}
                            >
                              {semMeta.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono font-bold text-slate-700">
                              {item.codigoMatricula}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-unt-blue">{item.tesistaCorreo}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => abrirModalSeguimiento(item)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                            title="Editar datos del tesista"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmarEliminar({
                                tipo: 'tesista',
                                id: item.id,
                                nombre: item.tesistaNombre,
                                correo: item.tesistaCorreo
                              })
                            }
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                            title="Eliminar tesista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 italic line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        "{item.tituloTesis}"
                      </p>

                      <div className="text-[11px] text-slate-600 grid grid-cols-1 sm:grid-cols-3 gap-1 pt-1">
                        <div className="truncate">
                          <strong>Pres.:</strong> {item.juradoPresidente}
                        </div>
                        <div className="truncate">
                          <strong>Sec.:</strong> {item.juradoSecretario}
                        </div>
                        <div className="truncate">
                          <strong>Vocal:</strong> {item.juradoVocal}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {ETAPAS_SIMPLES.map((et) => {
                        const activo = etapaActual === et.id;
                        const completado = etapaActual > et.id;
                        return (
                          <button
                            key={et.id}
                            type="button"
                            onClick={() => handleCambiarEtapaDirecto(item.id, et.id)}
                            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer truncate ${activo
                              ? `${et.color} shadow-xs ring-2 ring-offset-1 ring-slate-300`
                              : completado
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                          >
                            {et.nombre}
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      <textarea
                        rows={2}
                        value={item.notasSecretaria}
                        onChange={(e) => handleActualizarNotaDirecto(item.id, e.target.value)}
                        placeholder="Apuntes..."
                        className="w-full p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          cargarTesistaEnCalendario(item.id);
                          setTab('calendario');
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-unt-blue" />
                        <span>
                          {item.fechaSustentacionProgramada
                            ? `Jueves ${item.fechaSustentacionProgramada}`
                            : 'Agendar Jueves'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => prepararDespachoParaTesistaYJurado(item)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Flyer</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          2. ENVIAR FLYERS Y CORREOS (SECUENCIA SIMPLE 1 -> 2 -> 3 + TUERCA ⚙️)
         ===================================================================== */}
      {tab === 'despacho' && (
        <div className="space-y-4">
          {/* Guía de Flujo Visual 1 -> 2 -> 3 + Tuerca Discreta de Correo */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#082F64] text-amber-300 font-black flex items-center justify-center">
                  1
                </span>
                <span className="font-bold text-slate-800">Sube el flyer o escribe el anuncio</span>
              </div>
              <span className="text-slate-300 font-bold">→</span>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#082F64] text-amber-300 font-black flex items-center justify-center">
                  2
                </span>
                <span className="font-bold text-slate-800">Marca los correos con check [✓]</span>
              </div>
              <span className="text-slate-300 font-bold">→</span>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center">
                  3
                </span>
                <span className="font-bold text-emerald-800">Dale a Enviar</span>
              </div>
            </div>

            {/* Si ya vinculó su correo, solo queda una tuerca ⚙️ discreta; si no, botón simple de 1 clic */}
            {correoYaVinculado ? (
              <button
                type="button"
                onClick={() => setModalCorreoAbierto(true)}
                title={`Correo vinculado: ${emailStatus.senderEmail} (clic para configurar)`}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4 text-unt-blue" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setModalCorreoAbierto(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Vincular mi correo (1 clic)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* IZQUIERDA (7 cols): PASO 1 (SUBIR FLYER / ANUNCIO) Y PASO 3 (ENVIAR) */}
            <div className="lg:col-span-7 space-y-4">
              <form
                onSubmit={handleEnviarAnuncioYFlyer}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 text-xs"
              >
                {/* Caja Grande y Amigable para Subir el Flyer */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 text-center space-y-3">
                  {!flyerPreview ? (
                    <label className="cursor-pointer block py-4 space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-[#082F64] text-amber-300 flex items-center justify-center mx-auto shadow-xs">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        Haz clic aquí para subir tu Flyer (Imagen PNG o JPG)
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSubirFlyerImagen}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="space-y-2">
                      <img
                        src={flyerPreview}
                        alt="Flyer cargado"
                        className="max-h-64 w-auto mx-auto rounded-xl border border-slate-200 shadow-xs"
                      />
                      <div className="flex items-center justify-center gap-3 pt-1">
                        <span className="font-mono text-[11px] text-slate-600">{flyerNombre}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFlyerPreview('');
                            setFlyerNombre('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 font-bold cursor-pointer"
                        >
                          Cambiar imagen
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asunto:</label>
                  <input
                    type="text"
                    required
                    value={asuntoChat}
                    onChange={(e) => setAsuntoChat(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mensaje o Anuncio:</label>
                  <textarea
                    rows={3}
                    value={mensajeChat}
                    onChange={(e) => setMensajeChat(e.target.value)}
                    placeholder="Escribe aquí el mensaje o anuncio que acompañará al flyer..."
                    className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={enviandoCorreo}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {enviandoCorreo
                      ? 'Enviando...'
                      : `Enviar a los Correos Seleccionados (${tesistasChecks.length + juradoChecks.length})`}
                  </span>
                </button>

                {enlaceGmailListo && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2.5 animate-in fade-in">
                    <div className="text-xs font-bold text-emerald-950">
                      ✓ Correo preparado para: <span className="font-mono">{enlaceGmailListo.destinatarios.join(', ')}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={enlaceGmailListo.gmailUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 px-4 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] text-white font-extrabold text-xs text-center shadow-xs inline-flex items-center justify-center gap-1.5"
                      >
                        <Mail className="w-4 h-4 text-amber-300" />
                        <span>Abrir en Gmail y Enviar Ahora</span>
                      </a>
                      <a
                        href={enlaceGmailListo.mailtoUrl}
                        className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs inline-flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5 text-unt-blue" />
                        <span>Abrir en App de Correo</span>
                      </a>
                    </div>
                  </div>
                )}
              </form>

              {/* Historial de Envíos Tipo Chat */}
              {historialChat.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Enviados recientemente
                  </h4>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {historialChat.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-unt-blue">
                          <span>{msg.asunto}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {msg.fechaHora}
                          </span>
                        </div>
                        <p className="text-slate-700 whitespace-pre-line">{msg.mensaje}</p>
                        {msg.flyerDataUrl && (
                          <img
                            src={msg.flyerDataUrl}
                            alt="Flyer"
                            className="max-h-36 rounded-lg border border-slate-200"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* DERECHA (5 cols): PASO 2 — SELECCIONAR CORREOS (TESISTAS Y JURADO SINCRONIZADOS) */}
            <div className="lg:col-span-5 space-y-4">
              {/* LISTA 1: TESISTAS (SINCRONIZADA CON SEGUIMIENTO) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-unt-blue" />
                    <span>Correos de Tesistas</span>
                  </h4>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() =>
                        setTesistasChecks(seguimientos.map((s) => s.tesistaCorreo.toLowerCase()))
                      }
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setTesistasChecks([])}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={busquedaTesistaCheck}
                  onChange={(e) => setBusquedaTesistaCheck(e.target.value)}
                  placeholder="Buscar tesista..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />

                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {seguimientos
                    .filter(
                      (s) =>
                        !busquedaTesistaCheck.trim() ||
                        s.tesistaNombre.toLowerCase().includes(busquedaTesistaCheck.toLowerCase()) ||
                        s.tesistaCorreo.toLowerCase().includes(busquedaTesistaCheck.toLowerCase())
                    )
                    .map((s) => {
                      const correoLow = s.tesistaCorreo.toLowerCase();
                      const marcado = tesistasChecks.includes(correoLow);
                      return (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between p-2.5 text-xs ${marcado ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                            }`}
                        >
                          <label className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={marcado}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTesistasChecks((prev) =>
                                    Array.from(new Set([...prev, correoLow]))
                                  );
                                } else {
                                  setTesistasChecks((prev) => prev.filter((c) => c !== correoLow));
                                }
                              }}
                              className="w-4 h-4 rounded text-unt-blue cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">
                                {s.tesistaNombre}
                              </div>
                              <div className="font-mono text-[11px] text-unt-blue truncate">
                                {s.tesistaCorreo}
                              </div>
                            </div>
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirmarEliminar({
                                tipo: 'tesista',
                                id: s.id,
                                nombre: s.tesistaNombre,
                                correo: s.tesistaCorreo
                              })
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                            title="Eliminar tesista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Añadir Tesista (se añade automáticamente también a Seguimiento) */}
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={nuevoTesistaNombre}
                    onChange={(e) => setNuevoTesistaNombre(e.target.value)}
                    placeholder="Nombre"
                    className="w-2/5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                  <input
                    type="email"
                    value={nuevoTesistaCorreo}
                    onChange={(e) => setNuevoTesistaCorreo(e.target.value)}
                    placeholder="correo@unitru.edu.pe"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!nuevoTesistaCorreo.includes('@')) return;
                      const nombreDefault =
                        nuevoTesistaNombre.trim() || nuevoTesistaCorreo.split('@')[0];
                      const nuevo: SeguimientoTesisItem = {
                        id: `seg-${Date.now()}`,
                        codigoMatricula: `1511${Math.floor(100000 + Math.random() * 900000)}`,
                        tesistaNombre: nombreDefault,
                        tesistaCorreo: nuevoTesistaCorreo.trim().toLowerCase(),
                        tituloTesis: 'Tesis en seguimiento',
                        lineaInvestigacion: 'Ingeniería Industrial',
                        asesor: directorioJurado[0]?.nombre || '',
                        juradoPresidente: directorioJurado[0]?.nombre || '',
                        juradoSecretario: directorioJurado[1]?.nombre || '',
                        juradoVocal: directorioJurado[2]?.nombre || '',
                        estacionActual: 1,
                        fechaIngresoEstacion: new Date().toISOString().slice(0, 10),
                        fechaInicioTramite: new Date().toISOString().slice(0, 10),
                        ubicacionFisica: 'En seguimiento',
                        esCuelloBotellaExterno: false,
                        notasSecretaria: '',
                        requisitosFisicos: {
                          futFisico: true,
                          voucherTupa: true,
                          reporteTurnitin: true,
                          constanciaPracticas: true,
                          resolucionProyecto: true,
                          tresBorradoresJurado: true
                        }
                      };
                      const actualizados = [nuevo, ...seguimientos];
                      setSeguimientos(actualizados);
                      await logisticaSecretariaService.saveSeguimientos(actualizados);
                      setTesistasChecks((prev) => [...prev, nuevo.tesistaCorreo]);
                      setNuevoTesistaNombre('');
                      setNuevoTesistaCorreo('');
                      agregarToast(
                        'success',
                        'Tesista Agregado',
                        `Se agregó a ${nuevo.tesistaNombre} aquí y en Seguimiento.`
                      );
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#082F64] text-white font-bold text-xs cursor-pointer shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* LISTA 2: JURADO (INGENIEROS) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    <span>Correos del Jurado (Ingenieros)</span>
                  </h4>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() =>
                        setJuradoChecks(directorioJurado.map((j) => j.correo.toLowerCase()))
                      }
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setJuradoChecks([])}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={busquedaJuradoCheck}
                  onChange={(e) => setBusquedaJuradoCheck(e.target.value)}
                  placeholder="Buscar ingeniero..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />

                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {directorioJurado
                    .filter(
                      (ing) =>
                        !busquedaJuradoCheck.trim() ||
                        ing.nombre.toLowerCase().includes(busquedaJuradoCheck.toLowerCase()) ||
                        ing.correo.toLowerCase().includes(busquedaJuradoCheck.toLowerCase())
                    )
                    .map((ing) => {
                      const correoLow = ing.correo.toLowerCase();
                      const marcado = juradoChecks.includes(correoLow);
                      return (
                        <div
                          key={ing.id}
                          className={`flex items-center justify-between p-2.5 text-xs ${marcado ? 'bg-emerald-50/80' : 'hover:bg-slate-50'
                            }`}
                        >
                          <label className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={marcado}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setJuradoChecks((prev) =>
                                    Array.from(new Set([...prev, correoLow]))
                                  );
                                } else {
                                  setJuradoChecks((prev) => prev.filter((c) => c !== correoLow));
                                }
                              }}
                              className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{ing.nombre}</div>
                              <div className="font-mono text-[11px] text-emerald-700 truncate">
                                {ing.correo}
                              </div>
                            </div>
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirmarEliminar({
                                tipo: 'jurado',
                                id: ing.id,
                                nombre: ing.nombre,
                                correo: ing.correo
                              })
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                            title="Eliminar ingeniero"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Añadir Ingeniero */}
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={nuevoIngNombre}
                    onChange={(e) => setNuevoIngNombre(e.target.value)}
                    placeholder="Ing. Nombre"
                    className="w-2/5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                  <input
                    type="email"
                    value={nuevoIngCorreo}
                    onChange={(e) => setNuevoIngCorreo(e.target.value)}
                    placeholder="correo@unitru.edu.pe"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!nuevoIngCorreo.includes('@')) return;
                      const nombreIngDefault =
                        nuevoIngNombre.trim() || `Ing. ${nuevoIngCorreo.split('@')[0]}`;
                      const nuevoIng: IngenieroJuradoItem = {
                        id: `ing-${Date.now()}`,
                        nombre: nombreIngDefault,
                        correo: nuevoIngCorreo.trim().toLowerCase(),
                        especialidad: 'Ingeniería Industrial',
                        categoria: 'Docente UNT',
                        activo: true
                      };
                      const actualizados = [nuevoIng, ...directorioJurado];
                      setDirectorioJurado(actualizados);
                      await logisticaSecretariaService.saveDirectorioJurado(actualizados);
                      setJuradoChecks((prev) => [...prev, nuevoIng.correo]);
                      setNuevoIngNombre('');
                      setNuevoIngCorreo('');
                      agregarToast('success', 'Ingeniero Agregado', `Se agregó a ${nuevoIng.nombre}.`);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs cursor-pointer shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. CALENDARIO COMPACTO (JUEVES 11:00 A.M. - 1:00 P.M.)
         ===================================================================== */}
      {tab === 'calendario' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Calendario Mensual Compacto */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 h-fit">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">
                Calendario (Jueves 11:00 – 1:00)
              </h3>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (mesCalendario === 0) {
                      setMesCalendario(11);
                      setAnioCalendario((a) => a - 1);
                    } else {
                      setMesCalendario((m) => m - 1);
                    }
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-800 px-2 min-w-[110px] text-center">
                  {nombresMeses[mesCalendario]} {anioCalendario}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (mesCalendario === 11) {
                      setMesCalendario(0);
                      setAnioCalendario((a) => a + 1);
                    } else {
                      setMesCalendario((m) => m + 1);
                    }
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
              {['Dom', 'Lun', 'Mar', 'Mié', 'JUE', 'Vie', 'Sáb'].map((d) => (
                <div
                  key={d}
                  className={`py-1.5 font-bold rounded-md ${d === 'JUE' ? 'bg-[#082F64] text-amber-300' : 'text-slate-400'
                    }`}
                >
                  {d}
                </div>
              ))}

              {diasDelMes.map((celda, idx) => {
                if (!celda.dia) return <div key={`empty-${idx}`} className="h-10" />;
                const programada = sustentaciones.find((s) => s.fecha === celda.fechaIso);
                const seleccionada = fechaJuevesActiva === celda.fechaIso;

                return (
                  <button
                    key={celda.fechaIso}
                    type="button"
                    onClick={() => seleccionarFechaCalendario(celda.fechaIso)}
                    className={`h-10 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${seleccionada
                      ? 'bg-[#082F64] text-white border-[#082F64] ring-2 ring-amber-400 font-black'
                      : programada
                        ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                        : celda.esJueves
                          ? 'bg-blue-50/80 border-blue-200 text-unt-blue font-bold hover:bg-blue-100'
                          : 'bg-slate-50/40 border-slate-100 text-slate-400 hover:bg-slate-100'
                      }`}
                  >
                    <span className="text-xs leading-none">{celda.dia}</span>
                    {programada && (
                      <span className="text-[8px] font-bold truncate max-w-[38px] mt-0.5 px-1 rounded bg-emerald-600 text-white">
                        {programada.tesistaNombre.split(' ')[0]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Jueves Agendados */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-52 overflow-y-auto">
              {sustentaciones.map((s) => (
                <div
                  key={s.id}
                  onClick={() => seleccionarFechaCalendario(s.fecha)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between gap-2 ${s.fecha === fechaJuevesActiva
                    ? 'border-unt-blue bg-blue-50/70'
                    : 'border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{s.tesistaNombre}</div>
                    <div className="text-[10px] font-mono text-unt-blue">
                      {s.fecha} · {s.horario}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminarSustentacionFecha(s.fecha);
                    }}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario del Día Seleccionado */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Sustentación del {fechaJuevesActiva}
              </h3>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
                11:00 a.m. - 01:00 p.m.
              </span>
            </div>

            <form onSubmit={handleGuardarSustentacionJueves} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Seleccionar Tesista:</label>
                  <select
                    value={calTesistaId}
                    onChange={(e) => cargarTesistaEnCalendario(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
                  >
                    <option value="">-- O escribir abajo --</option>
                    {seguimientos.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.tesistaNombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Horario:</label>
                  <input
                    type="text"
                    value={calHorario}
                    onChange={(e) => setCalHorario(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tesista:</label>
                  <input
                    type="text"
                    required
                    value={calTesistaNombre}
                    onChange={(e) => setCalTesistaNombre(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo:</label>
                  <input
                    type="email"
                    value={calTesistaCorreo}
                    onChange={(e) => setCalTesistaCorreo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título de Tesis:</label>
                <textarea
                  rows={2}
                  required
                  value={calTituloTesis}
                  onChange={(e) => setCalTituloTesis(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Presidente:</label>
                  <input
                    list="lista-ingenieros-unt"
                    value={calPresidente}
                    onChange={(e) => setCalPresidente(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Secretario:</label>
                  <input
                    list="lista-ingenieros-unt"
                    value={calSecretario}
                    onChange={(e) => setCalSecretario(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vocal:</label>
                  <input
                    list="lista-ingenieros-unt"
                    value={calVocal}
                    onChange={(e) => setCalVocal(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <datalist id="lista-ingenieros-unt">
                  {directorioJurado.map((ing) => (
                    <option key={ing.id} value={ing.nombre} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] text-white font-bold shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  <span>Guardar en Calendario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ADVERTENCIA CORTA AL ELIMINAR TESISTA O INGENIERO */}
      {confirmarEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setConfirmarEliminar(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-5 space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-rose-700 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>¿Eliminar a {confirmarEliminar.nombre}?</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {confirmarEliminar.tipo === 'tesista'
                ? 'Se eliminará automáticamente tanto de Seguimiento como de la lista de Correos y Calendario.'
                : 'Se eliminará de la lista de correos del Jurado.'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmarEliminar(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarEliminacionSincronizada}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA AGREGAR / EDITAR TESISTA */}
      {modalSeguimientoAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setModalSeguimientoAbierto(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#082F64] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editandoSeg ? 'Editar Tesista' : 'Nuevo Tesista'}
              </h3>
              <button
                type="button"
                onClick={() => setModalSeguimientoAbierto(false)}
                className="p-1 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarSeguimiento} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    N° Matrícula (10 dígitos):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="1511300223"
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre del Tesista:</label>
                  <input
                    type="text"
                    required
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo:</label>
                  <input
                    type="email"
                    required
                    value={formCorreo}
                    onChange={(e) => setFormCorreo(e.target.value)}
                    placeholder="alumno@unitru.edu.pe"
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título de Tesis:</label>
                <input
                  type="text"
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Presidente:</label>
                  <input
                    list="lista-ingenieros-unt"
                    value={formPresidente}
                    onChange={(e) => setFormPresidente(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Secretario:</label>
                  <input
                    list="lista-ingenieros-unt"
                    value={formSecretario}
                    onChange={(e) => setFormSecretario(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vocal:</label>
                  <input
                    list="lista-ingenieros-unt"
                    value={formVocal}
                    onChange={(e) => setFormVocal(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Apuntes:</label>
                <textarea
                  rows={2}
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalSeguimientoAbierto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#082F64] text-white font-bold cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA VINCULAR CORREO @UNITRU.EDU.PE (3 OPCIONES SIN BLOQUEO DE CONTRASEÑA DE APLICACIÓN) */}
      {modalCorreoAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setModalCorreoAbierto(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#082F64] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Vincular Correo (@unitru.edu.pe o Gmail)</h3>
              <button
                type="button"
                onClick={() => setModalCorreoAbierto(false)}
                className="p-1 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const st = await logisticaSecretariaService.saveEmailConfig({
                    senderEmail: cfgEmailInput,
                    senderName: cfgNameInput,
                    appPassword: modoVinculacion === 'smtp' ? cfgPassInput : '',
                    appsScriptUrl: modoVinculacion === 'workspace' ? cfgGasUrlInput : ''
                  });
                  setEmailStatus(st);
                  setCfgPassInput('');
                  setModalCorreoAbierto(false);
                  agregarToast(
                    'success',
                    'Correo Vinculado',
                    st.mode === 'google-workspace-https'
                      ? `Quedó activo el envío automático en 1 clic para ${st.senderEmail}.`
                      : `Quedó vinculado ${st.senderEmail}.`
                  );
                } catch (err: any) {
                  agregarToast('error', 'Error', err.message);
                }
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Correo Institucional o Gmail:
                </label>
                <input
                  type="email"
                  required
                  value={cfgEmailInput}
                  onChange={(e) => setCfgEmailInput(e.target.value)}
                  placeholder="cchau@unitru.edu.pe"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              {/* Selector de Modo de Vinculación (Especial para @unitru.edu.pe donde Google bloquea Contraseñas de Aplicación) */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  Método de conexión:
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setModoVinculacion('directo')}
                    className={`py-2 px-2 rounded-lg font-bold text-[11px] cursor-pointer transition-all ${
                      modoVinculacion === 'directo'
                        ? 'bg-[#082F64] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1. Directo (Sin clave)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoVinculacion('workspace')}
                    className={`py-2 px-2 rounded-lg font-bold text-[11px] cursor-pointer transition-all ${
                      modoVinculacion === 'workspace'
                        ? 'bg-[#082F64] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2. Auto @unitru
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoVinculacion('smtp')}
                    className={`py-2 px-2 rounded-lg font-bold text-[11px] cursor-pointer transition-all ${
                      modoVinculacion === 'smtp'
                        ? 'bg-[#082F64] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    3. Clave Gmail
                  </button>
                </div>
              </div>

              {/* MODO 1: DIRECTO SIN CLAVE (FUNCIONA AL INSTANTE CON @UNITRU.EDU.PE) */}
              {modoVinculacion === 'directo' && (
                <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-slate-700 space-y-1">
                  <div className="font-bold text-[#082F64]">
                    ✓ Recomendado para @unitru.edu.pe (0 contraseñas)
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Las cuentas <strong>@unitru.edu.pe</strong> tienen desactivadas las "Contraseñas de aplicación" por la UNT. Con esta opción no necesitas ninguna clave: al enviar, se abre tu correo institucional con todos los destinatarios, asunto y mensaje cargados (y el flyer copiado al portapapeles).
                  </p>
                </div>
              )}

              {/* MODO 2: CONECTOR GOOGLE WORKSPACE (@UNITRU.EDU.PE ENVÍO AUTOMÁTICO SIN CONTRASEÑA DE APLICACIÓN) */}
              {modoVinculacion === 'workspace' && (
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2.5">
                  <div className="font-bold text-emerald-950">
                    Envío 100% automático desde @unitru.edu.pe (vía Google Apps Script)
                  </div>
                  <p className="text-[11px] text-slate-700 leading-snug">
                    Permite enviar correos y flyers en 1 clic desde tu cuenta <strong>@unitru.edu.pe</strong> sin usar contraseñas de aplicación:
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const scriptCode = `function doPost(e) {\n  var d = JSON.parse(e.postData.contents);\n  var opts = { htmlBody: d.htmlBody, name: d.fromName || 'Secretaría Ing. Industrial UNT' };\n  if (d.flyerBase64) {\n    var blob = Utilities.newBlob(Utilities.base64Decode(d.flyerBase64), d.flyerMime || 'image/png', d.flyerName || 'Flyer_UNT.png');\n    opts.inlineImages = { flyer_unt_cid: blob };\n    opts.attachments = [blob];\n  }\n  MailApp.sendEmail(d.toList.join(','), d.subject, d.textBody || '', opts);\n  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);\n}`;
                        navigator.clipboard.writeText(scriptCode);
                        setCodigoGasCopiado(true);
                        setTimeout(() => setCodigoGasCopiado(false), 3000);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#082F64] text-white font-bold text-[11px] cursor-pointer"
                    >
                      {codigoGasCopiado ? '✓ Código copiado' : '1. Copiar código'}
                    </button>
                    <a
                      href="https://script.google.com/home/start"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-[#082F64] font-bold text-[11px]"
                    >
                      2. Abrir script.google.com ↗
                    </a>
                  </div>
                  <div className="text-[10px] text-slate-600">
                    En script.google.com: crea un proyecto, pega el código, dale a <strong>Implementar → Nueva implementación → Aplicación web (Acceso: Cualquier persona)</strong> y pega aquí la URL:
                  </div>
                  <input
                    type="url"
                    value={cfgGasUrlInput}
                    onChange={(e) => setCfgGasUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full p-2 rounded-lg border border-emerald-300 bg-white font-mono text-[11px]"
                  />
                </div>
              )}

              {/* MODO 3: CLAVE SMTP (SOLO PARA @GMAIL.COM PERSONAL) */}
              {modoVinculacion === 'smtp' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-[11px] text-slate-600">
                    Solo para cuentas <strong>@gmail.com</strong> personales que tengan habilitada una clave de aplicación de 16 letras:
                  </div>
                  <input
                    type="password"
                    value={cfgPassInput}
                    onChange={(e) => setCfgPassInput(e.target.value)}
                    placeholder="Clave de 16 letras"
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCorreoAbierto(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#082F64] text-white font-bold cursor-pointer"
                >
                  Vincular Ahora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
