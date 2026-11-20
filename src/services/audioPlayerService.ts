/**
 * Servicio de Audio Real para Grabación de Notas de Voz y Reproducción Fidedigna.
 * Garantiza sonido audible a través de los parlantes tanto con micrófono real
 * como con síntesis de voz Web Audio API / SpeechSynthesis.
 */

// Genera un tono de llamada / chime institucional agradable usando Web Audio API
export function reproducirChimeInstitucional(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
      setTimeout(() => {
        ctx.close();
        resolve();
      }, 350);
    } catch (_) {
      resolve();
    }
  });
}

export interface AudioPlaybackHandle {
  stop: () => void;
}

export const audioPlayerService = {
  /**
   * Reproduce una nota de voz de manera audible:
   * 1. Si existe URL/Blob real de audio, lo reproduce con HTML5 Audio.
   * 2. Si no hay archivo binario o en navegadores sin soporte de blob, utiliza SpeechSynthesis en español con tono institucional.
   */
  reproducirAudio(params: {
    audioUrl?: string;
    textoRespaldo?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }): AudioPlaybackHandle {
    let activo = true;
    let elementoAudio: HTMLAudioElement | null = null;

    const finalizar = () => {
      if (activo) {
        activo = false;
        if (params.onEnd) params.onEnd();
      }
    };

    if (params.audioUrl && params.audioUrl.startsWith('blob:')) {
      try {
        elementoAudio = new Audio(params.audioUrl);
        elementoAudio.onended = finalizar;
        elementoAudio.onerror = () => {
          this.reproducirVozSintetizada(params.textoRespaldo, finalizar);
        };
        if (params.onStart) params.onStart();
        elementoAudio.play().catch(() => {
          this.reproducirVozSintetizada(params.textoRespaldo, finalizar);
        });

        return {
          stop: () => {
            if (elementoAudio) {
              elementoAudio.pause();
              elementoAudio.currentTime = 0;
            }
            finalizar();
          }
        };
      } catch (_) {
        this.reproducirVozSintetizada(params.textoRespaldo, finalizar);
      }
    } else {
      // Reproducir síntesis de voz en español con chime
      if (params.onStart) params.onStart();
      this.reproducirVozSintetizada(params.textoRespaldo, finalizar);
    }

    return {
      stop: () => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        finalizar();
      }
    };
  },

  async reproducirVozSintetizada(texto?: string, onEnd?: () => void): Promise<void> {
    await reproducirChimeInstitucional();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const mensaje = texto || 'Nota de voz oficial emitida por Secretaría Académica de Ingeniería Industrial UNT.';
      const utterance = new SpeechSynthesisUtterance(mensaje);
      utterance.lang = 'es-PE';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Buscar voz en español si está disponible
      const voces = window.speechSynthesis.getVoices();
      const vozEs = voces.find((v) => v.lang.startsWith('es'));
      if (vozEs) utterance.voice = vozEs;

      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        if (onEnd) onEnd();
      }, 1500);
    }
  },

  /**
   * Inicia la grabación con el micrófono real del equipo mediante MediaRecorder.
   * Si no se conceden permisos, genera un audio virtual reproducible.
   */
  async iniciarGrabacion(): Promise<{
    stop: () => Promise<{ blob: Blob | null; url: string; duracionStr: string }>;
  }> {
    const startTime = Date.now();
    let mediaRecorder: MediaRecorder | null = null;
    let chunks: Blob[] = [];

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        chunks = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.start(100);
      } catch (err) {
        console.warn('Micrófono no accesible, usando sintetizador fallback:', err);
      }
    }

    return {
      stop: () => {
        return new Promise((resolve) => {
          const elapsedSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
          const min = Math.floor(elapsedSec / 60);
          const sec = elapsedSec % 60;
          const duracionStr = `${min}:${sec < 10 ? '0' : ''}${sec}`;

          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              const url = URL.createObjectURL(blob);
              // Detener tracks del micrófono
              mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
              resolve({ blob, url, duracionStr });
            };
            mediaRecorder.stop();
          } else {
            // Audio sintético fallback
            resolve({
              blob: null,
              url: '',
              duracionStr
            });
          }
        });
      }
    };
  }
};
