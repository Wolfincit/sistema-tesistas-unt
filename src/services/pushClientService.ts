/**
 * Cliente PWA + Notificaciones Web Push — Sistema de Tesistas Ing. Industrial UNT.
 * Maneja registro de Service Worker, suscripción Push (Android Chrome + iOS 16.4+ instalada),
 * envío automático de alertas desde Secretaría y bandeja interna por matrícula.
 */

export interface NotificacionTesisItem {
  id: string;
  codigoMatricula: string;
  title: string;
  body: string;
  url: string;
  tipo: string;
  tag: string;
  createdAt: string;
  leida: boolean;
}

export interface PushStatsInfo {
  totalDispositivos: number;
  tesistasSuscritos: number;
  matriculasActivas: string[];
  secretariaSuscrita: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as unknown as { standalone?: boolean }).standalone)
  );
}

export function supportsWebPush(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export const pushClientService = {
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
    try {
      return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch {
      return null;
    }
  },

  async subscribeDevice(params: {
    codigoMatricula?: string;
    rol: 'tesista' | 'secretaria';
    nombre?: string;
  }): Promise<{ ok: boolean; reason?: string }> {
    if (!supportsWebPush()) {
      return {
        ok: false,
        reason: isIOSDevice() && !isStandalonePwa()
          ? 'En iPhone primero agrega esta página a tu Pantalla de Inicio (Compartir → Agregar a pantalla de inicio) y ábrela desde el ícono.'
          : 'Tu navegador no admite notificaciones push en este momento.'
      };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        ok: false,
        reason: 'Permiso denegado en el navegador. Puedes habilitarlo desde el ícono de candado en la barra de dirección.'
      };
    }

    const reg = (await this.registerServiceWorker()) || (await navigator.serviceWorker.ready);
    if (!reg) {
      return { ok: false, reason: 'No se pudo inicializar el servicio de notificaciones (verifica HTTPS).' };
    }

    const keyRes = await fetch('/api/push/public-key');
    if (!keyRes.ok) {
      return { ok: false, reason: 'El servidor de alertas no respondió.' };
    }
    const { publicKey } = await keyRes.json();
    if (!publicKey) {
      return { ok: false, reason: 'Clave VAPID no disponible en el servidor.' };
    }

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
    }

    const saveRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        codigoMatricula: params.codigoMatricula || '',
        rol: params.rol,
        nombre: params.nombre || ''
      })
    });

    if (!saveRes.ok) {
      const err = await saveRes.json().catch(() => ({}));
      return { ok: false, reason: err.error || 'No se pudo registrar este dispositivo.' };
    }

    return { ok: true };
  },

  async notifyThesisUpdate(params: {
    codigoMatricula: string;
    title: string;
    body: string;
    url?: string;
    tag?: string;
    tipo?: string;
    urgente?: boolean;
  }): Promise<{ ok: boolean; pushedCount: number }> {
    try {
      const res = await fetch('/api/push/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rol: 'tesista',
          ...params
        })
      });
      if (!res.ok) return { ok: false, pushedCount: 0 };
      const data = await res.json();
      return { ok: true, pushedCount: Number(data.pushedCount || 0) };
    } catch {
      return { ok: false, pushedCount: 0 };
    }
  },

  async notifySecretaria(params: {
    title: string;
    body: string;
    url?: string;
    tag?: string;
  }): Promise<void> {
    try {
      await fetch('/api/push/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rol: 'secretaria',
          tipo: 'duda',
          urgente: true,
          ...params
        })
      });
    } catch {
      // Silencioso si no hay conexión
    }
  },

  async getNotifications(matricula: string): Promise<NotificacionTesisItem[]> {
    try {
      const res = await fetch(`/api/push/notifications?matricula=${encodeURIComponent(matricula)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : [];
    } catch {
      return [];
    }
  },

  async markRead(id: string): Promise<void> {
    try {
      await fetch('/api/push/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch {
      // Silencioso
    }
  },

  async getStats(): Promise<PushStatsInfo> {
    try {
      const res = await fetch('/api/push/stats');
      if (!res.ok) throw new Error('err');
      return await res.json();
    } catch {
      return {
        totalDispositivos: 0,
        tesistasSuscritos: 0,
        matriculasActivas: [],
        secretariaSuscrita: false
      };
    }
  }
};
