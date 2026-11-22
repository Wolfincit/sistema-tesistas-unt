import React, { useState, useMemo, useEffect } from 'react';
import {
  ESTACIONES_LOGISTICAS,
  EstacionLogisticaId,
  SeguimientoTesisItem,
  IngenieroJuradoItem,
  SustentacionJuevesItem,
  DespachoChatAnuncioItem
} from '../data/mockLogisticaSecretaria';
import {
  logisticaSecretariaService,
  EmailConfigStatus
} from '../services/logisticaSecretariaService';
import { PreguntasFrecuentesPage } from './PreguntasFrecuentesPage';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Send,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
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
  Sparkles,
  Settings,
  ExternalLink,
  HelpCircle,
  X,
  FileCheck,
  Building2,
  ArrowRight
} from 'lucide-react';

interface SecretariaLogisticsPageProps {
  pestanaActiva?: 'seguimiento' | 'despacho' | 'calendario' | 'faqs';
  onCambiarPestana?: (p: 'seguimiento' | 'despacho' | 'calendario' | 'faqs') => void;
}

// Generador en Canvas de Flyer Institucional UNT para Sustentaciones de los Jueves 11:00 a.m. - 1:00 p.m.
function generarFlyerSustentacionCanvas(datos: {
  tesistaNombre: string;
  tituloTesis: string;
  fecha: string;
  horario: string;
  presidente: string;
  secretario: string;
  vocal: string;
  asesor: string;
}): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 620;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fondo institucional Azul Marino UNT
  const grad = ctx.createLinearGradient(0, 0, 900, 620);
  grad.addColorStop(0, '#082F64');
  grad.addColorStop(1, '#051D3F');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 900, 620);

  // Marco dorado
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 4;
  ctx.strokeRect(22, 22, 856, 576);

  // Encabezado
  ctx.fillStyle = '#FDE68A';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('UNIVERSIDAD NACIONAL DE TRUJILLO · FACULTAD DE INGENIERÍA', 450, 62);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px serif';
  ctx.fillText('ESCUELA PROFESIONAL DE INGENIERÍA INDUSTRIAL', 450, 95);

  // Etiqueta central
  ctx.fillStyle = '#FBBF24';
  ctx.fillRect(260, 115, 380, 34);
  ctx.fillStyle = '#082F64';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('SUSTENTACIÓN PÚBLICA DE TESIS', 450, 138);

  // Tesista
  ctx.fillStyle = '#93C5FD';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('TESISTA GRADUANDO:', 450, 185);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(datos.tesistaNombre.toUpperCase(), 450, 215);

  // Título de tesis (envuelto en líneas)
  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'italic 16px serif';
  const words = `"${datos.tituloTesis}"`.split(' ');
  let line = '';
  let y = 255;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > 760) {
      ctx.fillText(line, 450, y);
      line = w;
      y += 24;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, 450, y);

  // Caja de Fecha y Hora (Jueves 11:00 a.m. - 1:00 p.m.)
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(110, 340, 680, 62);
  ctx.fillStyle = '#FDE68A';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`FECHA: JUEVES ${datos.fecha}   |   HORA: ${datos.horario}`, 450, 378);

  // Jurado Evaluador
  ctx.fillStyle = '#93C5FD';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('JURADO EVALUADOR DESIGNADO:', 450, 435);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '15px sans-serif';
  ctx.fillText(`Presidente: ${datos.presidente}`, 450, 465);
  ctx.fillText(`Secretario: ${datos.secretario}`, 450, 492);
  ctx.fillText(`Vocal: ${datos.vocal}   ·   Asesor: ${datos.asesor}`, 450, 519);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px sans-serif';
  ctx.fillText('Auditorio de la Escuela Profesional de Ingeniería Industrial — Ciudad Universitaria UNT', 450, 570);

  return canvas.toDataURL('image/png');
}

