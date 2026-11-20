import { UserProfile } from '../types';

export const MOCK_USERS: Record<'tesista' | 'secretaria', UserProfile> = {
  tesista: {
    id: 'usr-tesista-unt',
    nombre: 'Graduando Ing. Industrial',
    email: 'tesista.industrial@unitru.edu.pe',
    rol: 'tesista',
    codigoMatricula: '',
    departamento: 'Escuela Profesional de Ingeniería Industrial',
    facultad: 'Facultad de Ingeniería (UNT)'
  },
  secretaria: {
    id: 'usr-secretaria-unt',
    nombre: 'Secretaría Académica',
    email: 'secretaria.industrial@unitru.edu.pe',
    rol: 'secretaria',
    codigoMatricula: 'ADM-UNT',
    departamento: 'Secretaría Académica — Ingeniería Industrial',
    facultad: 'Facultad de Ingeniería (UNT)'
  }
};
