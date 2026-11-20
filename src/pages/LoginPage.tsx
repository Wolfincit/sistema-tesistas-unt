import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { sanitizarTextoSeguro } from '../utils/security';
import {
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  X,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';

interface LoginPageProps {
  onClose?: () => void;
}

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generarCodigoCaptcha(longitud = 5): string {
  let res = '';
  for (let i = 0; i < longitud; i++) {
    res += CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length));
  }
  return res;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onClose }) => {
  const { iniciarSesion } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [rolElegido, setRolElegido] = useState<UserRole>('tesista');
  const [error, setError] = useState<string | null>(null);

  // CAPTCHA Visual renderizado en Canvas HTML5 (0 texto plano en el DOM -> resistente a DOM scraping)
  const [captchaCodigo, setCaptchaCodigo] = useState<string>(() => generarCodigoCaptcha(5));
  const [captchaInput, setCaptchaInput] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trampa Honeypot + Temporizador anti-scripts automatizados
  const [honeypotTrap, setHoneypotTrap] = useState<string>('');
  const mountedAtRef = useRef<number>(Date.now());

  // Protección Anti-Fuerza Bruta (Bloqueo tras 5 intentos fallidos)
  const [intentosFallidos, setIntentosFallidos] = useState<number>(0);
  const [bloqueadoHasta, setBloqueadoHasta] = useState<number>(0);
  const [segundosRestantes, setSegundosRestantes] = useState<number>(0);

  const regenerarCaptcha = useCallback(() => {
    setCaptchaCodigo(generarCodigoCaptcha(5));
    setCaptchaInput('');
  }, []);

  // Dibujar CAPTCHA en Canvas con distorsión, líneas y puntos de ruido
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Fondo degradado institucional oscuro
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#082F64');
    grad.addColorStop(1, '#0F172A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Puntos de ruido anti-OCR
    for (let i = 0; i < 48; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(147,197,253,0.35)' : 'rgba(251,191,36,0.3)';
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.6 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Líneas de interferencia
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(96,165,250,0.45)' : 'rgba(251,191,36,0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 18, Math.random() * h);
      ctx.bezierCurveTo(
        w * 0.35,
        Math.random() * h,
        w * 0.65,
        Math.random() * h,
        w - Math.random() * 14,
        Math.random() * h
      );
      ctx.stroke();
    }

    // Dibujar caracteres con rotación y desplazamiento individual
    captchaCodigo.split('').forEach((char, idx) => {
      ctx.save();
      const x = 18 + idx * 26;
      const y = 26 + (Math.random() * 6 - 3);
      const angle = (Math.random() * 0.42) - 0.21;
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.font = `bold ${19 + Math.floor(Math.random() * 3)}px monospace`;
      ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#FDE68A';
      ctx.textAlign = 'center';
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
  }, [captchaCodigo]);

  useEffect(() => {
    if (bloqueadoHasta <= Date.now()) {
      setSegundosRestantes(0);
      return;
    }
    const timer = setInterval(() => {
      const diff = Math.max(0, Math.ceil((bloqueadoHasta - Date.now()) / 1000));
      setSegundosRestantes(diff);
      if (diff <= 0) {
        setIntentosFallidos(0);
        regenerarCaptcha();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [bloqueadoHasta, regenerarCaptcha]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Trampa Honeypot + Temporizador anti-scripts automatizados
    if (honeypotTrap.trim() !== '' || Date.now() - mountedAtRef.current < 450) {
      setError('Solicitud bloqueada por protección anti-bots y anti-scripts.');
      regenerarCaptcha();
      return;
    }

    // 2. Verificación de bloqueo temporal por fuerza bruta
    if (bloqueadoHasta > Date.now()) {
      setError(`Acceso bloqueado temporalmente por seguridad. Espere ${segundosRestantes}s.`);
      return;
    }

    // 3. Sanitización anti-inyección / anti-XSS
    const emailSanitizado = sanitizarTextoSeguro(email);
    if (/[<>"';()]/.test(email) || emailSanitizado !== email.trim()) {
      setError('Caracteres no permitidos detectados en el correo.');
      regenerarCaptcha();
      return;
    }

    // 4. Validación del CAPTCHA visual de Canvas
    if (captchaInput.trim().toUpperCase() !== captchaCodigo.toUpperCase()) {
      const nuevosIntentos = intentosFallidos + 1;
      setIntentosFallidos(nuevosIntentos);
      regenerarCaptcha();
      if (nuevosIntentos >= 5) {
        const lockTime = Date.now() + 60 * 1000;
        setBloqueadoHasta(lockTime);
        setSegundosRestantes(60);
        setError('Demasiados intentos fallidos. Acceso bloqueado por 60 segundos.');
      } else {
        setError('El código de seguridad CAPTCHA no coincide. Intente nuevamente.');
      }
      return;
    }

    // 5. Autenticación con Correo Autorizado + Contraseña (SHA-256)
    const exito = iniciarSesion(emailSanitizado, rolElegido, password);
    if (exito) {
      setIntentosFallidos(0);
      if (onClose) onClose();
    } else {
      const nuevosIntentos = intentosFallidos + 1;
      setIntentosFallidos(nuevosIntentos);
      regenerarCaptcha();
      if (nuevosIntentos >= 5) {
        const lockTime = Date.now() + 60 * 1000;
        setBloqueadoHasta(lockTime);
        setSegundosRestantes(60);
        setError('Se superó el límite de 5 intentos. Bloqueo de seguridad activo por 60s.');
      } else {
        setError(
          rolElegido === 'tesista'
            ? `Credenciales inválidas (Intento ${nuevosIntentos}/5). Verifique su correo habilitado y su contraseña (inicialmente su N° de Matrícula).`
            : `Credenciales de Secretaría incorrectas (Intento ${nuevosIntentos}/5).`
        );
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Azul Institucional */}
        <div className="bg-gradient-to-r from-[#082F64] to-[#0C4D96] p-5 text-white relative">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white cursor-pointer"
              title="Volver al Repositorio Público"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <img
              src="/images/logo-unt.png"
              alt="Logo UNT"
              className="h-11 w-auto object-contain"
            />
            <div className="h-8 w-px bg-white/25" />
            <img
              src="/images/logo-industrial.png"
              alt="Logo Industrial UNT"
              className="h-11 w-auto object-contain"
            />
            <div className="pl-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                Acceso Privado • Titulación UNT
              </span>
              <h2 className="text-base font-extrabold text-white leading-tight">
                Módulo de Tesistas y Secretaría
              </h2>
            </div>
          </div>
        </div>

        {/* Cuerpo del Modal (Privado — Sin exponer padrón ni correos habilitados) */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Selector de Rol */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setRolElegido('tesista');
                setError(null);
                regenerarCaptcha();
              }}
              className={`py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                rolElegido === 'tesista'
                  ? 'bg-[#082F64] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tesista Habilitado
            </button>

            <button
              type="button"
              onClick={() => {
                setRolElegido('secretaria');
                setError(null);
                regenerarCaptcha();
              }}
              className={`py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                rolElegido === 'secretaria'
                  ? 'bg-[#082F64] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Secretaría Académica
            </button>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
            <Lock className="w-4 h-4 text-[#082F64] shrink-0 mt-0.5" />
            <span>
              {rolElegido === 'tesista'
                ? 'Acceso exclusivo para tesistas de último ciclo acreditados por Secretaría. Su contraseña inicial es su Número de Matrícula (podrá cambiarla al ingresar).'
                : 'Acceso administrativo restringido para Secretaría Académica de Ingeniería Industrial.'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5" autoComplete="off">
            {/* Campo Honeypot invisible contra bots de scraping */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                name="website_url_verification"
                tabIndex={-1}
                value={honeypotTrap}
                onChange={(e) => setHoneypotTrap(e.target.value)}
                autoComplete="off"
              />
            </div>

            {/* Correo Institucional */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1">
                Correo Institucional
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  disabled={segundosRestantes > 0}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="usuario@unitru.edu.pe"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#082F64] disabled:bg-slate-100 transition-colors"
                />
              </div>
            </div>

            {/* Contraseña (N° de Matrícula o Contraseña Personalizada) */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 mb-1">
                {rolElegido === 'tesista'
                  ? 'Contraseña (N° de Matrícula o Clave Personal)'
                  : 'Contraseña de Secretaría'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type={mostrarPassword ? 'text' : 'password'}
                  required
                  disabled={segundosRestantes > 0}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder={rolElegido === 'tesista' ? 'Ej. su número de matrícula' : '••••••••'}
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#082F64] disabled:bg-slate-100 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  tabIndex={-1}
                  title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Verificación CAPTCHA en Canvas HTML5 (0 texto plano en el DOM -> Anti-Scraping) */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#082F64]" />
                  <span>Verificación de Seguridad (CAPTCHA)</span>
                </span>
                <button
                  type="button"
                  onClick={regenerarCaptcha}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1765B5] hover:underline cursor-pointer"
                  title="Generar nuevo código"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Cambiar código</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <canvas
                  ref={canvasRef}
                  width={148}
                  height={40}
                  className="rounded-lg border border-slate-300 select-none shrink-0"
                  aria-label="Código gráfico de seguridad"
                />

                <input
                  type="text"
                  required
                  maxLength={5}
                  disabled={segundosRestantes > 0}
                  value={captchaInput}
                  onChange={(e) => {
                    setCaptchaInput(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="Escriba los 5 caracteres"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#082F64]"
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={segundosRestantes > 0}
              className="w-full py-2.5 px-4 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] disabled:opacity-60 text-white text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>
                {segundosRestantes > 0
                  ? `Bloqueado por seguridad (${segundosRestantes}s)`
                  : 'Ingresar al Módulo de Titulación'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
