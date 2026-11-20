import React from 'react';
import { Building2, MapPin, GraduationCap, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-white border-t border-[#DBE4EF] text-slate-600 text-xs select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Fila Principal de Información Institucional (Copia de la Referencia Image 1) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pb-6 border-b border-slate-100">
          
          {/* Escuela de Ingeniería Industrial */}
          <div className="md:col-span-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#082F64] flex items-center justify-center shrink-0 border border-blue-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">
                Escuela de Ingeniería Industrial
              </div>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                Gestión académica orientada a la mejora continua, la eficiencia de procesos y la formación profesional de calidad.
              </p>
            </div>
          </div>

          {/* Ubicación Física */}
          <div className="md:col-span-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#082F64] flex items-center justify-center shrink-0 border border-blue-100">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-xs">
                Ciudad Universitaria
              </div>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                Av. Juan Pablo II s/n, Trujillo, La Libertad, Perú.
              </p>
            </div>
          </div>

          {/* Facultad e Institución */}
          <div className="md:col-span-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#082F64] flex items-center justify-center shrink-0 border border-blue-100">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-xs">
                Universidad Nacional de Trujillo
              </div>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                Facultad de Ingeniería
              </p>
            </div>
          </div>
        </div>

        {/* Fila Inferior de Derechos y Créditos Oficiales */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div>
            © 2026 Universidad Nacional de Trujillo – Escuela de Ingeniería Industrial. Todos los derechos reservados.
          </div>

          {/* Enlace Oficial al Repositorio UNT en los Créditos Finales */}
          <div className="flex items-center gap-1.5 text-slate-500 hover:text-[#082F64] transition-colors">
            <span>Metadatos y Registro Oficial:</span>
            <a
              href="https://repositorio.unitru.edu.pe/home"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#1765B5] hover:underline flex items-center gap-1"
            >
              repositorio.unitru.edu.pe
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
