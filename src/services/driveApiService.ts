import { DriveStatusInfo } from '../types';

export interface DriveFolderItem {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface UploadedDocumentResponse {
  fileId: string;
  driveFileId: string;
  driveFileUrl: string;
  driveFolderId: string;
  driveFolderUrl: string;
  previewUrl: string;
  sizeBytes: number;
  sizeLabel: string;
  storage: 'google-drive' | 'local';
  folderName: string;
}

export interface UploadedAudioResponse {
  fileId: string;
  audioUrl: string;
  driveFileUrl: string;
  storage: 'google-drive' | 'local';
}

export const driveApiService = {
  async getStatus(): Promise<DriveStatusInfo | null> {
    try {
      const res = await fetch('/api/drive/status');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async saveCredentials(clientId: string, clientSecret: string): Promise<void> {
    const res = await fetch('/api/drive/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudieron guardar las credenciales.');
  },

  async getAuthUrl(): Promise<{ authUrl: string; redirectUri: string }> {
    const res = await fetch('/api/drive/auth-url');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo iniciar la conexión con Google Drive.');
    return data;
  },

  async disconnect(): Promise<void> {
    const res = await fetch('/api/drive/disconnect', { method: 'POST' });
    if (!res.ok) throw new Error('Error al desconectar Google Drive.');
  },

  async listFolders(parentId = 'root', q = ''): Promise<{
    currentFolder: { id: string; name: string; parentId: string | null; webViewLink?: string };
    folders: DriveFolderItem[];
  }> {
    const params = new URLSearchParams({ parentId });
    if (q.trim()) params.set('q', q.trim());
    const res = await fetch(`/api/drive/folders?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudieron cargar las carpetas de Google Drive.');
    return data;
  },

  async createFolder(name: string, parentId = 'root'): Promise<DriveFolderItem> {
    const res = await fetch('/api/drive/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo crear la carpeta.');
    return data;
  },

  async selectRootFolder(folderIdOrLink: string): Promise<DriveStatusInfo> {
    const res = await fetch('/api/drive/select-root', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderIdOrLink })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo configurar la carpeta seleccionada.');
    return data;
  },

  async getDbState(force = false): Promise<{
    updatedAt: string;
    storageMode: 'google-drive' | 'local-server';
    collections: Record<string, any>;
  } | null> {
    try {
      const res = await fetch(`/api/db/state${force ? '?force=1' : ''}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async saveCollection(collectionName: string, data: any): Promise<void> {
    try {
      await fetch(`/api/db/collection/${encodeURIComponent(collectionName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });
    } catch {
      // Silencioso si el navegador está sin conexión; localStorage mantiene respaldo
    }
  },

  async uploadDocumento(params: {
    file: File;
    tesistaId: string;
    tesistaNombre: string;
    tesistaCodigo: string;
    tipoId: string;
    anteriorFileId?: string;
  }): Promise<UploadedDocumentResponse> {
    const res = await fetch('/api/files/upload-documento', {
      method: 'POST',
      headers: {
        'Content-Type': params.file.type || 'application/pdf',
        'x-file-name': encodeURIComponent(params.file.name),
        'x-tesista-id': encodeURIComponent(params.tesistaId),
        'x-tesista-nombre': encodeURIComponent(params.tesistaNombre),
        'x-tesista-codigo': encodeURIComponent(params.tesistaCodigo),
        'x-tipo-id': encodeURIComponent(params.tipoId),
        ...(params.anteriorFileId ? { 'x-anterior-file-id': encodeURIComponent(params.anteriorFileId) } : {})
      },
      body: params.file
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo subir el documento PDF.');
    return data;
  },

  async uploadAudio(blob: Blob, fileName = `nota_voz_${Date.now()}.webm`): Promise<UploadedAudioResponse> {
    const res = await fetch('/api/files/upload-audio', {
      method: 'POST',
      headers: {
        'Content-Type': blob.type || 'audio/webm',
        'x-file-name': encodeURIComponent(fileName)
      },
      body: blob
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo subir la nota de voz.');
    return data;
  },

  async deleteFile(fileId?: string): Promise<void> {
    if (!fileId) return;
    try {
      await fetch(`/api/files/${encodeURIComponent(fileId)}`, { method: 'DELETE' });
    } catch {
      // non-fatal
    }
  },

  async deleteTesistaFolder(params: {
    tesistaId: string;
    tesistaNombre: string;
    tesistaCodigo: string;
    driveFolderId?: string;
    fileIds: string[];
  }): Promise<{ ok: boolean; deletedFromDrive: boolean; deletedLocalCount: number }> {
    const res = await fetch('/api/files/delete-tesista-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo eliminar la carpeta del tesista.');
    return data;
  },

  async exportMigrationBundle(passphrase: string): Promise<any> {
    const res = await fetch('/api/drive/migration-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo generar el seguro de migración.');
    return data;
  },

  async importMigrationBundle(bundle: any, passphrase: string): Promise<DriveStatusInfo> {
    const res = await fetch('/api/drive/migration-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bundle, passphrase })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo restaurar el seguro de migración.');
    return data;
  },

  async getEnvTemplate(): Promise<{ ready: boolean; hasDriveLink: boolean; envText: string }> {
    const res = await fetch('/api/drive/env-template');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo obtener la plantilla .env.');
    return data;
  }
};
