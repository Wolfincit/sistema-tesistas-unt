import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/Toast';
import { LoginPage } from './pages/LoginPage';
import { TesisRepositoryPage } from './pages/TesisRepositoryPage';
import { AuditorioPage } from './pages/AuditorioPage';
import { DocumentosPage } from './pages/DocumentosPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { TesistaConsultas } from './components/tesista/TesistaConsultas';
import { PreguntasFrecuentesPage } from './pages/PreguntasFrecuentesPage';
import { HelpCircle, Lock, ShieldCheck } from 'lucide-react';

const AppContent: React.FC = () => {
  const { usuario, rolActual } = useApp();
  const [vistaActual, setVistaActual] = useState<string>('repositorio');
  const [sidebarMovilAbierto, setSidebarMovilAbierto] = useState<boolean>(false);
  const [modalLoginAbierto, setModalLoginAbierto] = useState<boolean>(false);

  // Al iniciar o cerrar sesión, sincronizar la vista correspondiente
  useEffect(() => {
    if (!usuario) {
      setVistaActual('repositorio');
      setSidebarMovilAbierto(false);
      return;
    }

    setModalLoginAbierto(false);
    if (rolActual === 'secretaria') {
      if (!vistaActual.startsWith('admin-')) {
        setVistaActual('admin-auditorio');
      }
    } else {
      if (vistaActual.startsWith('admin-') || vistaActual === 'inicio') {
        setVistaActual('repositorio');
      }
    }
  }, [usuario, rolActual]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] text-slate-800">
      {/* Header Institucional Azul Marino (#082F64) */}
      <Header
        onToggleSidebar={() => setSidebarMovilAbierto(!sidebarMovilAbierto)}
        sidebarAbierto={sidebarMovilAbierto}
        onAbrirLogin={() => setModalLoginAbierto(true)}
      />

      <div className="flex-1 flex w-full">
        {/* Sidebar Lateral Exclusivo: Solo se muestra cuando un Tesista Habilitado o Secretaría ha iniciado sesión */}
        {usuario && (
          <Sidebar
            vistaActual={vistaActual}
            onCambiarVista={(v) => {
              setVistaActual(v);
              setSidebarMovilAbierto(false);
            }}
            abiertoMovil={sidebarMovilAbierto}
            onCerrarMovil={() => setSidebarMovilAbierto(false)}
          />
        )}

        {/* Área de Contenido Principal */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            {/* Banner Institucional */}
            {(!usuario || vistaActual === 'repositorio') && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#082F64] via-[#0C4D96] to-[#1765B5] text-white shadow-md mb-5 border border-white/10">
                <div className="flex flex-col lg:flex-row items-center justify-between">
                  <div className="p-5 sm:p-6 max-w-2xl space-y-2.5 z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold tracking-wider uppercase text-blue-200">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      {usuario
                        ? 'Módulo de Titulación · Tesista Habilitado'
                        : 'Portal Público · Escuela de Ingeniería Industrial UNT'}
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif">
                      {usuario
                        ? 'Sistema de Gestión de Tesistas y Titulación'
                        : 'Repositorio Institucional de Tesis — Ingeniería Industrial'}
                    </h1>
                    {!usuario ? (
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setModalLoginAbierto(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>¿Eres tesista acreditado por Secretaría? Ingresar a Titulación</span>
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-xs text-emerald-300 font-semibold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          Correo acreditado en el padrón oficial: {usuario.email}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Fotografía Real del Monumento de Ingeniería Industrial UNT */}
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

            {/* EN MODO PÚBLICO (!usuario): Solo el Repositorio de Tesis es público */}
            {!usuario ? (
              <TesisRepositoryPage />
            ) : (
              <>
                {/* Módulos Exclusivos de Tesistas Habilitados por Secretaría */}
                {vistaActual === 'repositorio' && <TesisRepositoryPage />}
                {vistaActual === 'auditorio' && <AuditorioPage />}
                {vistaActual === 'documentos' && <DocumentosPage />}
                {vistaActual === 'tesista-consultas' && <TesistaConsultas />}
                {vistaActual === 'preguntas-frecuentes' && <PreguntasFrecuentesPage />}

                {/* Módulos Exclusivos de Secretaría Académica */}
                {vistaActual === 'admin-auditorio' && (
                  <AdminDashboardPage
                    subPestanaInicial="auditorio"
                    onCambiarPestana={(v) => setVistaActual(v)}
                  />
                )}
                {vistaActual === 'admin-documentos' && (
                  <AdminDashboardPage
                    subPestanaInicial="documentos"
                    onCambiarPestana={(v) => setVistaActual(v)}
                  />
                )}
                {vistaActual === 'admin-consultas' && (
                  <AdminDashboardPage
                    subPestanaInicial="consultas"
                    onCambiarPestana={(v) => setVistaActual(v)}
                  />
                )}
                {vistaActual === 'admin-formatos' && (
                  <AdminDashboardPage
                    subPestanaInicial="formatos"
                    onCambiarPestana={(v) => setVistaActual(v)}
                  />
                )}
                {vistaActual === 'admin-accesos' && (
                  <AdminDashboardPage
                    subPestanaInicial="accesos"
                    onCambiarPestana={(v) => setVistaActual(v)}
                  />
                )}
                {vistaActual === 'admin-faqs' && (
                  <AdminDashboardPage
                    subPestanaInicial="faqs"
                    onCambiarPestana={(v) => setVistaActual(v)}
                  />
                )}
                {vistaActual === 'admin-kpis' && (
                  <AdminDashboardPage
                    subPestanaInicial="consultas"
                    onCambiarPestana={(v) => setVistaActual(v)}
                  />
                )}
              </>
            )}
          </main>

          {/* Footer Institucional */}
          <Footer />
        </div>
      </div>

      {/* Icono Flotante Estático '?' (Exclusivo para Tesistas Habilitados / Secretaría, oculto en Modo Público y cuando ya se está en Preguntas Frecuentes) */}
      {usuario && vistaActual !== 'preguntas-frecuentes' && vistaActual !== 'admin-faqs' && (
        <button
          type="button"
          onClick={() =>
            setVistaActual(rolActual === 'secretaria' ? 'admin-faqs' : 'preguntas-frecuentes')
          }
          className="fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full bg-[#082F64] hover:bg-[#0C4D96] text-amber-300 shadow-xl border-2 border-amber-400/70 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
          title="Preguntas Frecuentes"
          aria-label="Preguntas Frecuentes"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      )}

      {/* Modal Integrado de Acceso para Tesistas Habilitados por Secretaría y Secretaría Académica */}
      {modalLoginAbierto && !usuario && (
        <LoginPage onClose={() => setModalLoginAbierto(false)} />
      )}

      {/* Notificaciones Toasts */}
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
