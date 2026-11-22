import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/Toast';
import { LoginPage } from './pages/LoginPage';
import { TesisRepositoryPage } from './pages/TesisRepositoryPage';
import { InstruccionesSustentacionPage } from './pages/InstruccionesSustentacionPage';
import { SecretariaLogisticsPage } from './pages/SecretariaLogisticsPage';
import { PreguntasFrecuentesPage } from './pages/PreguntasFrecuentesPage';
import { HelpCircle, BookOpen, ClipboardList, Layers } from 'lucide-react';

const AppContent: React.FC = () => {
  const { usuario } = useApp();
  const [vistaActual, setVistaActual] = useState<string>('repositorio');
  const [modalLoginAbierto, setModalLoginAbierto] = useState<boolean>(false);

  // Cuando la Secretaria inicia sesión, llevarla automáticamente a su apartado exclusivo
  useEffect(() => {
    if (usuario) {
      setModalLoginAbierto(false);
      setVistaActual('secretaria');
    } else if (vistaActual === 'secretaria') {
      setVistaActual('repositorio');
    }
  }, [usuario]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] text-slate-800">
      {/* Header Institucional con las 2 pestañas públicas + Login Exclusivo de Secretaría */}
      <Header
        vistaActual={vistaActual}
        onCambiarVista={(v) => setVistaActual(v)}
        onAbrirLogin={() => setModalLoginAbierto(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Banner Institucional con Selector Rápido de Pestañas */}
          {vistaActual !== 'secretaria' && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#082F64] via-[#0C4D96] to-[#1765B5] text-white shadow-md mb-5 border border-white/10">
              <div className="flex flex-col lg:flex-row items-center justify-between">
                <div className="p-5 sm:p-6 max-w-2xl space-y-2.5 z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold tracking-wider uppercase text-blue-200">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>Escuela Profesional de Ingeniería Industrial · UNT</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif">
                    {vistaActual === 'instrucciones'
                      ? 'Ruta Logística, Instrucciones y Seguimiento de Sustentación'
                      : vistaActual === 'preguntas-frecuentes'
                      ? 'Preguntas Frecuentes sobre el Trámite de Sustentación'
                      : 'Repositorio Institucional y Trazabilidad de Tesis — Ing. Industrial'}
                  </h1>

                  {/* Botones de Pestañas de la Interfaz Pública */}
                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVistaActual('repositorio')}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                        vistaActual === 'repositorio'
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : 'bg-white/15 hover:bg-white/25 text-white'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>1. Repositorio de Tesis</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVistaActual('instrucciones')}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                        vistaActual === 'instrucciones'
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : 'bg-white/15 hover:bg-white/25 text-white'
                      }`}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>2. Instrucciones y Seguimiento de Sustentación</span>
                    </button>

                    {usuario && (
                      <button
                        type="button"
                        onClick={() => setVistaActual('secretaria')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Volver al Panel de Secretaría (Srta. Celia)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Fotografía del Monumento de Ingeniería Industrial UNT */}
                <div className="relative w-full lg:w-96 h-36 sm:h-44 overflow-hidden shrink-0">
                  <img
                    src="/images/monumento-industrial-unt.jpg"
                    alt="Monumento de la Escuela de Ingeniería Industrial UNT"
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#082F64] via-[#082F64]/40 to-transparent" />
                  <div className="absolute bottom-3 right-3 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#082F64]/85 backdrop-blur-xs text-[10px] text-amber-300 font-bold border border-amber-400/30">
                    <span>CIUDAD UNIVERSITARIA UNT</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vistas de la Interfaz Pública + Apartado Exclusivo de Secretaría */}
          {vistaActual === 'repositorio' && <TesisRepositoryPage />}
          {vistaActual === 'instrucciones' && <InstruccionesSustentacionPage />}
          {vistaActual === 'preguntas-frecuentes' && <PreguntasFrecuentesPage />}
          {vistaActual === 'secretaria' && usuario && <SecretariaLogisticsPage />}
        </main>

        <Footer />
      </div>

      {/* Ícono Flotante '?' abajo a la derecha que lleva a la pestaña de Preguntas Frecuentes */}
      {vistaActual !== 'preguntas-frecuentes' && (
        <button
          type="button"
          onClick={() => setVistaActual('preguntas-frecuentes')}
          className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-[#082F64] hover:bg-[#0C4D96] text-amber-300 shadow-2xl border-2 border-amber-400 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
          title="Ir a Preguntas Frecuentes"
          aria-label="Preguntas Frecuentes"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      )}

      {/* Modal de Inicio de Sesión Exclusivo para Secretaría Académica */}
      {modalLoginAbierto && !usuario && (
        <LoginPage onClose={() => setModalLoginAbierto(false)} />
      )}

      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
