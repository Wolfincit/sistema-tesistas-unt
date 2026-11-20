import { CorreoAutorizado } from '../types';

// Padrón Oficial de Tesistas Habilitados por Secretaría Académica — Ingeniería Industrial UNT
// La contraseña inicial de cada tesista es su código de matrícula (puede cambiarla dentro del sistema).
export const INITIAL_CORREOS_AUTORIZADOS: CorreoAutorizado[] = [
  {
    id: 'cor-unt-001',
    correo: 'tesista.industrial@unitru.edu.pe',
    nombreGraduando: 'Carlos Eduardo Mendoza Villanueva',
    codigoMatricula: '1021400219',
    promocion: '2025-II',
    fechaHabilitacion: '2026-03-01',
    activo: true,
    password: '1021400219',
    passwordCambiada: false
  },
  {
    id: 'cor-unt-002',
    correo: 'mquinones@unitru.edu.pe',
    nombreGraduando: 'Melina Nayhely Quiñones Mostacero',
    codigoMatricula: '1021400315',
    promocion: '2025-II',
    fechaHabilitacion: '2026-03-05',
    activo: true,
    password: '1021400315',
    passwordCambiada: false
  },
  {
    id: 'cor-unt-003',
    correo: 'nsalas@unitru.edu.pe',
    nombreGraduando: 'Neiser Michel Salas Ríos',
    codigoMatricula: '1021400342',
    promocion: '2025-II',
    fechaHabilitacion: '2026-03-05',
    activo: true,
    password: '1021400342',
    passwordCambiada: false
  },
  {
    id: 'cor-unt-004',
    correo: 'dcarranza@unitru.edu.pe',
    nombreGraduando: 'Diego Alonso Carranza Vásquez',
    codigoMatricula: '1021400418',
    promocion: '2025-I',
    fechaHabilitacion: '2026-02-18',
    activo: true,
    password: '1021400418',
    passwordCambiada: false
  }
];
