import { FormatoInstitucional } from '../types';
import { INITIAL_FORMATOS } from '../data/mockFormatos';
import { storageService } from './storageService';
import { driveApiService } from './driveApiService';

const FORMATOS_KEY = 'unt_industrial_formatos_oficiales';

export const formatosService = {
  async getFormatos(): Promise<FormatoInstitucional[]> {
    return storageService.get<FormatoInstitucional[]>(FORMATOS_KEY, INITIAL_FORMATOS);
  },

  async saveFormatos(formatos: FormatoInstitucional[]): Promise<void> {
    storageService.set(FORMATOS_KEY, formatos);
    await driveApiService.saveCollection('formatos', formatos);
  },

  async subirFormato(datos: {
    nombre: string;
    descripcion: string;
    formato: 'PDF' | 'DOCX' | 'XLSX';
    archivoNombre: string;
    peso: string;
    tipo: string;
    subidoPor: string;
  }): Promise<FormatoInstitucional> {
    const formatos = await this.getFormatos();
    const now = new Date();
    const fecha = now.toISOString().split('T')[0];

    const nuevo: FormatoInstitucional = {
      id: `fmt-${Date.now()}`,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      formato: datos.formato,
      archivoNombre: datos.archivoNombre,
      peso: datos.peso,
      tipo: datos.tipo,
      fechaSubida: fecha,
      subidoPor: datos.subidoPor
    };

    const actualizados = [nuevo, ...formatos];
    await this.saveFormatos(actualizados);
    return nuevo;
  },

  async actualizarFormato(id: string, datos: Partial<FormatoInstitucional>): Promise<FormatoInstitucional> {
    const formatos = await this.getFormatos();
    const idx = formatos.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Formato no encontrado');

    const updated = { ...formatos[idx], ...datos };
    formatos[idx] = updated;
    await this.saveFormatos(formatos);
    return updated;
  },

  async eliminarFormato(id: string): Promise<void> {
    const formatos = await this.getFormatos();
    const filtrados = formatos.filter((f) => f.id !== id);
    await this.saveFormatos(filtrados);
  }
};
