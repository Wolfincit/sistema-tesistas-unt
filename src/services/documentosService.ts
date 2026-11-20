import { DocumentoExpediente, TipoDocumentoId, DocumentoEstado } from '../types';
import { DOCUMENTOS_REQUERIDOS, INITIAL_EXPEDIENTES } from '../data/mockDocumentos';
import { storageService } from './storageService';

const DOCUMENTOS_KEY = 'unt_industrial_documentos';

export const documentosService = {
  async getAll(): Promise<DocumentoExpediente[]> {
    return storageService.get<DocumentoExpediente[]>(DOCUMENTOS_KEY, INITIAL_EXPEDIENTES);
  },

  async saveAll(docs: DocumentoExpediente[]): Promise<void> {
    storageService.set(DOCUMENTOS_KEY, docs);
  },

  /**
   * Obtiene la lista completa de los 5 requisitos para un tesista en particular.
   * Si el tesista aún no ha subido un tipo de documento, se genera un registro en estado 'Pendiente'.
   */
  async getExpedienteByTesista(
    tesistaId: string,
    tesistaNombre: string,
    tesistaCodigo: string
  ): Promise<DocumentoExpediente[]> {
    const all = await this.getAll();
    const tesistaDocs = all.filter((d) => d.tesistaId === tesistaId);

    // Mapear con base en los 5 documentos requeridos
    return DOCUMENTOS_REQUERIDOS.map((req) => {
      const found = tesistaDocs.find((d) => d.tipoId === req.id);
      if (found) return found;

      // Crear entrada virtual pendiente
      return {
        id: `doc-${tesistaId}-${req.id}`,
        tesistaId,
        tesistaNombre,
        tesistaCodigo,
        tipoId: req.id,
        nombreDocumento: req.nombre,
        estado: 'Pendiente' as DocumentoEstado
      };
    });
  },

  async subirDocumento(params: {
    tesistaId: string;
    tesistaNombre: string;
    tesistaCodigo: string;
    tipoId: TipoDocumentoId;
    nombreArchivo: string;
    archivoTamano: string;
  }): Promise<DocumentoExpediente> {
    const all = await this.getAll();
    const reqInfo = DOCUMENTOS_REQUERIDOS.find((r) => r.id === params.tipoId);
    const existingIdx = all.findIndex(
      (d) => d.tesistaId === params.tesistaId && d.tipoId === params.tipoId
    );

    const now = new Date();
    const fechaHora = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const docActualizado: DocumentoExpediente = {
      id: existingIdx >= 0 ? all[existingIdx].id : `doc-${Date.now()}`,
      tesistaId: params.tesistaId,
      tesistaNombre: params.tesistaNombre,
      tesistaCodigo: params.tesistaCodigo,
      tipoId: params.tipoId,
      nombreDocumento: reqInfo?.nombre || params.tipoId,
      nombreArchivo: params.nombreArchivo,
      archivoTamano: params.archivoTamano,
      fechaSubida: fechaHora,
      estado: 'En revisión',
      observacion: undefined // Limpia observación previa si era resubida
    };

    if (existingIdx >= 0) {
      all[existingIdx] = docActualizado;
    } else {
      all.push(docActualizado);
    }

    await this.saveAll(all);
    return docActualizado;
  },

  async revisarDocumento(params: {
    id: string;
    estado: 'Aprobado' | 'Observado';
    observacion?: string;
    revisadoPor: string;
  }): Promise<DocumentoExpediente> {
    const all = await this.getAll();
    const idx = all.findIndex((d) => d.id === params.id);
    if (idx === -1) {
      throw new Error('Documento no encontrado.');
    }

    const now = new Date();
    const fechaHora = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    all[idx] = {
      ...all[idx],
      estado: params.estado,
      observacion: params.estado === 'Observado' ? params.observacion : undefined,
      fechaRevision: fechaHora,
      revisadoPor: params.revisadoPor
    };

    await this.saveAll(all);
    return all[idx];
  },

  async eliminarDocumento(id: string): Promise<DocumentoExpediente> {
    const all = await this.getAll();
    const idx = all.findIndex((d) => d.id === id);
    if (idx === -1) {
      throw new Error('Documento no encontrado.');
    }

    const reseteado: DocumentoExpediente = {
      ...all[idx],
      estado: 'Pendiente',
      nombreArchivo: undefined,
      archivoTamano: undefined,
      fechaSubida: undefined,
      observacion: undefined,
      fechaRevision: undefined,
      revisadoPor: undefined
    };

    all[idx] = reseteado;
    await this.saveAll(all);
    return reseteado;
  },

  async editarTituloDocumento(id: string, nuevoNombreArchivo: string): Promise<DocumentoExpediente> {
    const all = await this.getAll();
    const idx = all.findIndex((d) => d.id === id);
    if (idx === -1) {
      throw new Error('Documento no encontrado.');
    }

    const finalName = nuevoNombreArchivo.trim().endsWith('.pdf')
      ? nuevoNombreArchivo.trim()
      : `${nuevoNombreArchivo.trim()}.pdf`;

    all[idx] = {
      ...all[idx],
      nombreArchivo: finalName
    };

    await this.saveAll(all);
    return all[idx];
  }
};