export const SecretariaLogisticsPage: React.FC<SecretariaLogisticsPageProps> = ({
  pestanaActiva = 'seguimiento',
  onCambiarPestana
}) => {
  const { usuario, agregarToast } = useApp();
  const [tab, setTab] = useState<'seguimiento' | 'despacho' | 'calendario' | 'faqs'>(pestanaActiva);

  useEffect(() => {
    setTab(pestanaActiva);
  }, [pestanaActiva]);

  const cambiarTab = (nuevo: 'seguimiento' | 'despacho' | 'calendario' | 'faqs') => {
    setTab(nuevo);
    if (onCambiarPestana) onCambiarPestana(nuevo);
  };

  // =========================================================
  // ESTADOS PRINCIPALES (SEGUIMIENTO, JURADO, DESPACHOS, JUEVES)
  // =========================================================
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

  // Estado del correo emisor vinculado por la Srta. Celia
  const [emailStatus, setEmailStatus] = useState<EmailConfigStatus>({
    configured: false,
    senderEmail: '',
    senderName: 'Srta. Celia — Secretaría Académica Ing. Industrial UNT',
    smtpHost: 'smtp.gmail.com'
  });
  const [modalCorreoAbierto, setModalCorreoAbierto] = useState<boolean>(false);
  const [cfgEmailInput, setCfgEmailInput] = useState<string>('');
  const [cfgNameInput, setCfgNameInput] = useState<string>('Srta. Celia — Secretaría Ing. Industrial UNT');
  const [cfgPassInput, setCfgPassInput] = useState<string>('');

  useEffect(() => {
    logisticaSecretariaService.getEmailStatus().then((st) => {
      setEmailStatus(st);
      if (st.senderEmail) setCfgEmailInput(st.senderEmail);
      if (st.senderName) setCfgNameInput(st.senderName);
    });
  }, []);

  // =========================================================
  // 1. MÓDULO DE SEGUIMIENTO LOGÍSTICO Y CUELLOS DE BOTELLA
  // =========================================================
  const [busquedaSeg, setBusquedaSeg] = useState<string>('');
  const [filtroEstacion, setFiltroEstacion] = useState<number | 'TODAS' | 'CUELLO_EXTERNO'>('TODAS');
  const [modalSeguimientoAbierto, setModalSeguimientoAbierto] = useState<boolean>(false);
  const [editandoSeg, setEditandoSeg] = useState<SeguimientoTesisItem | null>(null);

  // Campos formulario de seguimiento
  const [formCodigo, setFormCodigo] = useState<string>('');
  const [formNombre, setFormNombre] = useState<string>('');
  const [formCorreo, setFormCorreo] = useState<string>('');
  const [formTelefono, setFormTelefono] = useState<string>('');
  const [formTitulo, setFormTitulo] = useState<string>('');
  const [formLinea, setFormLinea] = useState<string>('Producción y Operaciones');
  const [formAsesor, setFormAsesor] = useState<string>('');
  const [formPresidente, setFormPresidente] = useState<string>('');
  const [formSecretario, setFormSecretario] = useState<string>('');
  const [formVocal, setFormVocal] = useState<string>('');
  const [formEstacion, setFormEstacion] = useState<EstacionLogisticaId>(1);
  const [formFechaEstacion, setFormFechaEstacion] = useState<string>('2026-11-22');
  const [formUbicacion, setFormUbicacion] = useState<string>('Mesa de Secretaría de Escuela (Srta. Celia)');
  const [formCuelloExterno, setFormCuelloExterno] = useState<boolean>(false);
  const [formMotivoCuello, setFormMotivoCuello] = useState<string>('');
  const [formNotas, setFormNotas] = useState<string>('');
  const [formReqs, setFormReqs] = useState({
    futFisico: true,
    voucherTupa: true,
    reporteTurnitin: true,
    constanciaPracticas: true,
    resolucionProyecto: true,
    tresBorradoresJurado: true
  });

  const abrirModalSeguimiento = (item?: SeguimientoTesisItem) => {
    if (item) {
      setEditandoSeg(item);
      setFormCodigo(item.codigoMatricula);
      setFormNombre(item.tesistaNombre);
      setFormCorreo(item.tesistaCorreo);
      setFormTelefono(item.tesistaTelefono || '');
      setFormTitulo(item.tituloTesis);
      setFormLinea(item.lineaInvestigacion);
      setFormAsesor(item.asesor);
      setFormPresidente(item.juradoPresidente);
      setFormSecretario(item.juradoSecretario);
      setFormVocal(item.juradoVocal);
      setFormEstacion(item.estacionActual);
      setFormFechaEstacion(item.fechaIngresoEstacion);
      setFormUbicacion(item.ubicacionFisica);
      setFormCuelloExterno(item.esCuelloBotellaExterno);
      setFormMotivoCuello(item.motivoRetrasoExterno || '');
      setFormNotas(item.notasSecretaria);
      setFormReqs({ ...item.requisitosFisicos });
    } else {
      setEditandoSeg(null);
      setFormCodigo('');
      setFormNombre('');
      setFormCorreo('');
      setFormTelefono('');
      setFormTitulo('');
      setFormLinea('Producción y Operaciones');
      setFormAsesor(directorioJurado[0]?.nombre || '');
      setFormPresidente(directorioJurado[0]?.nombre || '');
      setFormSecretario(directorioJurado[1]?.nombre || '');
      setFormVocal(directorioJurado[2]?.nombre || '');
      setFormEstacion(1);
      setFormFechaEstacion(new Date().toISOString().slice(0, 10));
      setFormUbicacion('Mesa de Secretaría de Escuela (Srta. Celia)');
      setFormCuelloExterno(false);
      setFormMotivoCuello('');
      setFormNotas('Expediente físico recibido en Secretaría de Escuela.');
      setFormReqs({
        futFisico: true,
        voucherTupa: true,
        reporteTurnitin: true,
        constanciaPracticas: true,
        resolucionProyecto: true,
        tresBorradoresJurado: false
      });
    }
    setModalSeguimientoAbierto(true);
  };

  const handleGuardarSeguimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formCodigo.trim()) return;

    const nuevo: SeguimientoTesisItem = {
      id: editandoSeg ? editandoSeg.id : `seg-${Date.now()}`,
      codigoMatricula: formCodigo.trim(),
      tesistaNombre: formNombre.trim(),
      tesistaCorreo: formCorreo.trim().toLowerCase(),
      tesistaTelefono: formTelefono.trim(),
      tituloTesis: formTitulo.trim() || 'Proyecto de Tesis — Ingeniería Industrial UNT',
      lineaInvestigacion: formLinea,
      asesor: formAsesor.trim(),
      juradoPresidente: formPresidente.trim(),
      juradoSecretario: formSecretario.trim(),
      juradoVocal: formVocal.trim(),
      estacionActual: formEstacion,
      fechaIngresoEstacion: formFechaEstacion,
      fechaInicioTramite: editandoSeg ? editandoSeg.fechaInicioTramite : formFechaEstacion,
      ubicacionFisica: formUbicacion.trim(),
      esCuelloBotellaExterno: formCuelloExterno,
      motivoRetrasoExterno: formCuelloExterno ? formMotivoCuello.trim() : undefined,
      notasSecretaria: formNotas.trim(),
      fechaSustentacionProgramada: editandoSeg?.fechaSustentacionProgramada,
      requisitosFisicos: { ...formReqs }
    };

    const actualizados = editandoSeg
      ? seguimientos.map((s) => (s.id === editandoSeg.id ? nuevo : s))
      : [nuevo, ...seguimientos];

    setSeguimientos(actualizados);
    await logisticaSecretariaService.saveSeguimientos(actualizados);
    setModalSeguimientoAbierto(false);
    agregarToast(
      'success',
      editandoSeg ? 'Seguimiento Actualizado' : 'Tesista Registrado en Flujo',
      `Se guardó la trazabilidad logística de ${nuevo.tesistaNombre}.`
    );
  };

  const handleAvanzarEstacionRapido = async (item: SeguimientoTesisItem, nuevaEst: EstacionLogisticaId) => {
    const estMeta = ESTACIONES_LOGISTICAS.find((e) => e.id === nuevaEst);
    const esExterna =
      estMeta?.tipoFlujo === 'EXTERNO_FACULTAD' ||
      estMeta?.tipoFlujo === 'EXTERNO_JURADO' ||
      estMeta?.tipoFlujo === 'EXTERNO_URAA';

    const actualizado: SeguimientoTesisItem = {
      ...item,
      estacionActual: nuevaEst,
      fechaIngresoEstacion: new Date().toISOString().slice(0, 10),
      ubicacionFisica: estMeta ? `${estMeta.nombre} (${estMeta.responsable})` : item.ubicacionFisica,
      esCuelloBotellaExterno: esExterna ? item.esCuelloBotellaExterno : false
    };

    const nuevos = seguimientos.map((s) => (s.id === item.id ? actualizado : s));
    setSeguimientos(nuevos);
    await logisticaSecretariaService.saveSeguimientos(nuevos);
    agregarToast(
      'info',
      `Movido a ${estMeta?.codigo}`,
      `${item.tesistaNombre} pasó a: ${estMeta?.nombre}.`
    );
  };

  const handleEliminarSeguimiento = async (id: string, nombre: string) => {
    if (!confirm(`¿Retirar a ${nombre} del tablero de seguimiento logístico?`)) return;
    const nuevos = seguimientos.filter((s) => s.id !== id);
    setSeguimientos(nuevos);
    await logisticaSecretariaService.saveSeguimientos(nuevos);
    agregarToast('info', 'Registro Eliminado', `Se retiró el expediente de ${nombre}.`);
  };

  // =========================================================
  // 2. MÓDULO TIPO CHAT DE ANUNCIOS, FLYERS Y CHECKS DE CORREOS
  // =========================================================
  const [asuntoChat, setAsuntoChat] = useState<string>(
    'Citación Oficial a Sustentación Pública de Tesis (Jueves 11:00 a.m. - 1:00 p.m.)'
  );
  const [mensajeChat, setMensajeChat] = useState<string>('');
  const [flyerPreview, setFlyerPreview] = useState<string>('');
  const [flyerNombre, setFlyerNombre] = useState<string>('');
  const [tesistasChecks, setTesistasChecks] = useState<string[]>([]);
  const [juradoChecks, setJuradoChecks] = useState<string[]>([]);
  const [busquedaTesistaCheck, setBusquedaTesistaCheck] = useState<string>('');
  const [busquedaJuradoCheck, setBusquedaJuradoCheck] = useState<string>('');
  const [enviandoCorreo, setEnviandoCorreo] = useState<boolean>(false);

  // Agregar nuevo correo de tesista o ingeniero desde el panel derecho
  const [nuevoTesistaCorreo, setNuevoTesistaCorreo] = useState<string>('');
  const [nuevoTesistaNombre, setNuevoTesistaNombre] = useState<string>('');
  const [nuevoIngNombre, setNuevoIngNombre] = useState<string>('');
  const [nuevoIngCorreo, setNuevoIngCorreo] = useState<string>('');
  const [nuevoIngEsp, setNuevoIngEsp] = useState<string>('Ingeniería Industrial');

  const handleSubirFlyerImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFlyerPreview(String(reader.result || ''));
      setFlyerNombre(file.name);
      agregarToast('info', 'Flyer Adjuntado', `Se cargó la imagen "${file.name}" lista para enviar.`);
    };
    reader.readAsDataURL(file);
  };

  const prepararDespachoParaTesistaYJurado = (seg: SeguimientoTesisItem, fechaJueves?: string) => {
    const fechaStr = fechaJueves || seg.fechaSustentacionProgramada || 'Próximo Jueves';
    setAsuntoChat(
      `Citación Oficial a Sustentación de Tesis: ${seg.tesistaNombre} — Jueves ${fechaStr} (11:00 a.m. a 1:00 p.m.)`
    );
    setMensajeChat(
      `Estimados Ingenieros miembros del Jurado Evaluador y Tesista ${seg.tesistaNombre}:\n\nPor medio del presente, la Secretaría de la Escuela Profesional de Ingeniería Industrial UNT cumple con notificar y adjuntar el Flyer Oficial para la Sustentación Pública de la tesis:\n"${seg.tituloTesis}"\n\n• Fecha: JUEVES ${fechaStr}\n• Hora exacta: 11:00 a.m. a 1:00 p.m.\n• Jurado Evaluador:\n  - Presidente: ${seg.juradoPresidente}\n  - Secretario: ${seg.juradoSecretario}\n  - Vocal: ${seg.juradoVocal}\n\nAtentamente,\nSrta. Celia — Secretaría Académica de Ingeniería Industrial UNT`
    );

    // Generar flyer automático en Canvas
    const autoFlyer = generarFlyerSustentacionCanvas({
      tesistaNombre: seg.tesistaNombre,
      tituloTesis: seg.tituloTesis,
      fecha: fechaStr,
      horario: '11:00 a.m. - 01:00 p.m.',
      presidente: seg.juradoPresidente,
      secretario: seg.juradoSecretario,
      vocal: seg.juradoVocal,
      asesor: seg.asesor
    });
    setFlyerPreview(autoFlyer);
    setFlyerNombre(`Flyer_${seg.codigoMatricula}_${fechaStr}.png`);

    // Marcar automáticamente el check [✓] del tesista y los checks [✓] de sus 3 ingenieros del jurado
    if (seg.tesistaCorreo) {
      setTesistasChecks([seg.tesistaCorreo.toLowerCase()]);
    }
    const nombresJurado = [seg.juradoPresidente, seg.juradoSecretario, seg.juradoVocal]
      .map((n) => n.toLowerCase())
      .filter(Boolean);
    const correosJuradoMatch = directorioJurado
      .filter((ing) =>
        nombresJurado.some(
          (nj) =>
            ing.nombre.toLowerCase().includes(nj) ||
            nj.includes(ing.nombre.toLowerCase().replace(/^dr\.\s*|^mg\.\s*|^ing\.\s*/g, '').trim())
        )
      )
      .map((ing) => ing.correo.toLowerCase());
    setJuradoChecks(correosJuradoMatch);

    cambiarTab('despacho');
    agregarToast(
      'success',
      'Flyer y Destinatarios Preparados',
      `Se marcaron con check [✓] el correo del tesista y los ${correosJuradoMatch.length} ingenieros de su jurado.`
    );
  };

  const handleEnviarAnuncioYFlyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tesistasChecks.length === 0 && juradoChecks.length === 0) {
      agregarToast(
        'warning',
        'Seleccione Destinatarios',
        'Marque al menos una casilla de check [✓] en Tesistas o en Jurado (Ingenieros).'
      );
      return;
    }
    if (!mensajeChat.trim() && !flyerPreview) {
      agregarToast('warning', 'Mensaje vacío', 'Escriba un anuncio o adjunte un flyer para enviar.');
      return;
    }

    setEnviandoCorreo(true);
    try {
      const res = await logisticaSecretariaService.enviarDespachoCorreo({
        asunto: asuntoChat,
        mensaje: mensajeChat,
        tesistasCorreos: tesistasChecks,
        juradoCorreos: juradoChecks,
        flyerDataUrl: flyerPreview || undefined,
        flyerNombre: flyerNombre || undefined
      });

      const tesistasInfo = seguimientos
        .filter((s) => tesistasChecks.includes(s.tesistaCorreo.toLowerCase()))
        .map((s) => ({ nombre: s.tesistaNombre, correo: s.tesistaCorreo }));
      const juradoInfo = directorioJurado
        .filter((j) => juradoChecks.includes(j.correo.toLowerCase()))
        .map((j) => ({ nombre: j.nombre, correo: j.correo }));

      const now = new Date();
      const fechaHora = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const nuevoMsg: DespachoChatAnuncioItem = {
        id: `desp-${Date.now()}`,
        fechaHora,
        asunto: asuntoChat,
        mensaje: mensajeChat || 'Flyer oficial de sustentación adjunto.',
        flyerDataUrl: flyerPreview || undefined,
        flyerNombre: flyerNombre || undefined,
        tesistasDestinatarios: tesistasInfo,
        juradoDestinatarios: juradoInfo,
        modoEnvio: res.mode,
        enviadoPor: usuario?.nombre || 'Srta. Celia (Secretaría Académica)'
      };

      const nuevoHistorial = [nuevoMsg, ...historialChat];
      setHistorialChat(nuevoHistorial);
      await logisticaSecretariaService.saveHistorialDespachos(nuevoHistorial);

      if (res.mode === 'smtp-direct') {
        agregarToast('success', 'Correos Enviados Directamente', res.message);
      } else {
        // Abrir Gmail Institucional con todos los destinatarios marcados con check [✓] ya cargados
        const toParam = encodeURIComponent(res.recipients.join(','));
        const suParam = encodeURIComponent(asuntoChat);
        const bodyParam = encodeURIComponent(
          `${mensajeChat}\n\n---\nSecretaría Académica · Escuela de Ingeniería Industrial UNT`
        );
        window.open(
          `https://mail.google.com/mail/?view=cm&fs=1&to=${toParam}&su=${suParam}&body=${bodyParam}`,
          '_blank',
          'noopener,noreferrer'
        );
        agregarToast(
          'success',
          'Anuncio Registrado y Abierto en Gmail',
          `Se cargaron automáticamente los ${res.recipientsCount} correos seleccionados en Gmail listo para enviar.`
        );
      }
    } catch (err: any) {
      agregarToast('error', 'Error en el despacho', err.message);
    } finally {
      setEnviandoCorreo(false);
    }
  };

  // =========================================================
  // 3. CALENDARIO COMPACTO DE JUEVES (11:00 A.M. - 1:00 P.M.)
  // =========================================================
  const [mesCalendario, setMesCalendario] = useState<number>(10); // Noviembre (0-indexed = 10)
  const [anioCalendario, setAnioCalendario] = useState<number>(2026);
  const [fechaJuevesActiva, setFechaJuevesActiva] = useState<string>('2026-11-26');

  // Formulario compacto del día seleccionado en el calendario
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
  const [calEstado, setCalEstado] = useState<'Programada' | 'Realizada (Acta Firmada)' | 'Reprogramada'>('Programada');

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
      setCalEstado(existente.estado);
    } else {
      const primerSeg = seguimientos[0];
      if (primerSeg) {
        cargarTesistaEnCalendario(primerSeg.id);
      }
      setCalHorario('11:00 a.m. - 01:00 p.m.');
      setCalEstado('Programada');
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
      estado: calEstado
    };

    const nuevas =
      existenteIdx >= 0
        ? sustentaciones.map((s, i) => (i === existenteIdx ? registro : s))
        : [...sustentaciones, registro].sort((a, b) => a.fecha.localeCompare(b.fecha));

    setSustentaciones(nuevas);
    await logisticaSecretariaService.saveSustentacionesJueves(nuevas);

    // Sincronizar fecha en el tablero de Seguimiento Logístico
    if (calTesistaId) {
      const segActualizados = seguimientos.map((s) =>
        s.id === calTesistaId
          ? {
              ...s,
              fechaSustentacionProgramada: fechaJuevesActiva,
              estacionActual: (s.estacionActual < 4 ? 4 : s.estacionActual) as EstacionLogisticaId,
              juradoPresidente: calPresidente,
              juradoSecretario: calSecretario,
              juradoVocal: calVocal
            }
          : s
      );
      setSeguimientos(segActualizados);
      await logisticaSecretariaService.saveSeguimientos(segActualizados);
    }

    agregarToast(
      'success',
      'Sustentación Anotada en Calendario',
      `Quedó programado ${registro.tesistaNombre} para el ${fechaJuevesActiva} (${registro.horario}).`
    );
  };

  const handleEliminarSustentacionFecha = async (fechaIso: string) => {
    const nuevas = sustentaciones.filter((s) => s.fecha !== fechaIso);
    setSustentaciones(nuevas);
    await logisticaSecretariaService.saveSustentacionesJueves(nuevas);
    agregarToast('info', 'Fecha Liberada', `Se liberó el día ${fechaIso} en el calendario.`);
  };

  // KPIs Logísticos Calculados
  const totalWip = seguimientos.length;
  const totalCuellosExternos = seguimientos.filter((s) => s.esCuelloBotellaExterno).length;
  const totalListosJueves = seguimientos.filter((s) => s.estacionActual === 4).length;

  const seguimientosFiltrados = useMemo(() => {
    return seguimientos.filter((s) => {
      if (filtroEstacion === 'CUELLO_EXTERNO' && !s.esCuelloBotellaExterno) return false;
      if (typeof filtroEstacion === 'number' && s.estacionActual !== filtroEstacion) return false;
      if (!busquedaSeg.trim()) return true;
      const q = busquedaSeg.toLowerCase();
      return (
        s.tesistaNombre.toLowerCase().includes(q) ||
        s.codigoMatricula.toLowerCase().includes(q) ||
        s.tituloTesis.toLowerCase().includes(q) ||
        s.juradoPresidente.toLowerCase().includes(q) ||
        s.juradoSecretario.toLowerCase().includes(q) ||
        s.juradoVocal.toLowerCase().includes(q)
      );
    });
  }, [seguimientos, filtroEstacion, busquedaSeg]);

  // Construcción de días del mes para el Calendario Compacto
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const diasDelMes = useMemo(() => {
    const primerDiaSemana = new Date(anioCalendario, mesCalendario, 1).getDay(); // 0=Dom .. 4=Jue
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

  return (
    <div className="space-y-5">
      {/* Barra Superior de los 3 Apartados Exclusivos de Secretaría (Srta. Celia) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => cambiarTab('seguimiento')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'seguimiento'
                ? 'bg-[#082F64] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-300" />
            <span>1. Seguimiento Logístico de Tesis</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">{totalWip}</span>
          </button>

          <button
            type="button"
            onClick={() => cambiarTab('despacho')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'despacho'
                ? 'bg-[#082F64] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Send className="w-4 h-4 text-amber-300" />
            <span>2. Anuncios, Flyers y Correos (Tesistas / Jurado)</span>
          </button>

          <button
            type="button"
            onClick={() => cambiarTab('calendario')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'calendario'
                ? 'bg-[#082F64] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-300" />
            <span>3. Calendario de Sustentaciones (Jueves 11-1 PM)</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">
              {sustentaciones.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => cambiarTab('faqs')}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              tab === 'faqs'
                ? 'bg-[#082F64] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Preguntas Frecuentes</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-semibold hidden xl:block">
          Panel Exclusivo · Srta. Celia (Secretaría de Escuela Ing. Industrial UNT)
        </div>
      </div>

      {/* =====================================================================
          APARTADO 1: SEGUIMIENTO LOGÍSTICO DE TESIS Y CUELLOS DE BOTELLA
         ===================================================================== */}
      {tab === 'seguimiento' && (
        <div className="space-y-5">
          {/* KPIs Logísticos: Evidencia de que el Cuello de Botella es Externo a la Escuela */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                WIP (Expedientes en Flujo)
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalWip} tesis</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Trazabilidad física y virtual en 6 estaciones
              </p>
            </div>

            <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Lead Time Interno (Escuela · Srta. Celia)
              </span>
              <div className="text-2xl font-black text-emerald-700 mt-1">1.2 días</div>
              <p className="text-[11px] text-emerald-800 mt-0.5 font-semibold">
                ✓ Sin cuello de botella interno (Meta SLA ≤ 2 días)
              </p>
            </div>

            <div className="bg-rose-50/70 rounded-2xl border border-rose-200 p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                Cuellos de Botella Externos (Facultad / Jurado)
              </span>
              <div className="text-2xl font-black text-rose-700 mt-1">
                {totalCuellosExternos} retenidos
              </div>
              <p className="text-[11px] text-rose-800 mt-0.5 font-semibold">
                ⚠️ Demoras en Decanato o firmas de Jurado Evaluador
              </p>
            </div>

            <div className="bg-blue-50/70 rounded-2xl border border-blue-200 p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-unt-blue">
                Listos para Jueves (11:00 a.m. - 1:00 p.m.)
              </span>
              <div className="text-2xl font-black text-unt-blue mt-1">
                {totalListosJueves} expeditos
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Con dictamen de jurado listo para sustentar
              </p>
            </div>
          </div>

          {/* Barra de Filtros por Estación Logística + Botón Nuevo Seguimiento */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Tablero de Seguimiento y Control Logístico de Tesis
                </h3>
                <p className="text-xs text-slate-500">
                  Anote en qué estación va la tesis de cada estudiante, qué documentos físicos entregó y quiénes conforman su jurado.
                </p>
              </div>

              <button
                type="button"
                onClick={() => abrirModalSeguimiento()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] text-white text-xs font-bold shadow-xs cursor-pointer w-fit"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>+ Anotar Nuevo Tesista en Seguimiento</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFiltroEstacion('TODAS')}
                  className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                    filtroEstacion === 'TODAS'
                      ? 'bg-[#082F64] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas ({seguimientos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEstacion('CUELLO_EXTERNO')}
                  className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer flex items-center gap-1 ${
                    filtroEstacion === 'CUELLO_EXTERNO'
                      ? 'bg-rose-700 text-white'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Cuellos de Botella Externos ({totalCuellosExternos})</span>
                </button>
                {ESTACIONES_LOGISTICAS.map((est) => (
                  <button
                    key={est.id}
                    type="button"
                    onClick={() => setFiltroEstacion(est.id)}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      filtroEstacion === est.id
                        ? 'bg-unt-blue text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {est.codigo}
                  </button>
                ))}
              </div>

              <div className="relative sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busquedaSeg}
                  onChange={(e) => setBusquedaSeg(e.target.value)}
                  placeholder="Buscar tesista, matrícula o jurado..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Tarjetas de Seguimiento por Estudiante */}
            <div className="space-y-3">
              {seguimientosFiltrados.map((item) => {
                const estMeta =
                  ESTACIONES_LOGISTICAS.find((e) => e.id === item.estacionActual) ||
                  ESTACIONES_LOGISTICAS[0];
                const reqsCompletos = Object.values(item.requisitosFisicos).filter(Boolean).length;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      item.esCuelloBotellaExterno
                        ? 'border-rose-300 bg-rose-50/25'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                      <div className="space-y-1 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-slate-900">
                            {item.tesistaNombre}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                            Cód: {item.codigoMatricula}
                          </span>
                          <span className="text-xs font-mono text-unt-blue">
                            {item.tesistaCorreo}
                          </span>
                          {item.esCuelloBotellaExterno && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Cuello de Botella Externo (Fuera de Escuela)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 italic leading-relaxed">
                          "{item.tituloTesis}"
                        </p>
                      </div>

                      {/* Botones de Acción Logística para la Srta. Celia */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => prepararDespachoParaTesistaYJurado(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold cursor-pointer shadow-2xs"
                          title="Ir al chat de anuncios con el correo de este tesista y sus 3 jurados marcados con check"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar Flyer / Correo a Tesista y Jurado</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            cargarTesistaEnCalendario(item.id);
                            cambiarTab('calendario');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-unt-blue border border-blue-200 text-xs font-bold cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Agendar Jueves</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirModalSeguimiento(item)}
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                          title="Editar anotaciones y seguimiento"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEliminarSeguimiento(item.id, item.tesistaNombre)}
                          className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Selector Rápido de Estación Logística (1 a 6) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 text-[11px]">
                      {ESTACIONES_LOGISTICAS.map((est) => {
                        const activa = est.id === item.estacionActual;
                        const pasada = est.id < item.estacionActual;
                        return (
                          <button
                            key={est.id}
                            type="button"
                            onClick={() => handleAvanzarEstacionRapido(item, est.id)}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                              activa
                                ? 'bg-[#082F64] text-white border-[#082F64] font-bold shadow-xs'
                                : pasada
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px]">{est.codigo}</span>
                              {pasada && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {activa && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                            </div>
                            <div className="truncate mt-0.5">{est.nombre}</div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Jurado, Requisitos Físicos y Bitácora de la Srta. Celia */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1 text-xs">
                      <div className="lg:col-span-5 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="font-bold text-slate-800 flex items-center justify-between">
                          <span>Jurado Evaluador y Asesor:</span>
                          <span className="text-[10px] font-mono text-unt-blue">
                            Requisitos físicos: {reqsCompletos}/6
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          <div><strong>Presidente:</strong> {item.juradoPresidente}</div>
                          <div><strong>Secretario:</strong> {item.juradoSecretario}</div>
                          <div><strong>Vocal:</strong> {item.juradoVocal} · <strong>Asesor:</strong> {item.asesor}</div>
                        </div>
                      </div>

                      <div className="lg:col-span-7 p-3 rounded-xl bg-blue-50/40 border border-blue-200/70 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-unt-blue">
                            Ubicación: {item.ubicacionFisica}
                          </span>
                          <span className="font-mono text-slate-500">
                            Estación actual: {estMeta.responsable}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          <strong>Anotación de Srta. Celia:</strong> {item.notasSecretaria}
                        </p>
                        {item.esCuelloBotellaExterno && item.motivoRetrasoExterno && (
                          <p className="text-[11px] font-bold text-rose-700">
                            ⚠️ Cuello de botella externo: {item.motivoRetrasoExterno}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          APARTADO 2: CHAT DE ANUNCIOS, FLYERS Y CHECKS DE CORREOS (TESISTAS / JURADO)
         ===================================================================== */}
      {tab === 'despacho' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* COLUMNA IZQUIERDA (7 cols): CHAT DE ANUNCIOS + SUBIR/GENERAR FLYER */}
          <div className="lg:col-span-7 space-y-4">
            {/* Barra de Estado del Correo Vinculado por la Srta. Celia */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-unt-blue flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>Correo Emisor de Secretaría (Srta. Celia)</span>
                    {emailStatus.configured ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        ✓ Envío Directo SMTP Activo ({emailStatus.senderEmail})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                        Modo Gmail Web Asistido Activo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Seleccione a la derecha las casillas de check [✓] de los Tesistas y del Jurado a quienes llegará el flyer o anuncio.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalCorreoAbierto(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer shrink-0"
              >
                <Settings className="w-3.5 h-3.5 text-unt-blue" />
                <span>Vincular Correo Emisor</span>
              </button>
            </div>

            {/* Redactor Tipo Chat con Adjunto de Flyer */}
            <form
              onSubmit={handleEnviarAnuncioYFlyer}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-unt-blue" />
                  <span>Redactar Anuncio / Alerta o Subir Flyer de Sustentación</span>
                </h3>

                {/* Plantillas Rápidas en 1 Clic */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      const primero = seguimientos[0];
                      if (primero) prepararDespachoParaTesistaYJurado(primero);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-unt-blue font-bold cursor-pointer"
                  >
                    + Plantilla Sustentación Jueves
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAsuntoChat('Recordatorio de Revisión de Tesis — Jurado Evaluador Ing. Industrial UNT');
                      setMensajeChat(
                        'Estimados Ingenieros miembros del Jurado Evaluador:\n\nDesde la Secretaría de la Escuela Profesional de Ingeniería Industrial les recordamos cordialmente remitir su dictamen de revisión del borrador de tesis asignado, a fin de evitar cuellos de botella y proceder con la programación del día jueves (11:00 a.m. a 1:00 p.m.).\n\nMuchas gracias por su gentil atención.\nSrta. Celia — Secretaría Académica.'
                      );
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold cursor-pointer"
                  >
                    + Alerta a Jurado (Cuello de Botella)
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asunto del Correo:</label>
                  <input
                    type="text"
                    required
                    value={asuntoChat}
                    onChange={(e) => setAsuntoChat(e.target.value)}
                    placeholder="Ej: Citación a Sustentación Pública de Tesis — Jueves 11:00 a.m."
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Texto del Anuncio / Alerta para los Correos Seleccionados:
                  </label>
                  <textarea
                    rows={4}
                    value={mensajeChat}
                    onChange={(e) => setMensajeChat(e.target.value)}
                    placeholder="Escriba aquí el anuncio, alerta o citación que llegará al correo de los tesistas e ingenieros marcados con check [✓]..."
                    className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white leading-relaxed"
                  />
                </div>

                {/* Zona para Subir Imagen/Flyer o Autogenerar Flyer UNT */}
                <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-unt-blue" />
                      <span>Flyer / Imagen Adjunta:</span>
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-unt-blue text-unt-blue font-bold text-[11px] cursor-pointer shadow-2xs">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Subir Imagen / Flyer desde PC</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSubirFlyerImagen}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          const seg = seguimientos[0];
                          if (!seg) return;
                          const url = generarFlyerSustentacionCanvas({
                            tesistaNombre: seg.tesistaNombre,
                            tituloTesis: seg.tituloTesis,
                            fecha: seg.fechaSustentacionProgramada || '2026-11-26',
                            horario: '11:00 a.m. - 01:00 p.m.',
                            presidente: seg.juradoPresidente,
                            secretario: seg.juradoSecretario,
                            vocal: seg.juradoVocal,
                            asesor: seg.asesor
                          });
                          setFlyerPreview(url);
                          setFlyerNombre(`Flyer_${seg.codigoMatricula}.png`);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#082F64] text-amber-300 font-bold text-[11px] cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Autogenerar Flyer Oficial UNT</span>
                      </button>
                    </div>
                  </div>

                  {flyerPreview && (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 p-2">
                      <img
                        src={flyerPreview}
                        alt="Vista previa del Flyer"
                        className="max-h-64 w-auto mx-auto rounded-lg object-contain"
                      />
                      <div className="flex items-center justify-between text-[11px] text-white pt-2 px-2">
                        <span className="font-mono truncate">{flyerNombre || 'Flyer_UNT.png'}</span>
                        <div className="flex items-center gap-2">
                          <a
                            href={flyerPreview}
                            download={flyerNombre || 'Flyer_Sustentacion_UNT.png'}
                            className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-bold"
                          >
                            Descargar Flyer
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setFlyerPreview('');
                              setFlyerNombre('');
                            }}
                            className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold cursor-pointer"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resumen de Checks Seleccionados y Botón de Envío */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-slate-600">
                    Destinatarios marcados con check [✓]:{' '}
                    <strong className="text-unt-blue">{tesistasChecks.length} tesista(s)</strong> y{' '}
                    <strong className="text-emerald-700">{juradoChecks.length} ingeniero(s) del jurado</strong>
                  </div>

                  <button
                    type="submit"
                    disabled={enviandoCorreo}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {enviandoCorreo
                        ? 'Enviando a correos...'
                        : `Enviar a Correos Seleccionados (${tesistasChecks.length + juradoChecks.length})`}
                    </span>
                  </button>
                </div>
              </div>
            </form>

            {/* Historial Tipo Chat de Anuncios y Flyers Enviados por la Srta. Celia */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Historial del Chat de Anuncios y Flyers Despachados ({historialChat.length})
              </h4>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {historialChat.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <span className="font-bold text-unt-blue">{msg.asunto}</span>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        {msg.fechaHora}
                      </span>
                    </div>

                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">{msg.mensaje}</p>

                    {msg.flyerDataUrl && (
                      <div className="pt-1">
                        <img
                          src={msg.flyerDataUrl}
                          alt="Flyer enviado"
                          className="max-h-48 rounded-xl border border-slate-300"
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                      {msg.tesistasDestinatarios.map((t) => (
                        <span
                          key={t.correo}
                          className="px-2 py-0.5 rounded-full bg-blue-100 text-unt-blue font-bold"
                        >
                          🎓 Tesista: {t.nombre} ({t.correo})
                        </span>
                      ))}
                      {msg.juradoDestinatarios.map((j) => (
                        <span
                          key={j.correo}
                          className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold"
                        >
                          ⚖️ Jurado: {j.nombre} ({j.correo})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA (5 cols): LOS 2 APARTADOS CON CASILLAS DE CHECK [✓] */}
          <div className="lg:col-span-5 space-y-4">
            {/* APARTADO 1: CORREOS DE TESISTAS CON CASILLAS DE CHECK */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-unt-blue" />
                    <span>1. Apartado de Correos: Tesistas</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Marque con check [✓] al tesista o tesistas que recibirán el flyer/anuncio.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() =>
                      setTesistasChecks(seguimientos.map((s) => s.tesistaCorreo.toLowerCase()))
                    }
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setTesistasChecks([])}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
                  >
                    Ninguno
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={busquedaTesistaCheck}
                onChange={(e) => setBusquedaTesistaCheck(e.target.value)}
                placeholder="Filtrar tesista por nombre o correo..."
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
                      <label
                        key={s.id}
                        className={`flex items-center justify-between p-2.5 text-xs cursor-pointer transition-colors ${
                          marcado ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTesistasChecks((prev) => Array.from(new Set([...prev, correoLow])));
                              } else {
                                setTesistasChecks((prev) => prev.filter((c) => c !== correoLow));
                              }
                            }}
                            className="w-4 h-4 rounded text-unt-blue cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{s.tesistaNombre}</div>
                            <div className="font-mono text-[11px] text-unt-blue truncate">
                              {s.tesistaCorreo}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                          EST-0{s.estacionActual}
                        </span>
                      </label>
                    );
                  })}
              </div>

              {/* Agregar Rápido Correo de Tesista */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={nuevoTesistaNombre}
                  onChange={(e) => setNuevoTesistaNombre(e.target.value)}
                  placeholder="Nombre del tesista"
                  className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
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
                    if (!nuevoTesistaCorreo.includes('@') || !nuevoTesistaNombre.trim()) return;
                    const nuevo: SeguimientoTesisItem = {
                      id: `seg-${Date.now()}`,
                      codigoMatricula: `1021${Math.floor(100000 + Math.random() * 900000)}`,
                      tesistaNombre: nuevoTesistaNombre.trim(),
                      tesistaCorreo: nuevoTesistaCorreo.trim().toLowerCase(),
                      tituloTesis: 'Tesis en seguimiento — Ing. Industrial UNT',
                      lineaInvestigacion: 'Producción y Operaciones',
                      asesor: directorioJurado[0]?.nombre || 'Por asignar',
                      juradoPresidente: directorioJurado[0]?.nombre || 'Por asignar',
                      juradoSecretario: directorioJurado[1]?.nombre || 'Por asignar',
                      juradoVocal: directorioJurado[2]?.nombre || 'Por asignar',
                      estacionActual: 1,
                      fechaIngresoEstacion: new Date().toISOString().slice(0, 10),
                      fechaInicioTramite: new Date().toISOString().slice(0, 10),
                      ubicacionFisica: 'Secretaría de Escuela (Srta. Celia)',
                      esCuelloBotellaExterno: false,
                      notasSecretaria: 'Registrado en directorio de correos de tesistas.',
                      requisitosFisicos: {
                        futFisico: true,
                        voucherTupa: true,
                        reporteTurnitin: true,
                        constanciaPracticas: true,
                        resolucionProyecto: true,
                        tresBorradoresJurado: false
                      }
                    };
                    const actualizados = [nuevo, ...seguimientos];
                    setSeguimientos(actualizados);
                    await logisticaSecretariaService.saveSeguimientos(actualizados);
                    setTesistasChecks((prev) => [...prev, nuevo.tesistaCorreo]);
                    setNuevoTesistaNombre('');
                    setNuevoTesistaCorreo('');
                    agregarToast('success', 'Tesista Agregado', `Se agregó y marcó a ${nuevo.tesistaNombre}.`);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-unt-blue text-white font-bold text-xs cursor-pointer shrink-0"
                >
                  + Añadir
                </button>
              </div>
            </div>

            {/* APARTADO 2: CORREOS DEL JURADO (INGENIEROS UNT) CON CASILLAS DE CHECK */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    <span>2. Apartado de Correos: Jurado (Ingenieros)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Marque con check [✓] a los ingenieros del jurado que recibirán el mensaje.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() =>
                      setJuradoChecks(directorioJurado.map((j) => j.correo.toLowerCase()))
                    }
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setJuradoChecks([])}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
                  >
                    Ninguno
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={busquedaJuradoCheck}
                onChange={(e) => setBusquedaJuradoCheck(e.target.value)}
                placeholder="Filtrar ingeniero por nombre, especialidad o correo..."
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              />

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {directorioJurado
                  .filter(
                    (ing) =>
                      !busquedaJuradoCheck.trim() ||
                      ing.nombre.toLowerCase().includes(busquedaJuradoCheck.toLowerCase()) ||
                      ing.correo.toLowerCase().includes(busquedaJuradoCheck.toLowerCase()) ||
                      ing.especialidad.toLowerCase().includes(busquedaJuradoCheck.toLowerCase())
                  )
                  .map((ing) => {
                    const correoLow = ing.correo.toLowerCase();
                    const marcado = juradoChecks.includes(correoLow);
                    return (
                      <label
                        key={ing.id}
                        className={`flex items-center justify-between p-2.5 text-xs cursor-pointer transition-colors ${
                          marcado ? 'bg-emerald-50/80' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setJuradoChecks((prev) => Array.from(new Set([...prev, correoLow])));
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
                        </div>
                        <button
                          type="button"
                          onClick={async (ev) => {
                            ev.preventDefault();
                            const filtrados = directorioJurado.filter((x) => x.id !== ing.id);
                            setDirectorioJurado(filtrados);
                            await logisticaSecretariaService.saveDirectorioJurado(filtrados);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Retirar ingeniero de la lista"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </label>
                    );
                  })}
              </div>

              {/* Agregar Nuevo Ingeniero al Directorio del Jurado */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={nuevoIngNombre}
                  onChange={(e) => setNuevoIngNombre(e.target.value)}
                  placeholder="Ing. Nombre y Apellidos"
                  className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
                <input
                  type="email"
                  value={nuevoIngCorreo}
                  onChange={(e) => setNuevoIngCorreo(e.target.value)}
                  placeholder="ingeniero@unitru.edu.pe"
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!nuevoIngCorreo.includes('@') || !nuevoIngNombre.trim()) return;
                    const nuevoIng: IngenieroJuradoItem = {
                      id: `ing-${Date.now()}`,
                      nombre: nuevoIngNombre.trim(),
                      correo: nuevoIngCorreo.trim().toLowerCase(),
                      especialidad: nuevoIngEsp,
                      categoria: 'Docente UNT',
                      activo: true
                    };
                    const actualizados = [nuevoIng, ...directorioJurado];
                    setDirectorioJurado(actualizados);
                    await logisticaSecretariaService.saveDirectorioJurado(actualizados);
                    setJuradoChecks((prev) => [...prev, nuevoIng.correo]);
                    setNuevoIngNombre('');
                    setNuevoIngCorreo('');
                    agregarToast('success', 'Ingeniero Agregado', `Se incorporó a ${nuevoIng.nombre} al directorio del jurado.`);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs cursor-pointer shrink-0"
                >
                  + Añadir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          APARTADO 3: CALENDARIO COMPACTO DE SUSTENTACIONES (JUEVES 11:00 - 1:00 PM)
         ===================================================================== */}
      {tab === 'calendario' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* COLUMNA IZQUIERDA (5 cols): CALENDARIO COMPACTO FÁCIL DE LEER (JUEVES RESALTADOS) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 h-fit">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-unt-blue">
                  Reemplazo del Calendario Físico Anual
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Calendario Compacto (Jueves · 11:00 a.m. a 1:00 p.m.)
                </h3>
              </div>

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
                <span className="text-xs font-bold text-slate-800 px-2 min-w-[115px] text-center">
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

            {/* Cuadrícula Compacta del Mes */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
              {['Dom', 'Lun', 'Mar', 'Mié', 'JUE', 'Vie', 'Sáb'].map((d) => (
                <div
                  key={d}
                  className={`py-1.5 font-bold rounded-md ${
                    d === 'JUE'
                      ? 'bg-[#082F64] text-amber-300'
                      : 'text-slate-400'
                  }`}
                >
                  {d}
                </div>
              ))}

              {diasDelMes.map((celda, idx) => {
                if (!celda.dia) {
                  return <div key={`empty-${idx}`} className="h-11" />;
                }
                const programada = sustentaciones.find((s) => s.fecha === celda.fechaIso);
                const seleccionada = fechaJuevesActiva === celda.fechaIso;

                return (
                  <button
                    key={celda.fechaIso}
                    type="button"
                    onClick={() => seleccionarFechaCalendario(celda.fechaIso)}
                    className={`h-11 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                      seleccionada
                        ? 'bg-[#082F64] text-white border-[#082F64] ring-2 ring-amber-400 font-black'
                        : programada
                        ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                        : celda.esJueves
                        ? 'bg-blue-50/80 border-blue-200 text-unt-blue font-bold hover:bg-blue-100'
                        : 'bg-slate-50/50 border-slate-100 text-slate-400 hover:bg-slate-100'
                    }`}
                    title={
                      programada
                        ? `Jueves ${celda.fechaIso}: ${programada.tesistaNombre} (11:00 a.m. - 1:00 p.m.)`
                        : celda.esJueves
                        ? `Jueves disponible para sustentación (11:00 a.m. - 1:00 p.m.)`
                        : celda.fechaIso
                    }
                  >
                    <span className="text-xs leading-none">{celda.dia}</span>
                    {programada ? (
                      <span className="text-[8px] font-bold truncate max-w-[42px] mt-0.5 px-1 rounded bg-emerald-600 text-white">
                        {programada.tesistaNombre.split(' ')[0]}
                      </span>
                    ) : celda.esJueves ? (
                      <span className="text-[8px] opacity-75 mt-0.5">11-1</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-blue-100 border border-blue-300 inline-block" />
                Jueves disponible (11:00 - 1:00)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-200 border border-amber-400 inline-block" />
                Sustentación agendada
              </span>
            </div>

            {/* Lista Rápida de Jueves Agendados */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-800">
                Sustentaciones Anotadas ({sustentaciones.length})
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {sustentaciones.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => seleccionarFechaCalendario(s.fecha)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between gap-2 ${
                      s.fecha === fechaJuevesActiva
                        ? 'border-unt-blue bg-blue-50/70'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{s.tesistaNombre}</div>
                      <div className="text-[10px] font-mono text-unt-blue">
                        Jueves {s.fecha} · {s.horario}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminarSustentacionFecha(s.fecha);
                      }}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                      title="Liberar este jueves"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA (7 cols): ANOTAR TESISTA Y JURADO EN EL JUEVES SELECCIONADO */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-unt-blue">
                  Fecha Seleccionada: {fechaJuevesActiva}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Anotar Sustentación y Jurado Evaluador (11:00 a.m. – 1:00 p.m.)
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
                Horario Oficial: 11:00 a.m. - 01:00 p.m.
              </span>
            </div>

            <form onSubmit={handleGuardarSustentacionJueves} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Elegir Tesista desde Seguimiento:
                  </label>
                  <select
                    value={calTesistaId}
                    onChange={(e) => cargarTesistaEnCalendario(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
                  >
                    <option value="">-- O escribir manualmente abajo --</option>
                    {seguimientos.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.tesistaNombre} ({s.codigoMatricula})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Horario del Jueves:
                  </label>
                  <input
                    type="text"
                    value={calHorario}
                    onChange={(e) => setCalHorario(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre del Tesista:</label>
                  <input
                    type="text"
                    required
                    value={calTesistaNombre}
                    onChange={(e) => setCalTesistaNombre(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código de Matrícula:</label>
                  <input
                    type="text"
                    value={calTesistaCodigo}
                    onChange={(e) => setCalTesistaCodigo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo del Tesista:</label>
                  <input
                    type="email"
                    value={calTesistaCorreo}
                    onChange={(e) => setCalTesistaCorreo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título de la Tesis:</label>
                <textarea
                  rows={2}
                  required
                  value={calTituloTesis}
                  onChange={(e) => setCalTituloTesis(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              {/* Selección de Quiénes serán el Jurado Evaluador */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900">
                  Designación de los Miembros del Jurado para este Jueves:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Presidente del Jurado:</label>
                    <input
                      list="lista-ingenieros-unt"
                      value={calPresidente}
                      onChange={(e) => setCalPresidente(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Secretario del Jurado:</label>
                    <input
                      list="lista-ingenieros-unt"
                      value={calSecretario}
                      onChange={(e) => setCalSecretario(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vocal del Jurado:</label>
                    <input
                      list="lista-ingenieros-unt"
                      value={calVocal}
                      onChange={(e) => setCalVocal(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Docente Asesor:</label>
                    <input
                      list="lista-ingenieros-unt"
                      value={calAsesor}
                      onChange={(e) => setCalAsesor(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
                <datalist id="lista-ingenieros-unt">
                  {directorioJurado.map((ing) => (
                    <option key={ing.id} value={ing.nombre} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const tempSeg: SeguimientoTesisItem = {
                      id: calTesistaId || 'temp',
                      codigoMatricula: calTesistaCodigo,
                      tesistaNombre: calTesistaNombre,
                      tesistaCorreo: calTesistaCorreo,
                      tituloTesis: calTituloTesis,
                      lineaInvestigacion: 'Producción y Operaciones',
                      asesor: calAsesor,
                      juradoPresidente: calPresidente,
                      juradoSecretario: calSecretario,
                      juradoVocal: calVocal,
                      estacionActual: 4,
                      fechaIngresoEstacion: fechaJuevesActiva,
                      fechaInicioTramite: fechaJuevesActiva,
                      ubicacionFisica: 'Programado',
                      esCuelloBotellaExterno: false,
                      notasSecretaria: '',
                      fechaSustentacionProgramada: fechaJuevesActiva,
                      requisitosFisicos: {
                        futFisico: true,
                        voucherTupa: true,
                        reporteTurnitin: true,
                        constanciaPracticas: true,
                        resolucionProyecto: true,
                        tresBorradoresJurado: true
                      }
                    };
                    prepararDespachoParaTesistaYJurado(tempSeg, fechaJuevesActiva);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Generar Flyer y Enviar Correo a este Tesista y Jurado</span>
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] text-white font-bold shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  <span>Guardar en el Calendario ({fechaJuevesActiva})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          APARTADO 4: PREGUNTAS FRECUENTES EDITABLES POR SECRETARÍA
         ===================================================================== */}
      {tab === 'faqs' && <PreguntasFrecuentesPage />}

      {/* MODAL PARA ANOTAR / EDITAR SEGUIMIENTO LOGÍSTICO DE UN TESISTA */}
      {modalSeguimientoAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setModalSeguimientoAbierto(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#082F64] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editandoSeg ? 'Actualizar Seguimiento Logístico de Tesis' : 'Anotar Nuevo Tesista en Seguimiento'}
              </h3>
              <button
                type="button"
                onClick={() => setModalSeguimientoAbierto(false)}
                className="p-1 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarSeguimiento} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre del Tesista:</label>
                  <input
                    type="text"
                    required
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Apellidos y Nombres"
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código de Matrícula:</label>
                  <input
                    type="text"
                    required
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    placeholder="1021400..."
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo del Tesista:</label>
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
                <label className="block font-bold text-slate-700 mb-1">Título de la Tesis:</label>
                <input
                  type="text"
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estación Logística Actual:</label>
                  <select
                    value={formEstacion}
                    onChange={(e) => setFormEstacion(Number(e.target.value) as EstacionLogisticaId)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-slate-50 font-bold"
                  >
                    {ESTACIONES_LOGISTICAS.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.codigo}: {e.nombre} ({e.responsable})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ubicación Física / Derivación:</label>
                  <input
                    type="text"
                    value={formUbicacion}
                    onChange={(e) => setFormUbicacion(e.target.value)}
                    placeholder="Ej: Derivado a Decanato con Oficio N°..."
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Presidente del Jurado:</label>
                  <input
                    list="lista-ingenieros-unt"
                    value={formPresidente}
                    onChange={(e) => setFormPresidente(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Secretario del Jurado:</label>
                  <input
                    list="lista-ingenieros-unt"
                    value={formSecretario}
                    onChange={(e) => setFormSecretario(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vocal del Jurado:</label>
                  <input
                    list="lista-ingenieros-unt"
                    value={formVocal}
                    onChange={(e) => setFormVocal(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Docente Asesor:</label>
                  <input
                    list="lista-ingenieros-unt"
                    value={formAsesor}
                    onChange={(e) => setFormAsesor(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Checklist de Requisitos Físicos Entregados */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block">
                  Checklist de Documentos Físicos Verificados en Escuela:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'futFisico', label: 'FUT Físico' },
                    { key: 'voucherTupa', label: 'Voucher TUPA' },
                    { key: 'reporteTurnitin', label: 'Turnitin (<20%)' },
                    { key: 'constanciaPracticas', label: 'Const. Prácticas' },
                    { key: 'resolucionProyecto', label: 'Res. Proyecto' },
                    { key: 'tresBorradoresJurado', label: '3 Ejemplares Jurado' }
                  ].map((r) => (
                    <label key={r.key} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formReqs as any)[r.key]}
                        onChange={(e) =>
                          setFormReqs((prev) => ({ ...prev, [r.key]: e.target.checked }))
                        }
                        className="rounded text-unt-blue"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Alerta de Cuello de Botella Externo */}
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                <label className="flex items-center gap-2 font-bold text-rose-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formCuelloExterno}
                    onChange={(e) => setFormCuelloExterno(e.target.checked)}
                    className="rounded text-rose-600"
                  />
                  <span>⚠️ Marcar como Retenido en Cuello de Botella Externo (Decanato / Jurado / URAA)</span>
                </label>
                {formCuelloExterno && (
                  <input
                    type="text"
                    value={formMotivoCuello}
                    onChange={(e) => setFormMotivoCuello(e.target.value)}
                    placeholder="Detalle dónde está retenido fuera de la Escuela (ej. Falta firma de Decanato / Vocal de Jurado)..."
                    className="w-full p-2 rounded-lg border border-rose-300 bg-white"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Anotaciones de Seguimiento (Srta. Celia):
                </label>
                <textarea
                  rows={2}
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
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
                  Guardar Seguimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA VINCULAR CORREO EMISOR DE LA SRTA. CELIA */}
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
              <h3 className="text-sm font-bold">Vincular Correo de Secretaría para Despacho</h3>
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
                    appPassword: cfgPassInput
                  });
                  setEmailStatus(st);
                  setCfgPassInput('');
                  setModalCorreoAbierto(false);
                  agregarToast(
                    'success',
                    'Correo Vinculado',
                    st.configured
                      ? `Envío automático SMTP activado para ${st.senderEmail}.`
                      : `Correo ${st.senderEmail} guardado en modo Gmail Web Asistido.`
                  );
                } catch (err: any) {
                  agregarToast('error', 'Error', err.message);
                }
              }}
              className="p-5 space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Correo Emisor (@unitru.edu.pe o @gmail.com):
                </label>
                <input
                  type="email"
                  required
                  value={cfgEmailInput}
                  onChange={(e) => setCfgEmailInput(e.target.value)}
                  placeholder="secretaria.industrial@unitru.edu.pe"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre Visible en el Remitente:
                </label>
                <input
                  type="text"
                  required
                  value={cfgNameInput}
                  onChange={(e) => setCfgNameInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Contraseña de Aplicación de Google (16 letras, opcional):
                </label>
                <input
                  type="password"
                  value={cfgPassInput}
                  onChange={(e) => setCfgPassInput(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx (dejar vacío para usar Gmail Web)"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Si ingresa una Contraseña de Aplicación de Google (<a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-unt-blue underline font-bold">myaccount.google.com/apppasswords</a>), el servidor enviará el correo y el flyer de forma directa en 1 clic. Si lo deja vacío, abrirá Gmail Web con todos los correos ya rellenados.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCorreoAbierto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#082F64] text-white font-bold cursor-pointer"
                >
                  Guardar Correo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
