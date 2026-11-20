import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsultaTesista } from '../../types';
import { 
  MessageSquare, 
  Mic, 
  Send, 
  CheckCircle2, 
  Clock, 
  User, 
  Volume2, 
  Play, 
  Pause, 
  HelpCircle, 
  Sparkles, 
  AlertCircle,
  Megaphone,
  X,
  Radio,
  FileText,
  Trash2
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { audioPlayerService, AudioPlaybackHandle } from '../../services/audioPlayerService';

export const ConsultasSecretaria: React.FC = () => {
  const { consultas, responderConsulta, eliminarConsulta, emitirComunicado, agregarFaq } = useApp();
  const [consultaAEliminar, setConsultaAEliminar] = useState<ConsultaTesista | null>(null);
  const [consultaSeleccionadaId, setConsultaSeleccionadaId] = useState<string | null>(
    consultas.length > 0 ? consultas[0].id : null
  );
  const [filtro, setFiltro] = useState<'TODAS' | 'Pendiente' | 'Resuelta'>('Pendiente');
  const [respuestaTexto, setRespuestaTexto] = useState<string>('');
  
  // Grabación de audio real para respuesta privada
  const [grabandoAudio, setGrabandoAudio] = useState<boolean>(false);
  const [audioGrabadoDuracion, setAudioGrabadoDuracion] = useState<string | null>(null);
  const [audioGrabadoUrl, setAudioGrabadoUrl] = useState<string | null>(null);
  const [audioGrabadoBlob, setAudioGrabadoBlob] = useState<Blob | null>(null);
  const [segundosGrabacion, setSegundosGrabacion] = useState<number>(0);
  const grabacionRef = useRef<{ stop: () => Promise<{ blob: Blob | null; url: string; duracionStr: string }> } | null>(null);
  const intervalGrabacionRef = useRef<any>(null);

  // Reproducción de audio real
  const [reproduciendoAudioId, setReproduciendoAudioId] = useState<string | null>(null);
  const playbackHandleRef = useRef<AudioPlaybackHandle | null>(null);

  const [enviando, setEnviando] = useState<boolean>(false);

  // Modal para Emitir Comunicado General
  const [modalComunicadoAbierto, setModalComunicadoAbierto] = useState<boolean>(false);
  const [comunicadoTitulo, setComunicadoTitulo] = useState<string>('');
  const [comunicadoMensaje, setComunicadoMensaje] = useState<string>('');
  const [grabandoComunicado, setGrabandoComunicado] = useState<boolean>(false);
  const [comunicadoAudioUrl, setComunicadoAudioUrl] = useState<string | null>(null);
  const [comunicadoAudioBlob, setComunicadoAudioBlob] = useState<Blob | null>(null);
  const [comunicadoAudioDuracion, setComunicadoAudioDuracion] = useState<string | null>(null);
  const [comunicadoSegundos, setComunicadoSegundos] = useState<number>(0);
  const grabacionComunicadoRef = useRef<{ stop: () => Promise<{ blob: Blob | null; url: string; duracionStr: string }> } | null>(null);
  const intervalComunicadoRef = useRef<any>(null);

  const consultasFiltradas = consultas.filter((c) => {
    if (filtro === 'TODAS') return true;
    if (filtro === 'Pendiente') return c.estado === 'Pendiente' || c.estado === 'Reabierta';
    return c.estado === 'Resuelta' || c.estado === 'Cerrada';
  });

  const consultaActiva = consultas.find((c) => c.id === consultaSeleccionadaId) || consultasFiltradas[0];

  // Grabación de audio real con MediaRecorder / Micrófono
  const handleToggleGrabarAudio = async () => {
    if (grabandoAudio) {
      if (intervalGrabacionRef.current) clearInterval(intervalGrabacionRef.current);
      if (grabacionRef.current) {
        try {
          const res = await grabacionRef.current.stop();
          setAudioGrabadoUrl(res.url);
          setAudioGrabadoBlob(res.blob);
          setAudioGrabadoDuracion(res.duracionStr);
        } catch (err) {
          console.error('Error al detener grabación:', err);
        }
        grabacionRef.current = null;
      }
      setGrabandoAudio(false);
    } else {
      setAudioGrabadoUrl(null);
      setAudioGrabadoBlob(null);
      setAudioGrabadoDuracion(null);
      setSegundosGrabacion(0);
      setGrabandoAudio(true);

      try {
        const recorder = await audioPlayerService.iniciarGrabacion();
        grabacionRef.current = recorder;

        intervalGrabacionRef.current = setInterval(() => {
          setSegundosGrabacion((prev) => {
            if (prev >= 120) {
              handleToggleGrabarAudio();
              return 120;
            }
            return prev + 1;
          });
        }, 1000);
      } catch (err) {
        console.error('Error al iniciar grabación:', err);
        setGrabandoAudio(false);
      }
    }
  };

  // Reproducción real a través de los parlantes (HTML5 Audio / Web Audio / SpeechSynthesis)
  const handleReproducirAudio = (audioUrl?: string, textoRespaldo?: string, id?: string) => {
    if (playbackHandleRef.current) {
      playbackHandleRef.current.stop();
      playbackHandleRef.current = null;
    }

    if (reproduciendoAudioId === id) {
      setReproduciendoAudioId(null);
      return;
    }

    const currentId = id || 'audio-temp';
    setReproduciendoAudioId(currentId);

    playbackHandleRef.current = audioPlayerService.reproducirAudio({
      audioUrl,
      textoRespaldo: textoRespaldo || 'Respuesta y orientación oficial emitida por la Secretaría de Ingeniería Industrial UNT.',
      onStart: () => setReproduciendoAudioId(currentId),
      onEnd: () => setReproduciendoAudioId(null)
    });
  };

  const handleEnviarRespuesta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultaActiva) return;
    if (!respuestaTexto.trim() && !audioGrabadoDuracion) return;

    setEnviando(true);
    await responderConsulta({
      id: consultaActiva.id,
      respuestaTexto: respuestaTexto.trim(),
      respuestaAudioDuracion: audioGrabadoDuracion || undefined,
      respuestaAudioUrl: audioGrabadoUrl || undefined,
      audioBlob: audioGrabadoBlob
    });
    setEnviando(false);
    setRespuestaTexto('');
    setAudioGrabadoDuracion(null);
    setAudioGrabadoUrl(null);
    setAudioGrabadoBlob(null);
    setSegundosGrabacion(0);
  };

  // Grabación de audio para Comunicado General
  const handleToggleGrabarComunicado = async () => {
    if (grabandoComunicado) {
      if (intervalComunicadoRef.current) clearInterval(intervalComunicadoRef.current);
      if (grabacionComunicadoRef.current) {
        const res = await grabacionComunicadoRef.current.stop();
        setComunicadoAudioUrl(res.url);
        setComunicadoAudioBlob(res.blob);
        setComunicadoAudioDuracion(res.duracionStr);
        grabacionComunicadoRef.current = null;
      }
      setGrabandoComunicado(false);
    } else {
      setComunicadoAudioUrl(null);
      setComunicadoAudioBlob(null);
      setComunicadoAudioDuracion(null);
      setComunicadoSegundos(0);
      setGrabandoComunicado(true);

      const recorder = await audioPlayerService.iniciarGrabacion();
      grabacionComunicadoRef.current = recorder;

      intervalComunicadoRef.current = setInterval(() => {
        setComunicadoSegundos((prev) => {
          if (prev >= 180) {
            handleToggleGrabarComunicado();
            return 180;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const handleEmitirComunicadoGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comunicadoTitulo.trim() || !comunicadoMensaje.trim()) return;

    await emitirComunicado({
      titulo: comunicadoTitulo.trim(),
      mensaje: comunicadoMensaje.trim(),
      audioUrl: comunicadoAudioUrl || undefined,
      audioDuracion: comunicadoAudioDuracion || '0:30',
      audioBlob: comunicadoAudioBlob
    });

    setModalComunicadoAbierto(false);
    setComunicadoTitulo('');
    setComunicadoMensaje('');
    setComunicadoAudioUrl(null);
    setComunicadoAudioBlob(null);
    setComunicadoAudioDuracion(null);
    setComunicadoSegundos(0);
  };

  const pendientesCount = consultas.filter((c) => c.estado === 'Pendiente' || c.estado === 'Reabierta').length;
  const resueltasCount = consultas.filter((c) => c.estado === 'Resuelta' || c.estado === 'Cerrada').length;

  return (
    <div className="space-y-4">
      {/* Cabecera del Buzón */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-unt-blue" />
            <span>Buzón de Consultas</span>
            {pendientesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                {pendientesCount} por atender
              </span>
            )}
          </h3>
        </div>

        {/* Acciones y Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModalComunicadoAbierto(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-unt-blue hover:bg-unt-blue-light rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Enviar anuncio general con nota de voz a todos los graduandos"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-300" />
            <span>+ Emitir Comunicado General</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFiltro('Pendiente')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filtro === 'Pendiente' ? 'bg-white text-unt-blue shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendientes ({pendientesCount})
            </button>
            <button
              onClick={() => setFiltro('Resuelta')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filtro === 'Resuelta' ? 'bg-white text-unt-blue shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resueltas ({resueltasCount})
            </button>
            <button
              onClick={() => setFiltro('TODAS')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filtro === 'TODAS' ? 'bg-white text-unt-blue shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({consultas.length})
            </button>
          </div>
        </div>
      </div>

      {/* Grid Principal: Lista a la izquierda, Conversación a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Panel Izquierdo: Lista de Consultas */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs space-y-2 h-[550px] overflow-y-auto">
          {consultasFiltradas.length > 0 ? (
            consultasFiltradas.map((c) => {
              const seleccionado = consultaActiva?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setConsultaSeleccionadaId(c.id)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    seleccionado
                      ? 'border-unt-blue bg-blue-50/70 shadow-2xs ring-1 ring-unt-blue'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5">
                    <div className="font-bold text-slate-900 truncate max-w-[190px]">
                      {c.tesistaNombre}
                    </div>
                    <Badge 
                      variant={
                        c.conformidadTesista === 'conforme'
                          ? 'success'
                          : c.estado === 'Reabierta'
                          ? 'warning'
                          : c.estado === 'Cerrada'
                          ? 'neutral'
                          : c.estado === 'Resuelta'
                          ? 'info'
                          : 'warning'
                      } 
                      size="sm"
                    >
                      {c.conformidadTesista === 'conforme'
                        ? '✓ Conforme'
                        : c.estado === 'Reabierta'
                        ? `Repregunta (${c.intentosReapertura}/2)`
                        : c.estado === 'Cerrada'
                        ? 'Cerrada'
                        : c.estado}
                    </Badge>
                  </div>

                  <p className="font-semibold text-slate-800 line-clamp-1 mb-1">
                    {c.asunto}
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 italic">
                    "{c.mensaje}"
                  </p>

                  <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400 border-t border-slate-100 mt-2">
                    <span className="font-mono">Cód: {c.tesistaCodigo}</span>
                    <span>{c.fechaEnvio}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No hay consultas en este filtro.
            </div>
          )}
        </div>

        {/* Panel Derecho: Detalle de la Consulta y Respuesta por Texto o Audio */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col h-[550px] overflow-hidden">
          {consultaActiva ? (
            <>
              {/* Header de la Consulta Activa */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {consultaActiva.tesistaNombre}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      (Cód: {consultaActiva.tesistaCodigo})
                    </span>
                    <Badge variant={consultaActiva.estado === 'Resuelta' ? 'success' : 'warning'} size="sm">
                      {consultaActiva.estado}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-unt-blue mt-1">
                    {consultaActiva.asunto}
                  </h4>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {consultaActiva.fechaEnvio}
                  </span>
                  <button
                    type="button"
                    onClick={() => setConsultaAEliminar(consultaActiva)}
                    title="Eliminar consulta y liberar sus audios adjuntos"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Eliminar</span>
                  </button>
                </div>
              </div>

              {/* Mensajes (Duda del Tesista + Respuesta si existe) */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4 bg-slate-50/40">
                {/* Mensaje del Tesista */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-200 text-xs text-slate-800 space-y-1 max-w-lg shadow-2xs">
                    <div className="font-bold text-slate-900">Consulta del graduando:</div>
                    <p className="leading-relaxed whitespace-pre-wrap">{consultaActiva.mensaje}</p>
                  </div>
                </div>

                {/* Respuesta previa de Secretaría */}
                {(consultaActiva.estado === 'Resuelta' || consultaActiva.estado === 'Reabierta' || consultaActiva.estado === 'Cerrada') && (
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-[#082F64] text-white p-3.5 rounded-2xl rounded-tr-none text-xs space-y-2 max-w-lg shadow-xs">
                      <div className="flex items-center justify-between text-[11px] text-blue-200 border-b border-white/10 pb-1">
                        <span className="font-bold">{consultaActiva.respondidoPor || 'Secretaría Académica'}</span>
                        <span className="font-mono">{consultaActiva.fechaRespuesta}</span>
                      </div>
                      {consultaActiva.respuestaTexto && (
                        <div className="space-y-2">
                          <p className="leading-relaxed">{consultaActiva.respuestaTexto}</p>
                          <div className="pt-1 border-t border-white/10 flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                agregarFaq({
                                  pregunta: consultaActiva.asunto.trim().endsWith('?')
                                    ? consultaActiva.asunto.trim()
                                    : `¿${consultaActiva.asunto.trim()}?`,
                                  respuesta: consultaActiva.respuestaTexto || '',
                                  categoria: 'General'
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-amber-300 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              <HelpCircle className="w-3 h-3" />
                              <span>+ Publicar en Preguntas Frecuentes</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Reproductor de Audio Real */}
                      {consultaActiva.respuestaAudioDuracion && (
                        <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleReproducirAudio(
                                consultaActiva.respuestaAudioUrl,
                                consultaActiva.respuestaTexto,
                                consultaActiva.id
                              )
                            }
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition-colors ${
                              reproduciendoAudioId === consultaActiva.id
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                            }`}
                            title={reproduciendoAudioId === consultaActiva.id ? 'Pausar audio' : 'Escuchar respuesta de voz'}
                          >
                            {reproduciendoAudioId === consultaActiva.id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5" />
                            )}
                          </button>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-blue-200">
                              <span className="font-bold flex items-center gap-1">
                                <Volume2 className="w-3 h-3 text-amber-300" />
                                {reproduciendoAudioId === consultaActiva.id ? 'Reproduciendo audio...' : 'Nota de voz explicativa'}
                              </span>
                              <span className="font-mono">{consultaActiva.respuestaAudioDuracion}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                              <div
                                className={`h-full bg-amber-400 transition-all duration-300 ${
                                  reproduciendoAudioId === consultaActiva.id ? 'w-full animate-pulse' : 'w-0'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hilo de repreguntas y aclaraciones posteriores */}
                {consultaActiva.mensajesSeguimiento && consultaActiva.mensajesSeguimiento.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                      — Seguimiento y Aclaraciones del Ticket —
                    </div>
                    {consultaActiva.mensajesSeguimiento.map((m) => (
                      <div
                        key={m.id}
                        className={`flex items-start gap-2.5 ${m.remitente === 'tesista' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`p-3 rounded-2xl text-xs max-w-lg shadow-2xs ${
                            m.remitente === 'tesista'
                              ? 'bg-amber-50 border border-amber-300 text-amber-950 rounded-tl-none'
                              : 'bg-unt-blue text-white rounded-tr-none'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px] mb-1 pb-1 border-b border-black/10">
                            <span className="font-bold">{m.autor}</span>
                            <span className="font-mono opacity-70">{m.fecha}</span>
                          </div>
                          <p className="leading-relaxed">{m.mensajeTexto}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Estado de Conformidad del Tesista */}
                {consultaActiva.conformidadTesista === 'conforme' && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>El tesista marcó <strong>✓ Duda Resuelta</strong> y confirmó su satisfacción con la respuesta.</span>
                  </div>
                )}

                {consultaActiva.estado === 'Reabierta' && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Repregunta pendiente:</strong> El tesista indicó que aún no queda claro (Intento {consultaActiva.intentosReapertura || 1}/2). Responda a continuación para atender la aclaración.
                    </span>
                  </div>
                )}

                {consultaActiva.estado === 'Cerrada' && (
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-600 text-xs flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Este ticket alcanzó el límite de <strong>2 intentos</strong> permitidos y ha quedado cerrado.</span>
                  </div>
                )}
              </div>

              {/* Formulario de Respuesta Rápida: Texto o Audio Real */}
              <form onSubmit={handleEnviarRespuesta} className="p-3.5 bg-white border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold">Redactar respuesta privada o grabar nota de voz:</span>
                  {grabandoAudio && (
                    <span className="text-rose-600 font-bold flex items-center gap-1.5 animate-pulse bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                      Grabando con micrófono: 0:{segundosGrabacion < 10 ? '0' : ''}{segundosGrabacion} (clic en Parar)
                    </span>
                  )}
                  {audioGrabadoDuracion && !grabandoAudio && (
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Audio grabado ({audioGrabadoDuracion})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleReproducirAudio(audioGrabadoUrl || undefined, respuestaTexto || 'Vista previa de nota de voz', 'preview-local')}
                        className="text-[10px] text-unt-blue font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        title="Probar reproducción antes de enviar"
                      >
                        <Play className="w-3 h-3" /> Probar audio
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <textarea
                    rows={2}
                    value={respuestaTexto}
                    onChange={(e) => setRespuestaTexto(e.target.value)}
                    placeholder="Escriba la orientación formal para el tesista..."
                    className="flex-1 p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
                  />

                  {/* Botón de Grabación de Audio */}
                  <button
                    type="button"
                    onClick={handleToggleGrabarAudio}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex flex-col items-center justify-center shrink-0 min-w-[55px] ${
                      grabandoAudio
                        ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                        : audioGrabadoDuracion
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                    title={grabandoAudio ? 'Detener grabación de micrófono' : 'Grabar nota de audio real'}
                  >
                    <Mic className="w-4 h-4" />
                    <span className="text-[9px] font-bold mt-0.5">
                      {grabandoAudio ? 'Parar' : audioGrabadoDuracion ? 'Listo' : 'Grabar'}
                    </span>
                  </button>

                  {/* Botón de Enviar */}
                  <button
                    type="submit"
                    disabled={enviando || (!respuestaTexto.trim() && !audioGrabadoDuracion)}
                    className="p-3 bg-unt-blue hover:bg-unt-blue-light disabled:opacity-50 text-white rounded-xl shadow-2xs transition-colors cursor-pointer shrink-0"
                    title="Enviar respuesta al tesista"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Seleccione una consulta para responder.
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmación para Eliminar Consulta + Audios */}
      {consultaAEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setConsultaAEliminar(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-200" />
                <h3 className="text-sm font-bold">Eliminar Consulta y Audios</h3>
              </div>
              <button
                type="button"
                onClick={() => setConsultaAEliminar(null)}
                className="p-1 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs text-slate-700">
              <p className="leading-relaxed">
                ¿Está segura(o) de eliminar la consulta <strong>"{consultaAEliminar.asunto}"</strong> de{' '}
                <strong>{consultaAEliminar.tesistaNombre}</strong>?
              </p>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                Esta acción eliminará el ticket y cualquier nota de voz adjunta de forma definitiva para liberar espacio.
                Si desea conservar la respuesta para otros tesistas, puede publicarla antes en <strong>Preguntas Frecuentes</strong>.
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConsultaAEliminar(null)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (playbackHandleRef.current) {
                      playbackHandleRef.current.stop();
                      playbackHandleRef.current = null;
                      setReproduciendoAudioId(null);
                    }
                    await eliminarConsulta(consultaAEliminar.id);
                    setConsultaAEliminar(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-2xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sí, eliminar consulta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Emitir Comunicado General */}
      {modalComunicadoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-[#082F64] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-bold">Emitir Comunicado General a Tesistas</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalComunicadoAbierto(false)}
                className="p-1 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEmitirComunicadoGeneral} className="p-5 space-y-4 text-xs">
              <p className="text-slate-500 leading-relaxed">
                Este comunicado con nota de voz llegará a las notificaciones de todos los tesistas y graduandos registrados en el sistema.
              </p>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Título del Comunicado:
                </label>
                <input
                  type="text"
                  required
                  value={comunicadoTitulo}
                  onChange={(e) => setComunicadoTitulo(e.target.value)}
                  placeholder="Ej: Nuevas directivas para sustentación y uso del Auditorio"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Mensaje o Circular:
                </label>
                <textarea
                  rows={3}
                  required
                  value={comunicadoMensaje}
                  onChange={(e) => setComunicadoMensaje(e.target.value)}
                  placeholder="Escriba los detalles y precisiones de la secretaría..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Grabación de Nota de Voz para el Comunicado */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-unt-blue" />
                    <span>Nota de Voz Oficial para el Comunicado:</span>
                  </span>
                  {grabandoComunicado && (
                    <span className="text-rose-600 font-bold text-[11px] animate-pulse">
                      Grabando: 0:{comunicadoSegundos < 10 ? '0' : ''}{comunicadoSegundos}
                    </span>
                  )}
                  {comunicadoAudioDuracion && !grabandoComunicado && (
                    <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Grabado ({comunicadoAudioDuracion})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleGrabarComunicado}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      grabandoComunicado
                        ? 'bg-rose-600 text-white animate-pulse'
                        : comunicadoAudioDuracion
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>
                      {grabandoComunicado ? 'Detener Grabación' : comunicadoAudioDuracion ? 'Volver a Grabar' : 'Grabar Nota de Voz'}
                    </span>
                  </button>

                  {comunicadoAudioDuracion && (
                    <button
                      type="button"
                      onClick={() => handleReproducirAudio(comunicadoAudioUrl || undefined, comunicadoMensaje, 'preview-comunicado')}
                      className="text-unt-blue font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" /> Probar audio
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalComunicadoAbierto(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-unt-blue hover:bg-unt-blue-light text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Megaphone className="w-3.5 h-3.5 text-amber-300" />
                  <span>Publicar Comunicado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
