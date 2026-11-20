import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  X, 
  Sparkles, 
  MessageSquare, 
  Heart, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Minus,
  Bot,
  User,
  ExternalLink,
  BookOpen,
  Award
} from 'lucide-react';
import { aiAdvisorService, ChatMessage } from '../../services/aiAdvisorService';

interface GrifitoMascotProps {
  modo?: 'flotante' | 'fijo';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animado?: boolean;
  mostrarMensaje?: boolean;
  mensaje?: string;
  onClick?: () => void;
  className?: string;
}

export const GrifitoMascot: React.FC<GrifitoMascotProps> = ({
  modo = 'flotante',
  size = 'md',
  animado = true,
  className = ''
}) => {
  const [tipoMascota, setTipoMascota] = useState<'grifito' | 'tuerquita'>('grifito');
  const [chatAbierto, setChatAbierto] = useState(false);
  const [minimizado, setMinimizado] = useState(true);
  const [parpadeando, setParpadeando] = useState(false);
  const [celebrando, setCelebrando] = useState(false);
  const [modoPaseo, setModoPaseo] = useState(false);
  const [globoVisible, setGloboVisible] = useState(false);

  // Estados del Chatbot Conversacional IA
  const [mensajes, setMensajes] = useState<ChatMessage[]>([
    {
      id: 'welcome-grifi',
      remitente: 'ia',
      texto: '¡Hola! Soy Grifito UNT, tu asistente de inteligencia artificial para titulación en Ingeniería Industrial. ¿En qué puedo ayudarte hoy?',
      fecha: 'En línea'
    }
  ]);
  const [inputTexto, setInputTexto] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sugerencias de consulta rápida con 1 clic
  const sugerenciasRapidas = [
    'Recomiéndame temas de tesis para Ingeniería Industrial',
    '¿Cómo reduzco el Turnitin a menos del 20%?',
    '¿Cuáles son los 5 requisitos obligatorios?',
    '¿Cómo reservo el auditorio para mi sustentación?',
    '¿Quiénes son los docentes asesores por área?'
  ];

  // Parpadeo suave cada 3.5 segundos
  useEffect(() => {
    const intervaloParpadeo = setInterval(() => {
      setParpadeando(true);
      setTimeout(() => setParpadeando(false), 200);
    }, 3500);
    return () => clearInterval(intervaloParpadeo);
  }, []);

  // Auto-scroll al final del chat
  useEffect(() => {
    if (chatAbierto) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes, escribiendo, chatAbierto]);

  const handleAbrirChat = () => {
    setCelebrando(true);
    setChatAbierto(true);
    setGloboVisible(false);
    setTimeout(() => setCelebrando(false), 1000);
  };

  const handleEnviarMensaje = async (textoAEnviar?: string) => {
    const consulta = (textoAEnviar || inputTexto).trim();
    if (!consulta || escribiendo) return;

    const ahora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    const msgUsuario: ChatMessage = {
      id: `usr-${Date.now()}`,
      remitente: 'usuario',
      texto: consulta,
      fecha: ahora
    };

    setMensajes((prev) => [...prev, msgUsuario]);
    setInputTexto('');
    setEscribiendo(true);

    try {
      // Simular delay de análisis inteligente
      const respuesta = await aiAdvisorService.consultarAsistente(consulta);
      setTimeout(() => {
        setMensajes((prev) => [...prev, respuesta]);
        setEscribiendo(false);
      }, 650);
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          remitente: 'ia',
          texto: 'Disculpa, tuve un inconveniente al consultar la base de datos de tesis. Por favor vuelve a formular tu pregunta.',
          fecha: ahora
        }
      ]);
      setEscribiendo(false);
    }
  };

  const handleReiniciarChat = () => {
    setMensajes([
      {
        id: `welcome-${Date.now()}`,
        remitente: 'ia',
        texto: '¡Conversación reiniciada! Pregúntame sobre antecedentes, directivas de Turnitin, trámites o docentes de Ingeniería Industrial UNT.',
        fecha: 'En línea'
      }
    ]);
  };

  const alternarTipo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTipoMascota((prev) => (prev === 'grifito' ? 'tuerquita' : 'grifito'));
  };

  return (
    <div
      className={`${
        modo === 'flotante'
          ? modoPaseo && !chatAbierto
            ? 'fixed bottom-4 z-40 animate-[grifitoWalk_24s_linear_infinite]'
            : 'fixed bottom-4 right-5 z-40'
          : 'relative inline-block'
      } ${className}`}
    >
      {/* 1. VENTANA DE CHATBOT CONVERSACIONAL IA (SE ABRE AL DAR CLIC A GRIFI) */}
      {chatAbierto && (
        <div className="chat-window-unt w-[360px] sm:w-[420px] max-w-[calc(100vw-2rem)] h-[530px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-800">
          
          {/* Header del Chatbot */}
          <div className="p-3.5 bg-gradient-to-r from-[#082F64] to-[#0C4D96] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-lg shadow-xs">
                {tipoMascota === 'grifito' ? '🦅' : '⚙️'}
              </div>
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>{tipoMascota === 'grifito' ? 'Grifito UNT' : 'Tuerquita Industrial'}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-1.5 py-0.2 rounded-full font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    IA Activa
                  </span>
                </div>
                <div className="text-[10px] text-blue-200">
                  Asesor Virtual de Tesis • Ing. Industrial
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={alternarTipo}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Cambiar apariencia de mascota"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleReiniciarChat}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Limpiar chat"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setChatAbierto(false);
                  setMinimizado(true);
                }}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Minimizar a píldora discreta"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChatAbierto(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Cerrar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70 text-xs">
            {mensajes.map((msg) => {
              const esIa = msg.remitente === 'ia';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${esIa ? 'items-start' : 'items-end justify-end'}`}
                >
                  {esIa && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-slate-900 flex items-center justify-center shrink-0 text-xs shadow-xs font-bold">
                      {tipoMascota === 'grifito' ? '🦅' : '⚙️'}
                    </div>
                  )}

                  <div className={`space-y-2 max-w-[85%] ${esIa ? '' : 'text-right'}`}>
                    <div
                      className={`p-3 rounded-2xl leading-relaxed whitespace-pre-line shadow-xs ${
                        esIa
                          ? 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                          : 'bg-[#082F64] text-white rounded-tr-xs text-left'
                      }`}
                    >
                      {msg.texto}
                    </div>

                    {/* Fichas de Tesis Recomendadas si las hay */}
                    {msg.tesisSugeridas && msg.tesisSugeridas.length > 0 && (
                      <div className="space-y-1.5 pt-1 text-left">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-[#1765B5]" />
                          <span>Tesis sugeridas del catálogo:</span>
                        </div>
                        {msg.tesisSugeridas.map((tesis) => (
                          <div
                            key={tesis.id}
                            className="p-2.5 rounded-xl bg-white border border-blue-200/80 shadow-2xs space-y-1 hover:border-[#1765B5] transition-colors"
                          >
                            <div className="text-[10px] font-bold text-[#082F64] line-clamp-2">
                              {tesis.titulo}
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-slate-500">
                              <span>{tesis.autor} ({tesis.anio})</span>
                              <span className="font-semibold text-emerald-700">{tesis.area}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Consejo Logístico o de Grifi */}
                    {msg.consejoLogistico && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-snug text-left font-medium">
                        {msg.consejoLogistico}
                      </div>
                    )}

                    <div className="text-[9px] text-slate-400 font-mono">
                      {msg.fecha}
                    </div>
                  </div>

                  {!esIa && (
                    <div className="w-7 h-7 rounded-full bg-[#082F64] text-white flex items-center justify-center shrink-0 text-xs shadow-xs">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Indicador de escritura animado */}
            {escribiendo && (
              <div className="flex items-center gap-2 text-slate-500 text-xs italic bg-white p-2.5 rounded-xl border border-slate-200 w-fit">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Grifito está analizando el repositorio...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Sugerencias Rápidas */}
          <div className="px-3 py-2 bg-slate-100/90 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {sugerenciasRapidas.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleEnviarMensaje(sug)}
                className="sugerencia-chip whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[10px] font-medium text-slate-700 hover:text-[#082F64] transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Barra de Entrada de Consulta */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEnviarMensaje();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              placeholder="Escribe tu consulta a Grifito..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-[#1765B5] transition-colors"
            />
            <button
              type="submit"
              disabled={!inputTexto.trim() || escribiendo}
              className="p-2 bg-[#082F64] hover:bg-[#0C4D96] disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              title="Enviar mensaje a la IA"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* 2. PERSONAJE FLOTANTE ANIMADO EN LA ESQUINA INFERIOR (GRIFI / TUERQUITA) */}
      {!chatAbierto && (
        minimizado ? (
          /* MODO ULTRA-COMPACTO: BOTÓN PÍLDORA DISCRETO QUE NUNCA ESTORBA EN LA PÁGINA */
          <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={handleAbrirChat}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#082F64] hover:bg-[#0C4D96] text-white shadow-xl border border-amber-400/50 text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 group"
              title="Abrir Asesor de Tesis IA (Grifito UNT)"
            >
              <span className="text-base leading-none">
                {tipoMascota === 'grifito' ? '🦅' : '⚙️'}
              </span>
              <span className="text-[11px] font-bold text-amber-300">Asesor IA</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              type="button"
              onClick={() => setMinimizado(false)}
              className="p-1.5 rounded-full bg-white/95 hover:bg-white text-slate-600 hover:text-[#082F64] shadow-md border border-slate-200 text-xs transition-all cursor-pointer hover:scale-105"
              title="Expandir mascota animada"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* MODO COMPLETO: MASCOTA FLOTANTE CON BOTÓN PARA MINIMIZAR SI ESTORBA */
          <div className="flex flex-col items-end animate-in fade-in zoom-in-95 duration-200">
            {/* Barra superior de control para minimizar */}
            <div className="flex items-center gap-1 mb-1 mr-2">
              <button
                type="button"
                onClick={() => setMinimizado(true)}
                className="px-2.5 py-0.5 rounded-full bg-white/95 hover:bg-white text-slate-600 hover:text-slate-900 shadow-md border border-slate-200 text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer hover:scale-105"
                title="Minimizar para que no estorbe en la pantalla"
              >
                <Minus className="w-3 h-3 text-slate-500" />
                <span>Minimizar</span>
              </button>
            </div>

            {/* Globo inicial invitando a chatear */}
            {globoVisible && (
              <div 
                className="mb-2 mr-2 bg-white/95 backdrop-blur-sm border-2 border-amber-300 rounded-2xl px-3.5 py-2 shadow-xl text-xs text-slate-800 relative group"
              >
                <div className="absolute -bottom-2 right-8 w-3.5 h-3.5 bg-white border-r-2 border-b-2 border-amber-300 transform rotate-45" />
                <div className="flex items-center justify-between gap-3">
                  <div
                    onClick={handleAbrirChat}
                    className="flex items-center gap-1.5 font-bold text-[#082F64] text-[11px] cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    <span>¡Pregúntame lo que quieras!</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGloboVisible(false);
                    }}
                    className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                    title="Cerrar mensaje"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p 
                  onClick={handleAbrirChat}
                  className="text-[10px] text-slate-600 mt-0.5 cursor-pointer"
                >
                  Haz clic aquí para hablar con la IA 💬
                </p>
              </div>
            )}

            <div className="relative flex items-center gap-1 group">
              {/* Botón flotante para abrir chat directamente */}
              <button
                type="button"
                onClick={handleAbrirChat}
                className="px-2.5 py-1.5 rounded-full bg-[#082F64] hover:bg-[#0C4D96] text-white shadow-lg border border-white/30 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer mr-1 animate-pulse"
                title="Abrir conversación con Grifito IA"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
                <span>Hablar con IA</span>
              </button>

          {/* SVG Vectorial Interactivo de Grifi */}
          <div
            onClick={handleAbrirChat}
            className={`cursor-pointer transform transition-transform select-none ${
              celebrando ? 'scale-125 rotate-6' : 'hover:scale-110'
            }`}
            title="¡Haz clic en mí para chatear con la IA!"
          >
            {/* Partículas de celebración */}
            {celebrando && (
              <div className="absolute -top-4 -left-2 flex items-center gap-1 animate-bounce pointer-events-none">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
            )}

            {tipoMascota === 'grifito' ? (
              /* GRIFITO UNT TIERNO */
              <div className="relative w-22 h-22 sm:w-24 sm:h-24 animate-grifito-float drop-shadow-xl">
                <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                  <ellipse cx="50" cy="94" rx="26" ry="4" fill="#082F64" fillOpacity="0.2" />

                  {/* Cola esponjosa */}
                  <g className="animate-grifito-tail">
                    <path
                      d="M26 74 C16 70, 8 82, 14 90 C22 92, 26 84, 28 78 Z"
                      fill="#F59E0B"
                      stroke="#B45309"
                      strokeWidth="2"
                    />
                    <path d="M12 84 C18 84, 20 86, 22 88" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
                  </g>

                  {/* Alita Izquierda */}
                  <path
                    className="animate-wing-left"
                    d="M26 48 C12 36, 6 52, 18 68 C24 64, 26 56, 28 50 Z"
                    fill="#FBBF24"
                    stroke="#D97706"
                    strokeWidth="2.2"
                  />

                  {/* Alita Derecha */}
                  <path
                    className="animate-wing-right"
                    d="M74 48 C88 36, 94 52, 82 68 C76 64, 74 56, 72 50 Z"
                    fill="#FBBF24"
                    stroke="#D97706"
                    strokeWidth="2.2"
                  />

                  {/* Cuerpo redondito tierno */}
                  <circle cx="50" cy="56" r="28" fill="#FDE047" stroke="#CA8A04" strokeWidth="2.5" />
                  <ellipse cx="50" cy="62" rx="16" ry="14" fill="#FEF08A" />

                  {/* Plumas en la cabeza */}
                  <path d="M30 32 L36 44 L26 42 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1.8" />
                  <path d="M70 32 L64 44 L74 42 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1.8" />

                  {/* Ojos grandes tiernos con parpadeo */}
                  {parpadeando ? (
                    <>
                      <path d="M36 48 Q42 54 48 48" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />
                      <path d="M52 48 Q58 54 64 48" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />
                    </>
                  ) : (
                    <>
                      <circle cx="42" cy="48" r="6" fill="#0F172A" />
                      <circle cx="40" cy="46" r="2.4" fill="#FFFFFF" />
                      <circle cx="44" cy="49" r="1" fill="#FFFFFF" />

                      <circle cx="58" cy="48" r="6" fill="#0F172A" />
                      <circle cx="56" cy="46" r="2.4" fill="#FFFFFF" />
                      <circle cx="60" cy="49" r="1" fill="#FFFFFF" />
                    </>
                  )}

                  {/* Mejillas sonrosadas */}
                  <ellipse cx="34" cy="54" rx="4" ry="2.5" fill="#FB7185" fillOpacity="0.7" />
                  <ellipse cx="66" cy="54" rx="4" ry="2.5" fill="#FB7185" fillOpacity="0.7" />

                  {/* Pico de aguilucho */}
                  <path
                    d="M46 54 C46 54, 50 63, 54 54 C51 56, 48 56, 46 54 Z"
                    fill="#EA580C"
                    stroke="#9A3412"
                    strokeWidth="1.8"
                  />

                  {/* Engranaje Industrial Azul UNT como Collarín */}
                  <g>
                    <circle cx="50" cy="74" r="11" fill="#082F64" stroke="#1765B5" strokeWidth="2" />
                    <rect x="47.5" y="61" width="5" height="3" rx="1" fill="#082F64" />
                    <rect x="47.5" y="84" width="5" height="3" rx="1" fill="#082F64" />
                    <rect x="37" y="71.5" width="3" height="5" rx="1" fill="#082F64" />
                    <rect x="60" y="71.5" width="3" height="5" rx="1" fill="#082F64" />
                    <circle cx="50" cy="74" r="4.5" fill="#FDE047" />
                    <circle cx="50" cy="74" r="2" fill="#082F64" />
                  </g>

                  {/* Birrete Académico UNT */}
                  <g>
                    <polygon points="50,14 74,23 50,31 26,23" fill="#082F64" stroke="#051F42" strokeWidth="2.2" />
                    <rect x="42" y="26" width="16" height="6" rx="2" fill="#0C4D96" />
                    <line x1="50" y1="23" x2="68" y2="31" stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round" />
                    <circle cx="68" cy="32" r="2.8" fill="#F59E0B" />
                  </g>
                </svg>
              </div>
            ) : (
              /* TUERQUITA TIERNA ADORABLE */
              <div className="relative w-22 h-22 sm:w-24 sm:h-24 animate-grifito-float drop-shadow-xl">
                <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                  <ellipse cx="50" cy="94" rx="26" ry="4" fill="#082F64" fillOpacity="0.2" />

                  <g className="animate-[spin_18s_linear_infinite]" style={{ transformOrigin: '50px 52px' }}>
                    <circle cx="50" cy="52" r="30" fill="#0C4D96" stroke="#082F64" strokeWidth="3" />
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                      <rect
                        key={deg}
                        x="46"
                        y="18"
                        width="8"
                        height="8"
                        rx="2"
                        fill="#082F64"
                        transform={`rotate(${deg} 50 52)`}
                      />
                    ))}
                    <circle cx="50" cy="52" r="22" fill="#1765B5" />
                  </g>

                  <circle cx="50" cy="52" r="19" fill="#FFFFFF" />

                  {parpadeando ? (
                    <>
                      <path d="M42 48 Q46 53 50 48" stroke="#082F64" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                      <path d="M50 48 Q54 53 58 48" stroke="#082F64" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    </>
                  ) : (
                    <>
                      <circle cx="44" cy="49" r="4" fill="#082F64" />
                      <circle cx="43" cy="47" r="1.5" fill="#FFFFFF" />

                      <circle cx="56" cy="49" r="4" fill="#082F64" />
                      <circle cx="55" cy="47" r="1.5" fill="#FFFFFF" />
                    </>
                  )}

                  <path
                    d="M45 56 Q50 63 55 56"
                    stroke="#E11D48"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />

                  <circle cx="39" cy="53" r="2.5" fill="#FB7185" fillOpacity="0.8" />
                  <circle cx="61" cy="53" r="2.5" fill="#FB7185" fillOpacity="0.8" />

                  <path
                    d="M36 34 C36 24, 64 24, 64 34 Z"
                    fill="#FBBF24"
                    stroke="#D97706"
                    strokeWidth="2"
                  />
                  <rect x="33" y="32" width="34" height="4" rx="2" fill="#F59E0B" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
      )
      )}
    </div>
  );
};
