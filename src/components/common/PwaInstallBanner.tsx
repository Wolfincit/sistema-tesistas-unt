import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Share, X } from 'lucide-react';
import { isIOSDevice, isStandalonePwa } from '../../services/pushClientService';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'unt_pwa_banner_dismissed_v1';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mostrarIosGuia, setMostrarIosGuia] = useState<boolean>(false);
  const [oculto, setOculto] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isStandalonePwa()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (isIOSDevice()) {
      setMostrarIosGuia(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (oculto || isStandalonePwa()) return null;
  if (!deferredPrompt && !mostrarIosGuia) return null;

  const cerrar = () => {
    setOculto(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Silencioso
    }
  };

  const instalarAndroid = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
      cerrar();
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#082F64] to-[#0C4D96] text-white border-b border-white/15">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          {deferredPrompt ? (
            <div className="min-w-0">
              <span className="font-bold block sm:inline">Instala Tesistas UNT en tu celular</span>{' '}
              <span className="text-blue-200 hidden sm:inline">
                y recibe avisos automáticos cuando tu tesis avance de etapa.
              </span>
            </div>
          ) : (
            <div className="min-w-0 text-[11px] sm:text-xs">
              <strong>En iPhone:</strong> toca <Share className="w-3.5 h-3.5 inline mx-0.5 text-amber-300" />{' '}
              <strong>Compartir → Agregar a pantalla de inicio</strong> para activar alertas de tu tesis.
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {deferredPrompt && (
            <button
              type="button"
              onClick={instalarAndroid}
              className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black inline-flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
          )}
          <button
            type="button"
            onClick={cerrar}
            className="p-1 rounded-lg hover:bg-white/15 text-blue-200 cursor-pointer"
            aria-label="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
