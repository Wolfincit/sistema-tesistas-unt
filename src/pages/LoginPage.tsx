import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { sanitizarTextoSeguro } from '../utils/security';
import {
  User,
  ArrowRight,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldQuestion,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

interface LoginPageProps {
  onClose?: () => void;
}

const LAST_EMAIL_KEY = 'unt_industrial_last_sec_email';

export const LoginPage: React.FC<LoginPageProps> = ({ onClose }) => {
  const { iniciarSesion, refrescarTodo, agregarToast } = useApp();
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(LAST_EMAIL_KEY) || 'secretaria.industrial@unitru.edu.pe';
    } catch {
      return 'secretaria.industrial@unitru.edu.pe';
    }
  });
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flujo de recuperación de contraseña
  const [modo, setModo] = useState<'login' | 'recuperar'>('login');
  const [pasoRec, setPasoRec] = useState<'correo' | 'metodo' | 'verificar'>('correo');
  const [cargandoRec, setCargandoRec] = useState(false);
  const [emailReadyRec, setEmailReadyRec] = useState(false);
  const [hasQuestionRec, setHasQuestionRec] = useState(false);
  const [securityQuestionRec, setSecurityQuestionRec] = useState('');
  const [metodoElegido, setMetodoElegido] = useState<'email_code' | 'security_question'>('email_code');
  const [codigoORespuesta, setCodigoORespuesta] = useState('');
  const [nuevaClaveRec, setNuevaClaveRec] = useState('');
  const [confirmarClaveRec, setConfirmarClaveRec] = useState('');
  const [infoRec, setInfoRec] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailSanitizado = sanitizarTextoSeguro(email);
    if (/[<>"';()]/.test(email) || emailSanitizado !== email.trim()) {
      setError('Correo no válido.');
      return;
    }

    const exito = iniciarSesion(emailSanitizado, 'secretaria', password);
    if (exito) {
      try {
        localStorage.setItem(LAST_EMAIL_KEY, emailSanitizado.toLowerCase());
      } catch {
        // Silencioso
      }
      if (onClose) onClose();
    } else {
      setError('Correo o contraseña incorrectos.');
    }
  };

  const abrirRecuperacion = () => {
    setError(null);
    setInfoRec(null);
    setModo('recuperar');
    setPasoRec('correo');
    setCodigoORespuesta('');
    setNuevaClaveRec('');
    setConfirmarClaveRec('');
  };

  const handleConsultarOpcionesRec = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoRec(null);
    const limpio = sanitizarTextoSeguro(email).toLowerCase();
    if (!limpio.endsWith('@unitru.edu.pe')) {
      setError('Ingrese su correo institucional @unitru.edu.pe.');
      return;
    }
    setCargandoRec(true);
    try {
      const res = await fetch('/api/auth/recovery-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: limpio })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'No se encontró la cuenta.');
        return;
      }
      setEmailReadyRec(Boolean(data.emailReady));
      setHasQuestionRec(Boolean(data.hasSecurityQuestion));
      setSecurityQuestionRec(data.securityQuestion || '');
      setPasoRec('metodo');
    } catch {
      setError('No se pudo conectar con el servidor. Verifique su conexión a internet.');
    } finally {
      setCargandoRec(false);
    }
  };

  const handleSolicitarCodigoCorreo = async () => {
    setError(null);
    setInfoRec(null);
    setCargandoRec(true);
    try {
      const res = await fetch('/api/auth/request-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'No se pudo enviar el código.');
        return;
      }
      setMetodoElegido('email_code');
      setInfoRec(`Enviamos un código de 6 dígitos a ${data.sentTo}. Revisa tu bandeja (vence en 15 min).`);
      setPasoRec('verificar');
    } catch {
      setError('Error de conexión al enviar el código.');
    } finally {
      setCargandoRec(false);
    }
  };

  const handleElegirPregunta = () => {
    setError(null);
    setInfoRec(null);
    setMetodoElegido('security_question');
    setPasoRec('verificar');
  };

  const handleConfirmarReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (nuevaClaveRec.trim().length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nuevaClaveRec.trim() !== confirmarClaveRec.trim()) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    setCargandoRec(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          method: metodoElegido,
          codeOrAnswer: codigoORespuesta.trim(),
          newPassword: nuevaClaveRec.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'No se pudo restablecer la contraseña.');
        return;
      }

      // Recargar cuentas desde la nube para poder ingresar de inmediato con la nueva contraseña
      await refrescarTodo();
      agregarToast(
        'success',
        'Contraseña restablecida',
        'Ya puedes iniciar sesión con tu nueva contraseña.'
      );
      setPassword('');
      setModo('login');
      setInfoRec('Contraseña actualizada correctamente. Ingresa ahora con tu nueva clave.');
    } catch {
      setError('Error de conexión al guardar la nueva contraseña.');
    } finally {
      setCargandoRec(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#082F64] to-[#0C4D96] p-5 text-white relative">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <img
              src="/images/logo-unt.png"
              alt="Logo UNT"
              className="h-10 w-auto object-contain"
            />
            <div className="h-7 w-px bg-white/25" />
            <img
              src="/images/logo-industrial.png"
              alt="Logo Industrial UNT"
              className="h-10 w-auto object-contain"
            />
            <div className="pl-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                Ingeniería Industrial UNT
              </span>
              <h2 className="text-sm font-extrabold text-white leading-tight">
                {modo === 'login' ? 'Acceso Secretaría' : 'Recuperar Contraseña'}
              </h2>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {modo === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-3.5" autoComplete="off">
              {infoRec && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{infoRec}</span>
                </div>
              )}

              <div>
                <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1">
                  Correo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="secretaria.industrial@unitru.edu.pe"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#082F64]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="login-password" className="block text-xs font-bold text-slate-700">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={abrirRecuperacion}
                    className="text-[11px] font-semibold text-[#0C4D96] hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type={mostrarPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#082F64]"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    tabIndex={-1}
                  >
                    {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] text-white text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Ingresar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-3.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setModo('login');
                  setError(null);
                  setInfoRec(null);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-[#082F64] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al inicio de sesión</span>
              </button>

              {pasoRec === 'correo' && (
                <form onSubmit={handleConsultarOpcionesRec} className="space-y-3">
                  <p className="text-slate-600 leading-relaxed">
                    Ingresa tu correo institucional <strong>@unitru.edu.pe</strong> para ver tus opciones de recuperación.
                  </p>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="secretaria.industrial@unitru.edu.pe"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-hidden focus:border-[#082F64]"
                  />

                  {error && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={cargandoRec}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] disabled:opacity-50 text-white font-bold cursor-pointer"
                  >
                    {cargandoRec ? 'Verificando...' : 'Continuar'}
                  </button>
                </form>
              )}

              {pasoRec === 'metodo' && (
                <div className="space-y-3">
                  <p className="text-slate-600">
                    Cuenta detectada: <strong className="font-mono text-slate-900">{email}</strong>
                  </p>

                  {emailReadyRec && (
                    <button
                      type="button"
                      disabled={cargandoRec}
                      onClick={handleSolicitarCodigoCorreo}
                      className="w-full p-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-left flex items-start gap-2.5 transition-colors cursor-pointer"
                    >
                      <Mail className="w-4 h-4 text-[#082F64] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-[#082F64]">
                          {cargandoRec ? 'Enviando código...' : 'Enviar código de 6 dígitos a mi correo'}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Te llegará un código temporal al @unitru.edu.pe (válido 15 min).
                        </div>
                      </div>
                    </button>
                  )}

                  {hasQuestionRec && (
                    <button
                      type="button"
                      onClick={handleElegirPregunta}
                      className="w-full p-3 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-left flex items-start gap-2.5 transition-colors cursor-pointer"
                    >
                      <ShieldQuestion className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-amber-950">Usar mi palabra clave de recuperación</div>
                        <div className="text-[11px] text-amber-900/80">{securityQuestionRec}</div>
                      </div>
                    </button>
                  )}

                  {!emailReadyRec && !hasQuestionRec && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 leading-relaxed space-y-1.5">
                      <p className="font-bold">Aún no hay un método de recuperación configurado.</p>
                      <p className="text-[11px]">
                        Para activar la recuperación automática, primero ingresa con la clave inicial entregada por la Escuela y configura tu <strong>palabra de recuperación</strong> (arriba en tu perfil) o vincula tu correo Google en <strong>Jueves y Flyers → ⚙️</strong>.
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              )}

              {pasoRec === 'verificar' && (
                <form onSubmit={handleConfirmarReset} className="space-y-3">
                  {infoRec && (
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#082F64] text-[11px]">
                      {infoRec}
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {metodoElegido === 'email_code'
                        ? 'Código de 6 dígitos enviado a tu correo:'
                        : securityQuestionRec || 'Tu palabra clave de recuperación:'}
                    </label>
                    <input
                      type="text"
                      required
                      value={codigoORespuesta}
                      onChange={(e) => {
                        setCodigoORespuesta(e.target.value);
                        setError(null);
                      }}
                      placeholder={
                        metodoElegido === 'email_code' ? 'Ej. 482910' : 'Escribe tu respuesta secreta'
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono focus:outline-hidden focus:border-[#082F64]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nueva contraseña:</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={nuevaClaveRec}
                      onChange={(e) => {
                        setNuevaClaveRec(e.target.value);
                        setError(null);
                      }}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:border-[#082F64]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Confirmar nueva contraseña:</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmarClaveRec}
                      onChange={(e) => {
                        setConfirmarClaveRec(e.target.value);
                        setError(null);
                      }}
                      placeholder="Repite tu nueva contraseña"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:border-[#082F64]"
                    />
                  </div>

                  {error && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={cargandoRec}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold cursor-pointer"
                  >
                    {cargandoRec ? 'Guardando...' : 'Restablecer contraseña'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
