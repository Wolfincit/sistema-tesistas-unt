import React, { useState, useMemo, useEffect } from 'react';
import {
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
  Sparkles
} from 'lucide-react';

const ETAPAS_SIMPLES: { id: EstacionLogisticaId; nombre: string; color: string }[] = [
  { id: 1, nombre: '1. Trámite Recibido', color: 'bg-slate-700 text-white' },
  { id: 2, nombre: '2. En Decanato / Jurado', color: 'bg-amber-500 text-slate-950' },
  { id: 3, nombre: '3. En Revisión de Tesis', color: 'bg-blue-600 text-white' },
  { id: 4, nombre: '4. Listo para Sustentar', color: 'bg-emerald-600 text-white' }
];

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
  const [mostrarOpcionesAvanzadasSmtp, setMostrarOpcionesAvanzadasSmtp] = useState<boolean>(false);

  useEffect(() => {
    logisticaSecretariaService.getEmailStatus().then((st) => {
      setEmailStatus(st);
      if (st.senderEmail) setCfgEmailInput(st.senderEmail);
      if (st.senderName) setCfgNameInput(st.senderName);
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
  // 1. SEGUIMIENTO LIMPIO Y VISUAL (BLOC DE APUNTES DE LA SRTA. CELIA)
  // =========================================================
  const [busquedaSeg, setBusquedaSeg] = useState<string>('');
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
  const [formNotas, setFormNotas] = useState<string>('');

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
      setFormNotas('');
    }
    setModalSeguimientoAbierto(true);
  };

  const handleGuardarSeguimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formCorreo.trim()) return;

    const nuevo: SeguimientoTesisItem = {
      id: editandoSeg ? editandoSeg.id : `seg-${Date.now()}`,
      codigoMatricula: formCodigo.trim() || `1021${Math.floor(100000 + Math.random() * 900000)}`,
      tesistaNombre: formNombre.trim(),
      tesistaCorreo: formCorreo.trim().toLowerCase(),
      tituloTesis: formTitulo.trim() || 'Tesis en seguimiento',
      lineaInvestigacion: editandoSeg?.lineaInvestigacion || 'Ingeniería Industrial',
      asesor: formAsesor.trim(),
      juradoPresidente: formPresidente.trim(),
      juradoSecretario: formSecretario.trim(),
      juradoVocal: formVocal.trim(),
      estacionActual: formEstacion,
      fechaIngresoEstacion: new Date().toISOString().slice(0, 10),
      fechaInicioTramite: editandoSeg?.fechaInicioTramite || new Date().toISOString().slice(0, 10),
      ubicacionFisica: 'En seguimiento',
      esCuelloBotellaExterno: false,
      notasSecretaria: formNotas.trim(),
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
    agregarToast(
      'success',
      editandoSeg ? 'Guardado' : 'Tesista Agregado',
      `${nuevo.tesistaNombre} quedó actualizado en Seguimiento y en la lista de Correos.`
    );
  };

  const handleCambiarEtapaDirecto = async (id: string, nuevaEtapa: EstacionLogisticaId) => {
    const actualizados = seguimientos.map((s) =>
      s.id === id ? { ...s, estacionActual: nuevaEtapa } : s
    );
    setSeguimientos(actualizados);
    await logisticaSecretariaService.saveSeguimientos(actualizados);
  };

  const handleActualizarNotaDirecto = async (id: string, nuevaNota: string) => {
    const actualizados = seguimientos.map((s) =>
      s.id === id ? { ...s, notasSecretaria: nuevaNota } : s
    );
    setSeguimientos(actualizados);
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
      .filter((ing) =>
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

  const handleEnviarAnuncioYFlyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tesistasChecks.length === 0 && juradoChecks.length === 0) {
      agregarToast('warning', 'Falta seleccionar correos', 'Marque con check [✓] al menos un correo a la derecha.');
      return;
    }
    if (!mensajeChat.trim() && !flyerPreview) {
      agregarToast('warning', 'Falta el flyer o mensaje', 'Suba su flyer o escriba un anuncio antes de enviar.');
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
        mensaje: mensajeChat || 'Flyer adjunto.',
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
        agregarToast('success', 'Enviado', res.message);
      } else {
        const toParam = encodeURIComponent(res.recipients.join(','));
        const suParam = encodeURIComponent(asuntoChat);
        const bodyParam = encodeURIComponent(mensajeChat);
        window.open(
          `https://mail.google.com/mail/?view=cm&fs=1&to=${toParam}&su=${suParam}&body=${bodyParam}`,
          '_blank',
          'noopener,noreferrer'
        );
        agregarToast('success', 'Listo en Gmail', `Se abrió Gmail con los ${res.recipientsCount} correos ya cargados.`);
      }
    } catch (err: any) {
      agregarToast('error', 'Error', err.message);
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

  const seguimientosFiltrados = useMemo(() => {
    if (!busquedaSeg.trim()) return seguimientos;
    const q = busquedaSeg.toLowerCase();
    return seguimientos.filter(
      (s) =>
        s.tesistaNombre.toLowerCase().includes(q) ||
        s.codigoMatricula.toLowerCase().includes(q) ||
        s.tituloTesis.toLowerCase().includes(q)
    );
  }, [seguimientos, busquedaSeg]);

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
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'seguimiento'
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
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'instrucciones'
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
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'despacho'
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
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'calendario'
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
          1. SEGUIMIENTO DE TESIS (LIMPIO, VISUAL Y CON APUNTES DIRECTOS)
         ===================================================================== */}
      {tab === 'seguimiento' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busquedaSeg}
                onChange={(e) => setBusquedaSeg(e.target.value)}
                placeholder="Buscar tesista por nombre, código o título..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              />
            </div>

            <button
              type="button"
              onClick={() => abrirModalSeguimiento()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] text-white text-xs font-bold shadow-xs cursor-pointer w-fit"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>+ Agregar Tesista</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {seguimientosFiltrados.map((item) => {
              const etapaActual = item.estacionActual > 4 ? 4 : item.estacionActual;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  {/* Datos Principales del Tesista */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{item.tesistaNombre}</h3>
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

                  {/* Barra de Etapa en 1 Clic (4 pasos simples) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {ETAPAS_SIMPLES.map((et) => {
                      const activo = etapaActual === et.id;
                      const completado = etapaActual > et.id;
                      return (
                        <button
                          key={et.id}
                          type="button"
                          onClick={() => handleCambiarEtapaDirecto(item.id, et.id)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer truncate ${
                            activo
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

                  {/* Cuadro de Apuntes Directos de la Srta. Celia */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Apuntes de seguimiento:
                    </label>
                    <textarea
                      rows={2}
                      value={item.notasSecretaria}
                      onChange={(e) => handleActualizarNotaDirecto(item.id, e.target.value)}
                      placeholder="Escribe aquí tus apuntes sobre cómo va esta tesis..."
                      className="w-full p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  {/* Botones Rápidos hacia Calendario o Flyers */}
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
                          className={`flex items-center justify-between p-2.5 text-xs ${
                            marcado ? 'bg-blue-50/80' : 'hover:bg-slate-50'
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
                      if (!nuevoTesistaCorreo.includes('@') || !nuevoTesistaNombre.trim()) return;
                      const nuevo: SeguimientoTesisItem = {
                        id: `seg-${Date.now()}`,
                        codigoMatricula: `1021${Math.floor(100000 + Math.random() * 900000)}`,
                        tesistaNombre: nuevoTesistaNombre.trim(),
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
                          className={`flex items-center justify-between p-2.5 text-xs ${
                            marcado ? 'bg-emerald-50/80' : 'hover:bg-slate-50'
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
                      if (!nuevoIngCorreo.includes('@') || !nuevoIngNombre.trim()) return;
                      const nuevoIng: IngenieroJuradoItem = {
                        id: `ing-${Date.now()}`,
                        nombre: nuevoIngNombre.trim(),
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
                  className={`py-1.5 font-bold rounded-md ${
                    d === 'JUE' ? 'bg-[#082F64] text-amber-300' : 'text-slate-400'
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
                    className={`h-10 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      seleccionada
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
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between gap-2 ${
                    s.fecha === fechaJuevesActiva
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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

      {/* MODAL SIMPLE EN 1 CLIC PARA VINCULAR CORREO DE SECRETARÍA */}
      {modalCorreoAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setModalCorreoAbierto(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#082F64] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Vincular Correo de Secretaría</h3>
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
                  agregarToast('success', 'Correo Vinculado', `Quedó vinculado ${st.senderEmail}.`);
                } catch (err: any) {
                  agregarToast('error', 'Error', err.message);
                }
              }}
              className="p-5 space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tu Correo (@unitru.edu.pe o @gmail.com):
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

              <button
                type="button"
                onClick={() => setMostrarOpcionesAvanzadasSmtp(!mostrarOpcionesAvanzadasSmtp)}
                className="text-[11px] text-unt-blue font-semibold hover:underline cursor-pointer"
              >
                {mostrarOpcionesAvanzadasSmtp
                  ? 'Ocultar opción avanzada SMTP'
                  : '¿Tienes clave de aplicación SMTP? (Opcional)'}
              </button>

              {mostrarOpcionesAvanzadasSmtp && (
                <div>
                  <input
                    type="password"
                    value={cfgPassInput}
                    onChange={(e) => setCfgPassInput(e.target.value)}
                    placeholder="Clave de 16 letras (opcional)"
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono"
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
