import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar,
  ShieldCheck,
  BookOpen,
  FileCheck,
  GraduationCap,
  MessageSquare,
  FileText,
  Users,
  HelpCircle,
  HardDrive
} from 'lucide-react';

interface SidebarProps {
  vistaActual: string;
  onCambiarVista: (vista: string) => void;
  abiertoMovil?: boolean;
  onCerrarMovil?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  vistaActual,
  onCambiarVista,
  abiertoMovil = false,
  onCerrarMovil
}) => {
  const { rolActual, reservas, documentos, usuario, consultas, driveStatus } = useApp();

  const pendientesReserva = reservas.filter((r) => r.estado === 'pre-reserva').length;
  const pendientesDoc = documentos.filter((d) => d.estado === 'En revisión').length;
  const docsObservados = documentos.filter(
    (d) => d.tesistaId === usuario?.id && d.estado === 'Observado'
  ).length;
  const consultasPendientes = consultas.filter(
    (c) => c.estado === 'Pendiente' || c.estado === 'Reabierta'
  ).length;
  const misDudasResueltas = consultas.filter(
    (c) => c.tesistaId === usuario?.id && c.estado === 'Resuelta' && c.conformidadTesista !== 'conforme'
  ).length;

  // Menú oficial para Secretaría Académica
  const menuSecretaria = [
    {
      id: 'admin-auditorio',
      label: 'Control de Auditorio',
      icon: Calendar,
      badge: pendientesReserva
    },
    {
      id: 'admin-documentos',
      label: 'Revisión de Expedientes',
      icon: ShieldCheck,
      badge: pendientesDoc
    },
    {
      id: 'admin-consultas',
      label: 'Buzón de Consultas',
      icon: MessageSquare,
      badge: consultasPendientes
    },
    {
      id: 'admin-formatos',
      label: 'Formatos Oficiales',
      icon: FileText,
      badge: 0
    },
    {
      id: 'admin-accesos',
      label: 'Control de Accesos',
      icon: Users,
      badge: 0
    },
    {
      id: 'admin-faqs',
      label: 'Preguntas Frecuentes',
      icon: HelpCircle,
      badge: 0
    },
    {
      id: 'admin-drive',
      label: driveStatus?.storageMode === 'google-drive' ? 'Google Drive (Activo)' : 'Almacenamiento Drive',
      icon: HardDrive,
      badge: 0
    }
  ];

  // Menú oficial para Tesista Graduando
  const menuTesista = [
    {
      id: 'repositorio',
      label: 'Repositorio de Tesis',
      icon: BookOpen,
      badge: 0
    },
    {
      id: 'auditorio',
      label: 'Reserva de Auditorio',
      icon: Calendar,
      badge: 0
    },
    {
      id: 'documentos',
      label: 'Gestión Documentaria',
      icon: FileCheck,
      badge: docsObservados
    },
    {
      id: 'tesista-consultas',
      label: 'Mis Consultas',
      icon: MessageSquare,
      badge: misDudasResueltas
    },
    {
      id: 'preguntas-frecuentes',
      label: 'Preguntas Frecuentes',
      icon: HelpCircle,
      badge: 0
    }
  ];

  const itemsActuales = rolActual === 'secretaria' ? menuSecretaria : menuTesista;

  const handleItemClick = (id: string) => {
    onCambiarVista(id);
    if (onCerrarMovil) onCerrarMovil();
  };

  return (
    <>
      {/* Overlay oscuro para dispositivos móviles */}
      {abiertoMovil && (
        <div 
          onClick={onCerrarMovil}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Contenedor Principal del Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-18 left-0 z-50 lg:z-30 h-screen lg:h-[calc(100vh-4.5rem)] w-64 bg-[#082F64] text-white border-r border-[#051F42] flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 select-none ${
          abiertoMovil ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-5">
          
          {/* Cabecera del Sidebar con identidad de Grados y Títulos */}
          <div className="px-3 pb-4 border-b border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white leading-tight">
                Gestión de Tesis
              </h2>
              <p className="text-[11px] text-blue-200">
                {rolActual === 'secretaria' ? 'Secretaría Académica' : 'Expedientes y Titulación'}
              </p>
            </div>
          </div>

          {/* Menú de Navegación Oficial Predefinido sin Duplicados */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200/60 px-3 pb-1">
              {rolActual === 'secretaria' ? 'Módulos de Gestión' : 'Módulos del Graduando'}
            </div>

            <nav className="space-y-1">
              {itemsActuales.map((item) => {
                const Icon = item.icon;
                const activo = vistaActual === item.id;
                const badge = item.badge || 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activo
                        ? 'bg-[#1765B5] text-white shadow-md ring-1 ring-white/25 font-bold'
                        : 'text-blue-100/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${activo ? 'text-white' : 'text-blue-300'}`} />
                      <span>{item.label}</span>
                    </div>

                    {badge > 0 && (
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-bold text-[10px] flex items-center justify-center shadow-xs">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Marca institucional en el pie del Sidebar */}
        <div className="p-4 border-t border-white/10 relative overflow-hidden bg-[#051F42]/60">
          <div className="flex items-center gap-2 text-[11px] text-blue-200/90 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sistema Institucional Activo</span>
          </div>
          <div className="text-[10px] text-blue-300/60 mt-0.5">
            Ing. Industrial • UNT 2026
          </div>
        </div>
      </aside>
    </>
  );
};
