import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { logisticaSecretariaService } from '../../services/logisticaSecretariaService';
import {
  X,
  UserCog,
  KeyRound,
  ShieldCheck,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  Mail,
  Plus,
  Trash2,
  RotateCcw,
  Lock
} from 'lucide-react';

interface CuentaSecretariaModalProps {
  onClose: () => void;
}

const PREGUNTAS_SUGERIDAS = [
  '¿Cuál es el nombre de tu primera mascota?',
  '¿En qué ciudad o distrito naciste?',
  '¿Cuál es el segundo nombre de tu mamá?',
  '¿Cuál es tu palabra o código secreto personal?'
];

export const CuentaSecretariaModal: React.FC<CuentaSecretariaModalProps> = ({ onClose }) => {
  const {
    usuario,
    cuentasSecretaria,
    actualizarMiCuentaSecretaria,
    cambiarMiPassword,
    configurarRecuperacionSecretaria,
    agregarSecretaria,
    toggleActivoSecretaria,
    eliminarSecretaria,
    resetearPasswordSecretaria
  } = useApp();

  const [tab, setTab] = useState<'perfil' | 'seguridad' | 'equipo'>('perfil');

  const cuentaActual = cuentasSecretaria.find(
    (s) => s.correo.toLowerCase() === (usuario?.email || '').toLowerCase()
  );

  // Perfil y correo de ingreso
  const [nombre, setNombre] = useState(cuentaActual?.nombre || usuario?.nombre || 'Secretaría Académica');
  const [correo, setCorreo] = useState(cuentaActual?.correo || usuario?.email || '');
  const [cargo, setCargo] = useState(
    cuentaActual?.cargo || usuario?.departamento || 'Secretaría de Escuela — Ing. Industrial'
  );
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // Cambio de contraseña
  const [pwdActual, setPwdActual] = useState('');
  const [pwdNueva, setPwdNueva] = useState('');
  const [pwdConfirmar, setPwdConfirmar] = useState('');
  const [mostrarPwds, setMostrarPwds] = useState(false);
  const [guardandoPwd, setGuardandoPwd] = useState(false);
  const [errorPwd, setErrorPwd] = useState<string | null>(null);

  // Respaldo de recuperación
  const [preguntaRec, setPreguntaRec] = useState(
    cuentaActual?.preguntaRecuperacion || PREGUNTAS_SUGERIDAS[0]
  );
  const [respuestaRec, setRespuestaRec] = useState('');
  const [guardandoRec, setGuardandoRec] = useState(false);
  const [oauthConectado, setOauthConectado] = useState(false);
  const [oauthEmail, setOauthEmail] = useState('');

  // Nueva cuenta de equipo
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevoCargo, setNuevoCargo] = useState('Asistente de Secretaría — Ing. Industrial');
  const [nuevaClaveInicial, setNuevaClaveInicial] = useState('');
  const [agregandoCuenta, setAgregandoCuenta] = useState(false);

  useEffect(() => {
    logisticaSecretariaService
      .getEmailStatus()
      .then((st) => {
        setOauthConectado(Boolean(st.oauthConnected || st.serverTransportReady));
        setOauthEmail(st.oauthEmail || st.senderEmail || '');
      })
      .catch(() => {});
  }, []);

  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoPerfil(true);
    try {
      await actualizarMiCuentaSecretaria({ nombre, correo, cargo });
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPwd(null);
    if (pwdNueva.trim().length < 6) {
      setErrorPwd('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (pwdNueva.trim() !== pwdConfirmar.trim()) {
      setErrorPwd('Las contraseñas nuevas no coinciden.');
      return;
    }
    setGuardandoPwd(true);
    try {
      const ok = await cambiarMiPassword(pwdActual, pwdNueva);
      if (ok) {
        setPwdActual('');
        setPwdNueva('');
        setPwdConfirmar('');
      }
    } finally {
      setGuardandoPwd(false);
    }
  };

  const handleGuardarRecuperacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoRec(true);
    try {
      const ok = await configurarRecuperacionSecretaria(preguntaRec, respuestaRec);
      if (ok) setRespuestaRec('');
    } finally {
      setGuardandoRec(false);
    }
  };

  const handleAgregarCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgregandoCuenta(true);
    try {
      await agregarSecretaria({
        nombre: nuevoNombre,
        correo: nuevoCorreo,
        cargo: nuevoCargo,
        passwordInicial: nuevaClaveInicial.trim() || undefined
      });
      setNuevoNombre('');
      setNuevoCorreo('');
      setNuevaClaveInicial('');
    } finally {
      setAgregandoCuenta(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-[#082F64] to-[#0C4D96] px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold leading-tight">Cuenta y Seguridad de Secretaría</h2>
              <p className="text-[11px] text-blue-100 font-mono">{usuario?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="px-4 pt-3 bg-slate-50 border-b border-slate-200 flex gap-1.5">
          <button
            type="button"
            onClick={() => setTab('perfil')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-colors cursor-pointer ${
              tab === 'perfil'
                ? 'bg-white text-[#082F64] border-[#082F64]'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <UserCog className="w-3.5 h-3.5" />
            <span>Mi Correo y Perfil</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('seguridad')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-colors cursor-pointer ${
              tab === 'seguridad'
                ? 'bg-white text-[#082F64] border-[#082F64]'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Clave y Recuperación</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('equipo')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-colors cursor-pointer ${
              tab === 'equipo'
                ? 'bg-white text-[#082F64] border-[#082F64]'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Equipo ({cuentasSecretaria.length})</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5 text-xs">
          {/* TAB 1: PERFIL Y CORREO DE ACCESO */}
          {tab === 'perfil' && (
            <form onSubmit={handleGuardarPerfil} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-slate-700 leading-relaxed">
                Aquí cambias el <strong>nombre</strong> y el <strong>correo @unitru.edu.pe</strong> con el que inicias sesión en el sistema. Se guarda en la nube para todas las PCs.
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre visible en el panel:</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Srta. Celia — Secretaría Académica"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:border-[#082F64]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Correo de acceso al sistema (@unitru.edu.pe):
                </label>
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="cchau@unitru.edu.pe"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-hidden focus:border-[#082F64]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cargo / Área:</label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Secretaría de Escuela — Ing. Industrial"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:border-[#082F64]"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={guardandoPerfil}
                  className="px-4 py-2.5 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  {guardandoPerfil ? 'Guardando...' : 'Guardar correo y perfil'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CONTRASEÑA Y RECUPERACIÓN */}
          {tab === 'seguridad' && (
            <div className="space-y-5">
              {/* Bloque A: Cambiar contraseña */}
              <form onSubmit={handleCambiarPassword} className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#082F64]" />
                    <span>Cambiar contraseña de acceso</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMostrarPwds((v) => !v)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {mostrarPwds ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{mostrarPwds ? 'Ocultar' : 'Mostrar'}</span>
                  </button>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contraseña actual:</label>
                  <input
                    type={mostrarPwds ? 'text' : 'password'}
                    required
                    value={pwdActual}
                    onChange={(e) => {
                      setPwdActual(e.target.value);
                      setErrorPwd(null);
                    }}
                    placeholder="Contraseña actual"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#082F64]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nueva contraseña:</label>
                    <input
                      type={mostrarPwds ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={pwdNueva}
                      onChange={(e) => {
                        setPwdNueva(e.target.value);
                        setErrorPwd(null);
                      }}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#082F64]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Confirmar nueva:</label>
                    <input
                      type={mostrarPwds ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={pwdConfirmar}
                      onChange={(e) => {
                        setPwdConfirmar(e.target.value);
                        setErrorPwd(null);
                      }}
                      placeholder="Repite la nueva clave"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-[#082F64]"
                    />
                  </div>
                </div>

                {errorPwd && (
                  <p className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
                    {errorPwd}
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={guardandoPwd}
                    className="px-4 py-2 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] disabled:opacity-50 text-white font-bold cursor-pointer"
                  >
                    {guardandoPwd ? 'Actualizando...' : 'Actualizar contraseña'}
                  </button>
                </div>
              </form>

              {/* Bloque B: Cómo recuperar si se olvida */}
              <form onSubmit={handleGuardarRecuperacion} className="space-y-3 p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                <h3 className="font-extrabold text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Respaldo por si olvidas tu contraseña</span>
                </h3>

                {/* Estado de recuperación por correo */}
                <div
                  className={`p-2.5 rounded-lg border text-[11px] flex items-start gap-2 ${
                    oauthConectado
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-white border-amber-200 text-slate-700'
                  }`}
                >
                  <Mail className={`w-4 h-4 shrink-0 mt-0.5 ${oauthConectado ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <div>
                    <p className="font-bold">
                      {oauthConectado
                        ? `Recuperación por correo ACTIVA (${oauthEmail})`
                        : 'Recuperación por correo (pendiente de vincular Google)'}
                    </p>
                    <p className="text-[10px] opacity-90 mt-0.5">
                      {oauthConectado
                        ? 'Si olvidas tu clave, en el inicio de sesión podrás pedir un código de 6 dígitos directo a tu @unitru.edu.pe.'
                        : 'Cuando vincules tu correo en Jueves y Flyers → ⚙️, también podrás recuperar con código de 6 dígitos al correo.'}
                    </p>
                  </div>
                </div>

                {/* Pregunta / palabra clave de respaldo */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Pregunta o referencia secreta de respaldo:
                    {cuentaActual?.respuestaRecuperacionHash && (
                      <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" /> Configurada
                      </span>
                    )}
                  </label>
                  <select
                    value={PREGUNTAS_SUGERIDAS.includes(preguntaRec) ? preguntaRec : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') setPreguntaRec(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-slate-800 mb-2 focus:outline-hidden focus:border-[#082F64]"
                  >
                    {PREGUNTAS_SUGERIDAS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                    <option value="custom">Escribir mi propia pregunta...</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={preguntaRec}
                    onChange={(e) => setPreguntaRec(e.target.value)}
                    placeholder="Ej. ¿Cuál es el nombre de tu primera mascota?"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-slate-900 focus:outline-hidden focus:border-[#082F64]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Tu respuesta o palabra clave secreta:
                  </label>
                  <input
                    type="text"
                    required
                    value={respuestaRec}
                    onChange={(e) => setRespuestaRec(e.target.value)}
                    placeholder={
                      cuentaActual?.respuestaRecuperacionHash
                        ? 'Escribe una nueva respuesta solo si deseas cambiarla'
                        : 'Ej. Firulais (se guarda cifrada)'
                    }
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-slate-900 focus:outline-hidden focus:border-[#082F64]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    No distingue mayúsculas ni minúsculas. Te permitirá crear una clave nueva desde «¿Olvidaste tu contraseña?» incluso sin abrir tu correo.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={guardandoRec}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold cursor-pointer"
                  >
                    {guardandoRec ? 'Guardando...' : 'Guardar palabra de recuperación'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: OTRAS CUENTAS DE SECRETARÍA */}
          {tab === 'equipo' && (
            <div className="space-y-4">
              <div className="space-y-2">
                {cuentasSecretaria.map((sec) => {
                  const esYo = sec.correo.toLowerCase() === (usuario?.email || '').toLowerCase();
                  return (
                    <div
                      key={sec.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span className="truncate">{sec.nombre}</span>
                          {esYo && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[#082F64] text-[10px] font-bold">
                              Tu cuenta
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              sec.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {sec.activo ? 'Activa' : 'Suspendida'}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-slate-600 truncate">{sec.correo}</p>
                      </div>

                      {!esYo && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => resetearPasswordSecretaria(sec.id)}
                            title="Restablecer clave a inicial (UNT2026*)"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-amber-50 text-amber-700 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActivoSecretaria(sec.id)}
                            className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 cursor-pointer"
                          >
                            {sec.activo ? 'Pausar' : 'Activar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarSecretaria(sec.id)}
                            title="Eliminar cuenta"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleAgregarCuenta} className="p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#082F64]" />
                  <span>Agregar cuenta adicional de Secretaría / Asistente</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="Nombre completo"
                    className="px-3 py-2 rounded-xl border border-slate-300"
                  />
                  <input
                    type="email"
                    required
                    value={nuevoCorreo}
                    onChange={(e) => setNuevoCorreo(e.target.value)}
                    placeholder="usuario@unitru.edu.pe"
                    className="px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={nuevoCargo}
                    onChange={(e) => setNuevoCargo(e.target.value)}
                    placeholder="Cargo"
                    className="px-3 py-2 rounded-xl border border-slate-300"
                  />
                  <input
                    type="text"
                    value={nuevaClaveInicial}
                    onChange={(e) => setNuevaClaveInicial(e.target.value)}
                    placeholder="Clave inicial (vacío = UNT2026*)"
                    className="px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={agregandoCuenta}
                    className="px-3.5 py-2 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] disabled:opacity-50 text-white font-bold cursor-pointer"
                  >
                    {agregandoCuenta ? 'Creando...' : 'Agregar cuenta'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
