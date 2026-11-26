import { CorreoAutorizado } from '../types';

// Padrón de Pruebas — Listo para cargar luego la lista oficial de Secretaría Académica UNT.
export const INITIAL_CORREOS_AUTORIZADOS: CorreoAutorizado[] = [
  {
    id: 'cor-prueba-01',
    correo: 'jpmirandava@unitru.edu.pe',
    nombreGraduando: 'Tesista de Prueba',
    codigoMatricula: '1511300999',
    promocion: '2026-I',
    fechaHabilitacion: '2026-11-26',
    activo: true,
    password: '1511300999',
    passwordCambiada: false
  },
  {
    id: 'cor-prueba-02',
    correo: 'cdchavezas@unitru.edu.pe',
    nombreGraduando: 'Carlos (Prueba)',
    codigoMatricula: '1511300998',
    promocion: '2026-I',
    fechaHabilitacion: '2026-11-26',
    activo: true,
    password: '1511300998',
    passwordCambiada: false
  }
];
