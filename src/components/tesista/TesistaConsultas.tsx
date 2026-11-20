import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  Play, 
  Pause, 
  HelpCircle, 
  Plus, 
  User, 
  ShieldCheck,
  Volume2,
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { audioPlayerService, AudioPlaybackHandle } from '../../services/audioPlayerService';

export const TesistaConsultas: React.FC = () => {
  const { usuario, consultas, crearConsulta, evaluarResolucionConsulta } = useApp();
  const [modalNuevaConsulta, setModalNuevaConsulta] = useState<boolean>(false);
  const [asunto, setAsunto] = useState<string>('');
  const [mensaje, setMensaje] = useState<string>('');
  const [enviando, setEnviando] = useState<boolean>(false);
  const [reproduciendoAudioId, setReproduciendoAudioId] = useState<string | null>(null);
  const [consultaEnAclaracionId, setConsultaEnAclaracionId] = useState<string | null>(null);
  const [textoAclaracion, setTextoAclaracion] = useState<string>('');
  const [consultaAConfirmarResuelta, setConsultaAConfirmarResuelta] = useState<{
    id: string;
    asunto: string;
    tieneAudio: boolean;
  } | null>(null);
  const [procesandoResolucion, setProcesandoResolucion] = useState<boolean>(false);
  const playbackHandleRef = useRef<AudioPlaybackHandle | null>(null);

  // Filtrar consultas del tesista autenticado
  const misConsultas = consultas.filter((c) => c.tesistaId === usuario?.id);

  const handleReproducirAudio = (audioUrl?: string, textoRespaldo?: string, id?: string) => {
    if (playbackHandleRef.current) {
      playbackHandleRef.current.stop();
      playbackHandleRef.current = null;
    }

    if (reproduciendoAudioId === id) {
      setReproduciendoAudioId(null);
      return;
    }

    const currentId = id || 'audio-tesista';
    setReproduciendoAudioId(currentId);

    playbackHandleRef.current = audioPlayerService.reproducirAudio({
      audioUrl,
      textoRespaldo: textoRespaldo || 'Respuesta y orientación oficial emitida por Secretaría Académica UNT.',
      onStart: () => setReproduciendoAudioId(currentId),
      onEnd: () => setReproduciendoAudioId(null)
    });
  };

  const handleCrearConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asunto.trim() || !mensaje.trim()) return;

    setEnviando(true);
    await crearConsulta({
      asunto: asunto.trim(),
      mensaje: mensaje.trim()
    });
    setEnviando(false);
    setAsunto('');
    setMensaje('');
    setModalNuevaConsulta(false);
  };

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-unt-blue" />
            <span>Mis Consultas a Secretaría</span>
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setModalNuevaConsulta(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-unt-blue hover:bg-unt-blue-light rounded-xl shadow-2xs transition-colors cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nueva Consulta a Secretaría</span>
        </button>
      </div>

      {/* Lista de Consultas del Tesista */}
      <div className="space-y-3">
        {misConsultas.length > 0 ? (
          misConsultas.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3"
            >
              {/* Asunto y Estado */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{c.asunto}</h4>
                  <Badge 
                    variant={
                      c.conformidadTesista === 'conforme'
                        ? 'success'
                        : c.estado === 'Cerrada'
                        ? 'neutral'
                        : c.estado === 'Reabierta'
                        ? 'warning'
                        : c.estado === 'Resuelta'
                        ? 'info'
                        : 'warning'
                    } 
                    size="sm"
                  >
                    {c.conformidadTesista === 'conforme'
                      ? '✓ Consulta Conforme y Resuelta'
                      : c.estado === 'Cerrada'
                      ? '🔒 Ticket Cerrado (Límite 2/2)'
                      : c.estado === 'Reabierta'
                      ? `Reabierta (Intento ${c.intentosReapertura || 1}/2)`
                      : c.estado === 'Resuelta'
                      ? 'Respuesta Recibida (Pendiente Confirmación)'
                      : 'En espera de atención'}
                  </Badge>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Enviado el {c.fechaEnvio}
                </span>
              </div>

              {/* Mensaje original del Tesista */}
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-0.5">Su consulta:</span>
                "{c.mensaje}"
              </div>

              {/* Hilo de Seguimiento y Respuesta de Secretaría */}
              {(c.estado === 'Resuelta' || c.estado === 'Reabierta' || c.estado === 'Cerrada') && (
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-unt-blue flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Respuesta de {c.respondidoPor || 'Secretaría Académica UNT'}:</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{c.fechaRespuesta}</span>
                  </div>

                  {c.respuestaTexto && (
                    <p className="text-xs text-slate-800 leading-relaxed bg-white/90 p-3 rounded-lg border border-blue-100">
                      {c.respuestaTexto}
                    </p>
                  )}

                  {/* Reproductor de Audio Real si envió nota de voz */}
                  {c.respuestaAudioDuracion && (
                    <div className="p-2.5 rounded-xl bg-[#082F64] text-white flex items-center gap-3 shadow-2xs">
                      <button
                        type="button"
                        onClick={() =>
                          handleReproducirAudio(c.respuestaAudioUrl, c.respuestaTexto, c.id)
                        }
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition-colors ${
                          reproduciendoAudioId === c.id
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                        }`}
                        title={reproduciendoAudioId === c.id ? 'Pausar audio' : 'Escuchar respuesta de voz'}
                      >
                        {reproduciendoAudioId === c.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-blue-200">
                          <span className="font-semibold flex items-center gap-1">
                            <Volume2 className="w-3 h-3 text-amber-300" />
                            {reproduciendoAudioId === c.id ? 'Reproduciendo audio...' : 'Nota de voz oficial de Secretaría'}
                          </span>
                          <span className="font-mono">{c.respuestaAudioDuracion}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                          <div
                            className={`h-full bg-amber-400 transition-all duration-300 ${
                              reproduciendoAudioId === c.id ? 'w-full animate-pulse' : 'w-0'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mensajes de Seguimiento adicionales si hubo repreguntas */}
                  {c.mensajesSeguimiento && c.mensajesSeguimiento.length > 0 && (
                    <div className="pt-2 border-t border-blue-200/80 space-y-2">
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Historial de Aclaraciones y Seguimiento:
                      </div>
                      {c.mensajesSeguimiento.map((m) => (
                        <div
                          key={m.id}
                          className={`p-2.5 rounded-lg text-xs ${
                            m.remitente === 'tesista'
                              ? 'bg-amber-50/80 border border-amber-200 text-amber-900 ml-4'
                              : 'bg-white border border-slate-200 text-slate-800 mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-bold text-slate-700">{m.autor}</span>
                            <span className="font-mono">{m.fecha}</span>
                          </div>
                          <p>{m.mensajeTexto}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bloque de Evaluación por el Tesista: Botones Check [✓] y X [✗] */}
                  {c.conformidadTesista === 'conforme' ? (
                    <div className="p-2.5 rounded-lg bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Ha confirmado que esta respuesta resolvió su consulta formal.</span>
                    </div>
                  ) : c.estado === 'Cerrada' || (c.intentosReapertura || 0) >= 2 ? (
                    <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-600 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Se completaron los <strong>2 intentos</strong> de aclaración para este ticket. Ha quedado cerrado.</span>
                      </div>
                      <span className="text-[10px] font-bold text-unt-blue bg-white px-2 py-0.5 rounded border border-slate-200">
                        2/2 intentos
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-2xs space-y-2 mt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            ¿Esta respuesta resolvió su consulta?
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Indique con los botones si quedó conforme o si requiere repreguntar (Máximo 2 intentos. Utilizados: {c.intentosReapertura || 0}/2).
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Botón Check: Resuelto (con confirmación de auto-eliminación) */}
                          <button
                            type="button"
                            onClick={() =>
                              setConsultaAConfirmarResuelta({
                                id: c.id,
                                asunto: c.asunto,
                                tieneAudio: Boolean(c.respuestaAudioDuracion)
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                            title="Confirmar que la duda está resuelta (se eliminará automáticamente del buzón)"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>✓ Duda Resuelta</span>
                          </button>

                          {/* Botón X: No resuelto / Volver a escribirle */}
                          <button
                            type="button"
                            onClick={() =>
                              setConsultaEnAclaracionId(
                                consultaEnAclaracionId === c.id ? null : c.id
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold transition-colors cursor-pointer"
                            title="Aún no resuelta: repreguntar a Secretaría (intento de 2)"
                          >
                            <X className="w-4 h-4" />
                            <span>✗ No resuelta / Aclarar</span>
                          </button>
                        </div>
                      </div>

                      {/* Formulario desplegable para repreguntar */}
                      {consultaEnAclaracionId === c.id && (
                        <div className="pt-2 border-t border-slate-100 space-y-2 animate-in fade-in">
                          <div className="flex items-center justify-between text-[11px] text-amber-900 font-semibold">
                            <span>Escriba los detalles de lo que aún no quedó claro para Secretaría:</span>
                            <span className="font-bold bg-amber-100 px-2 py-0.5 rounded text-amber-800">
                              Intento {(c.intentosReapertura || 0) + 1} de 2
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            value={textoAclaracion}
                            onChange={(e) => setTextoAclaracion(e.target.value)}
                            placeholder="Detalle su repregunta para que Secretaría pueda profundizar..."
                            className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setConsultaEnAclaracionId(null);
                                setTextoAclaracion('');
                              }}
                              className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              disabled={!textoAclaracion.trim()}
                              onClick={async () => {
                                await evaluarResolucionConsulta(c.id, false, textoAclaracion.trim());
                                setConsultaEnAclaracionId(null);
                                setTextoAclaracion('');
                              }}
                              className="px-3.5 py-1.5 bg-unt-blue hover:bg-unt-blue-light text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Enviar Repregunta (Intento {(c.intentosReapertura || 0) + 1}/2)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {c.estado === 'Pendiente' && (
                <div className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Su consulta se encuentra en cola de atención. Secretaría Académica responderá a la brevedad.
                  </span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400 text-xs space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">No tiene consultas enviadas en este momento.</p>
            <p className="text-[11px] text-slate-400">
              ¿Tiene dudas con algún requisito o la reserva del auditorio? Haga clic en "+ Nueva Consulta a Secretaría".
            </p>
          </div>
        )}
      </div>

      {/* Modal de Confirmación: Marcar Duda Resuelta y Auto-Eliminar Consulta + Audio */}
      {consultaAConfirmarResuelta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => !procesandoResolucion && setConsultaAConfirmarResuelta(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <h3 className="text-sm font-bold tracking-tight">Confirmar Consulta Resuelta</h3>
              </div>
              <button
                type="button"
                disabled={procesandoResolucion}
                onClick={() => setConsultaAConfirmarResuelta(null)}
                className="p-1 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Consulta a cerrar:
                </span>
                <p className="font-bold text-slate-900">{consultaAConfirmarResuelta.asunto}</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-2.5 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Limpieza automática de almacenamiento:</span>
                  Al confirmar que tu duda quedó resuelta, esta consulta{' '}
                  {consultaAConfirmarResuelta.tieneAudio ? 'y sus notas de voz adjuntas ' : ''}
                  se <strong>eliminarán automáticamente</strong> del sistema para mantener el buzón limpio y liberar espacio.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={procesandoResolucion}
                  onClick={() => setConsultaAConfirmarResuelta(null)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={procesandoResolucion}
                  onClick={async () => {
                    if (playbackHandleRef.current) {
                      playbackHandleRef.current.stop();
                      playbackHandleRef.current = null;
                      setReproduciendoAudioId(null);
                    }
                    setProcesandoResolucion(true);
                    await evaluarResolucionConsulta(consultaAConfirmarResuelta.id, true);
                    setProcesandoResolucion(false);
                    setConsultaAConfirmarResuelta(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{procesandoResolucion ? 'Eliminando...' : 'Sí, está resuelta (Eliminar)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Consulta */}
      {modalNuevaConsulta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-[#082F64] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight">Nueva Consulta a Secretaría Académica</h3>
              <button
                type="button"
                onClick={() => setModalNuevaConsulta(false)}
                className="p-1 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearConsulta} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Tema o Asunto de la Consulta:
                </label>
                <input
                  type="text"
                  required
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Ej: Duda sobre porcentaje de similitud en Turnitin"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Detalle de su Duda o Inquietud:
                </label>
                <textarea
                  required
                  rows={4}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Explique claramente su consulta para que la Secretaría pueda orientarlo con precisión..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevaConsulta(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="px-4 py-2 bg-unt-blue hover:bg-unt-blue-light text-white font-bold rounded-xl shadow-2xs"
                >
                  {enviando ? 'Enviando...' : 'Enviar Consulta a Secretaría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
