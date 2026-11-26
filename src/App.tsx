import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/Toast';
import { PwaInstallBanner } from './components/common/PwaInstallBanner';
import { SplashScreen } from './components/common/SplashScreen';
import { pushClientService } from './services/pushClientService';
import { LoginPage } from './pages/LoginPage';
import { TesisRepositoryPage } from './pages/TesisRepositoryPage';
import { InstruccionesSustentacionPage } from './pages/InstruccionesSustentacionPage';
import { SecretariaLogisticsPage } from './pages/SecretariaLogisticsPage';
import { PreguntasFrecuentesPage } from './pages/PreguntasFrecuentesPage';
import { HelpCircle } from 'lucide-react';

const AppContent: React.FC = () => {
  const { usuario } = useApp();
  const [vistaActual, setVistaActual] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('vista');
      if (v === 'instrucciones' || v === 'preguntas-frecuentes') return v;
    } catch {
      // Silencioso
    }
    return 'repositorio';
  });
  const [modalLoginAbierto, setModalLoginAbierto] = useState<boolean>(false);

  // Registrar Service Worker PWA al iniciar para habilitar instalación y notificaciones push
  useEffect(() => {
    pushClientService.registerServiceWorker().catch(() => {});
  }, []);

  // Cuando la Secretaria inicia sesión: quitar el repositorio y mostrar directamente su panel
  useEffect(() => {
    if (usuario) {
      setModalLoginAbierto(false);
      if (vistaActual === 'repositorio') {
        setVistaActual('secretaria');
      }
    } else if (vistaActual === 'secretaria') {
      setVistaActual('repositorio');
    }
  }, [usuario]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] text-slate-800">
      <SplashScreen durationMs={1650} />
      <Header
        vistaActual={vistaActual}
        onCambiarVista={(v) => setVistaActual(v)}
        onAbrirLogin={() => setModalLoginAbierto(true)}
      />

      {!usuario && <PwaInstallBanner />}

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Vista pública del Tesista */}
          {!usuario && vistaActual === 'repositorio' && <TesisRepositoryPage />}
          {!usuario && vistaActual === 'instrucciones' && <InstruccionesSustentacionPage />}
          {!usuario && vistaActual === 'preguntas-frecuentes' && <PreguntasFrecuentesPage />}

          {/* Vista única e ininterrumpida para Secretaría (nunca pierde sus pestañas) */}
          {usuario && <SecretariaLogisticsPage />}
        </main>

        <Footer />
      </div>

      {/* Ícono Flotante '?' exclusivo para visitantes/tesistas (Secretaría ya lo tiene integrado en su panel) */}
      {!usuario && vistaActual !== 'preguntas-frecuentes' && (
        <button
          type="button"
          onClick={() => setVistaActual('preguntas-frecuentes')}
          className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-[#082F64] hover:bg-[#0C4D96] text-amber-300 shadow-2xl border-2 border-amber-400 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
          title="Preguntas Frecuentes"
          aria-label="Preguntas Frecuentes"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      )}

      {/* Modal de Inicio de Sesión Exclusivo para Secretaría */}
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
