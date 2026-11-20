import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bell, 
  ChevronDown, 
  RefreshCw, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck,
  User,
  Megaphone,
  Play,
  Pause,
  Volume2,
  CheckCircle2,
  Trash2,
  MessageSquare,
  FileText,
  Lock,
  Globe,
  KeyRound
} from 'lucide-react';
import { audioPlayerService, AudioPlaybackHandle } from '../../services/audioPlayerService';

// Bandera temporal para la etapa de evaluación académica.
// Cambiar a `false` antes del lanzamiento final para retirar el botón de rotación rápida.
const MODO_EVALUACION_HABILITADO = true;

interface HeaderProps {
  onToggleSidebar?: () => void;
  sidebarAbierto?: boolean;
  onAbrirLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  sidebarAbierto = false,
  onAbrirLogin
}) => {
  const { 
    usuario, 
    rolActual, 
    cambiarRolDemo, 
    cerrarSesion,
    cambiarMiPassword,
    documentos,
    comunicados,
    marcarLeidoComunicado,
    eliminarComunicado,
    consultas
  } = useApp();

  const [panelNotificacionesAbierto, setPanelNotificacionesAbierto] = useState<boolean>(false);
  const [reproduciendoComId, setReproduciendoComId] = useState<string | null>(null);
  const playbackHandleRef = useRef<AudioPlaybackHandle | null>(null);

  // Modal de Cambio de Contraseña Personal del Tesista / Secretaría
  const [modalClaveAbierto, setModalClaveAbierto] = useState<boolean>(false);
  const [claveActual, setClaveActual] = useState<string>('');
  const [claveNueva, setClaveNueva] = useState<string>('');
  const [claveConfirmar, setClaveConfirmar] = useState<string>('');
  const [errorClave, setErrorClave] = useState<string | null>(null);

  const handleGuardarNuevaClave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorClave(null);
    if (claveNueva.trim().length < 6) {
      setErrorClave('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (claveNueva.trim() !== claveConfirmar.trim()) {
      setErrorClave('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    const ok = await cambiarMiPassword(claveActual, claveNueva);
    if (ok) {
      setModalClaveAbierto(false);
      setClaveActual('');
      setClaveNueva('');
      setClaveConfirmar('');
    }
  };

  const estaComunicadoLeido = (com: { leido?: boolean; leidoPor?: string[] }) => {
    if (usuario?.id && Array.isArray(com.leidoPor)) {
      return com.leidoPor.includes(usuario.id);
    }
    return Boolean(com.leido);
  };

  const pendientesCount = documentos.filter((d) => d.estado === 'En revisión').length;
  const noLeidosComunicados = comunicados.filter((c) => !estaComunicadoLeido(c)).length;
  const totalNotificaciones = noLeidosComunicados + (rolActual === 'secretaria' ? pendientesCount : 0);

  const handleReproducirAudioComunicado = (audioUrl?: string, textoRespaldo?: string, id?: string) => {
    if (playbackHandleRef.current) {
      playbackHandleRef.current.stop();
      playbackHandleRef.current = null;
    }

    if (reproduciendoComId === id) {
      setReproduciendoComId(null);
      return;
    }

    const currentId = id || 'com-temp';
    setReproduciendoComId(currentId);

    playbackHandleRef.current = audioPlayerService.reproducirAudio({
      audioUrl,
      textoRespaldo: textoRespaldo || 'Comunicado institucional oficial emitido por la Secretaría de Ingeniería Industrial UNT.',
      onStart: () => setReproduciendoComId(currentId),
      onEnd: () => setReproduciendoComId(null)
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#082F64] text-white border-b border-[#051F42] shadow-md relative">
      {/* Fotografía de la Universidad Nacional de Trujillo atenuada en el espacio azul sobrante */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="/images/puerta1-mural-unt.jpg"
          alt="Campus Universidad Nacional de Trujillo"
          className="w-full h-full object-cover object-center opacity-25 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#082F64] via-[#082F64]/75 to-[#082F64]" />
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Lado Izquierdo: Menú Móvil + Escudo UNT + Logo Escuela Ingeniería Industrial */}
          <div className="flex items-center gap-3 sm:gap-4">
            {usuario && onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                aria-label="Alternar menú"
              >
                {sidebarAbierto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Escudo UNT */}
              <img
                src="/images/logo-unt.png"
                alt="Universidad Nacional de Trujillo"
                className="h-10 sm:h-11 w-auto object-contain drop-shadow"
              />
              {/* Separador sutil */}
              <div className="h-7 w-px bg-white/25" />
              {/* Logo de la Escuela Profesional de Ingeniería Industrial */}
              <img
                src="/images/logo-industrial.png"
                alt="Escuela de Ingeniería Industrial UNT"
                className="h-10 sm:h-11 w-auto object-contain drop-shadow"
              />

              <div className="flex flex-col justify-center border-l border-white/20 pl-3 sm:pl-3.5 hidden sm:flex">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-white uppercase font-serif leading-tight">
                  Universidad Nacional de Trujillo
                </span>
                <span className="text-[11px] sm:text-xs text-blue-200 font-sans tracking-normal leading-tight mt-0.5">
                  Escuela de Ingeniería Industrial
                </span>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Modo Público vs Modo Privado (Tesistas Acreditados / Secretaría) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!usuario ? (
              <>
                <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
                  <Globe className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Repositorio Público</span>
                </div>

                {onAbrirLogin && (
                  <button
                    type="button"
                    onClick={onAbrirLogin}
                    className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Acceso Tesistas / Titulación</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {/* Notificaciones y Desplegable de Comunicados */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPanelNotificacionesAbierto(!panelNotificacionesAbierto)}
                    className={`p-2 rounded-full transition-colors relative cursor-pointer ${
                      panelNotificacionesAbierto ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                    title="Notificaciones y Comunicados con Notas de Voz"
                  >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    {totalNotificaciones > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-[#082F64] animate-pulse">
                        {totalNotificaciones > 9 ? '9+' : totalNotificaciones}
                      </span>
                    )}
                  </button>

                  {/* Panel Desplegable de Notificaciones y Comunicados */}
                  {panelNotificacionesAbierto && (
                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="p-3.5 bg-[#082F64] text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Megaphone className="w-4 h-4 text-amber-300" />
                          <span className="font-bold text-xs tracking-tight">Comunicados y Notificaciones UNT</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPanelNotificacionesAbierto(false)}
                          className="p-1 text-white/70 hover:text-white rounded hover:bg-white/10 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                        {/* Lista de Comunicados Generales de Secretaría */}
                        {comunicados.length > 0 ? (
                          comunicados.map((com) => {
                            const leidoPorMi = estaComunicadoLeido(com);
                            return (
                            <div
                              key={com.id}
                              className={`p-3.5 space-y-2 transition-colors ${
                                !leidoPorMi ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                  <Megaphone className="w-3 h-3 text-amber-600" />
                                  <span>Circular General</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">{com.fecha}</span>
                              </div>

                              <h4 className="text-xs font-bold text-slate-900 leading-snug">
                                {com.titulo}
                              </h4>

                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                {com.mensaje}
                              </p>

                              {/* Reproductor de Nota de Voz en Notificación */}
                              {com.audioDuracion && (
                                <div className="p-2 rounded-xl bg-[#082F64] text-white flex items-center gap-2.5 shadow-2xs mt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleReproducirAudioComunicado(com.audioUrl, com.mensaje, com.id)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition-colors ${
                                      reproduciendoComId === com.id
                                        ? 'bg-rose-500 text-white animate-pulse'
                                        : 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                                    }`}
                                    title={reproduciendoComId === com.id ? 'Pausar nota de voz' : 'Escuchar nota de voz de la secretaría'}
                                  >
                                    {reproduciendoComId === com.id ? (
                                      <Pause className="w-3.5 h-3.5" />
                                    ) : (
                                      <Play className="w-3.5 h-3.5 ml-0.5" />
                                    )}
                                  </button>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between text-[10px] text-blue-200">
                                      <span className="font-semibold flex items-center gap-1">
                                        <Volume2 className="w-3 h-3 text-amber-300" />
                                        {reproduciendoComId === com.id ? 'Reproduciendo audio...' : 'Nota de voz de Secretaría'}
                                      </span>
                                      <span className="font-mono">{com.audioDuracion}</span>
                                    </div>
                                    <div className="h-1 rounded-full bg-white/20 overflow-hidden">
                                      <div
                                        className={`h-full bg-amber-400 transition-all duration-300 ${
                                          reproduciendoComId === com.id ? 'w-full animate-pulse' : 'w-0'
                                        }`}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                                <span className="truncate max-w-[200px]">Por: {com.autor}</span>
                                <div className="flex items-center gap-2">
                                  {!leidoPorMi && (
                                    <button
                                      type="button"
                                      onClick={() => marcarLeidoComunicado(com.id)}
                                      className="text-unt-blue font-semibold hover:underline cursor-pointer"
                                    >
                                      Marcar leído
                                    </button>
                                  )}
                                  {rolActual === 'secretaria' && (
                                    <button
                                      type="button"
                                      onClick={() => eliminarComunicado(com.id)}
                                      className="text-rose-500 hover:text-rose-700 cursor-pointer p-0.5"
                                      title="Eliminar comunicado"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            );
                          })
                        ) : (
                          <div className="p-6 text-center text-xs text-slate-400">
                            No hay comunicados generales emitidos.
                          </div>
                        )}

                        {/* Notificación para Secretaría sobre requisitos en revisión */}
                        {rolActual === 'secretaria' && pendientesCount > 0 && (
                          <div className="p-3 bg-amber-50/70 border-t border-amber-100 flex items-start gap-2.5 text-xs text-slate-700">
                            <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-amber-900 block">Expedientes en Espera:</span>
                              Hay {pendientesCount} requisitos cargados pendientes de revisión y cotejo documental.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Botón Temporal de Rotación de Vista (Solo durante Evaluación) */}
                {MODO_EVALUACION_HABILITADO ? (
                  <button
                    type="button"
                    onClick={cambiarRolDemo}
                    title="Botón temporal para evaluadores: alternar entre vista de Tesista y Secretaría Académica"
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-300/40 text-xs font-bold text-amber-200 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden md:inline">
                      {rolActual === 'secretaria' ? 'Ver como Tesista' : 'Ver como Secretaría'}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-100 hidden xl:inline">
                      Evaluación
                    </span>
                  </button>
                ) : (
                  <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-amber-300 font-bold">
                      {rolActual === 'secretaria' ? 'Secretaría Académica' : 'Tesista Acreditado'}
                    </span>
                  </div>
                )}

                {/* Perfil Institucional de Usuario + Botón Volver a Vista Pública */}
                <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-white/20">
                  <div className="flex items-center gap-2 select-none">
                    <div className="w-8 h-8 rounded-full bg-white text-[#082F64] font-bold text-xs flex items-center justify-center shadow-xs">
                      {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : rolActual === 'secretaria' ? 'S' : 'U'}
                    </div>

                    <div className="hidden lg:flex flex-col">
                      <span className="text-xs font-bold text-white max-w-[160px] truncate leading-tight">
                        {usuario.nombre || (rolActual === 'secretaria' ? 'Secretaría Académica' : 'Tesista UNT')}
                      </span>
                      <span className="text-[10px] text-blue-200 leading-none truncate max-w-[160px]">
                        {rolActual === 'secretaria'
                          ? usuario.email || 'Secretaría Académica'
                          : usuario.codigoMatricula
                          ? `Cód: ${usuario.codigoMatricula}`
                          : 'Tesista Habilitado'}
                      </span>
                    </div>
                  </div>

                  {/* Botón Cambiar Contraseña Personal */}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorClave(null);
                      setClaveActual('');
                      setClaveNueva('');
                      setClaveConfirmar('');
                      setModalClaveAbierto(true);
                    }}
                    title="Cambiar mi contraseña personal"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clave</span>
                  </button>

                  {/* Botón directo de Salir al Portal Público */}
                  <button
                    type="button"
                    onClick={cerrarSesion}
                    title="Salir al Portal Público del Repositorio"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-rose-500/80 border border-white/15 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Salir</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Integrado para que el Tesista (o Secretaría) cambie su contraseña personal */}
      {modalClaveAbierto && usuario && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModalClaveAbierto(false)}
        >
          <div
            className="bg-white text-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#082F64] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-300" />
                <span className="font-bold text-sm">Cambiar Contraseña Personal</span>
              </div>
              <button
                type="button"
                onClick={() => setModalClaveAbierto(false)}
                className="p-1 text-white/70 hover:text-white rounded hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarNuevaClave} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-slate-600 leading-relaxed">
                {rolActual === 'tesista'
                  ? `Su contraseña inicial es su Número de Matrícula (${usuario.codigoMatricula || 'UNT'}). Al cambiarla aquí, quedará guardada solo para usted.`
                  : 'Actualice la contraseña administrativa de Secretaría Académica.'}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  required
                  value={claveActual}
                  onChange={(e) => setClaveActual(e.target.value)}
                  placeholder="Ingrese su contraseña actual"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:border-[#082F64]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nueva Contraseña Personal (mín. 6 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={claveNueva}
                  onChange={(e) => setClaveNueva(e.target.value)}
                  placeholder="Nueva contraseña segura"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:border-[#082F64]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={claveConfirmar}
                  onChange={(e) => setClaveConfirmar(e.target.value)}
                  placeholder="Repita la nueva contraseña"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:border-[#082F64]"
                />
              </div>

              {errorClave && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                  {errorClave}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalClaveAbierto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] text-white font-bold cursor-pointer"
                >
                  Guardar Nueva Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
