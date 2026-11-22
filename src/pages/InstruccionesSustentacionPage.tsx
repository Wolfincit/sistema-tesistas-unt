import React, { useState } from 'react';
import { SustentacionJuevesItem } from '../data/mockLogisticaSecretaria';
import { logisticaSecretariaService } from '../services/logisticaSecretariaService';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Download,
  Calendar,
  FolderCheck,
  ClipboardList,
  CheckCircle2
} from 'lucide-react';

export const InstruccionesSustentacionPage: React.FC = () => {
  const { formatos, agregarToast } = useApp();
  const [sustentacionesJueves] = useState<SustentacionJuevesItem[]>(() =>
    logisticaSecretariaService.getSustentacionesJueves()
  );

  const handleDescargarFormato = (nombre: string, archivoNombre: string, descripcion: string) => {
    const contenido = `UNIVERSIDAD NACIONAL DE TRUJILLO\nFACULTAD DE INGENIERÍA\nESCUELA PROFESIONAL DE INGENIERÍA INDUSTRIAL\n\nFORMATO OFICIAL: ${nombre}\nArchivo: ${archivoNombre}\n\nDetalle:\n${descripcion}\n`;
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = archivoNombre || `${nombre.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    agregarToast('success', 'Formato Descargado', `Se descargó "${nombre}".`);
  };

  const pasosSustentacion = [
    {
      paso: 'Paso 1',
      titulo: 'Presentación de Solicitud y Expediente Físico en Secretaría de Escuela',
      descripcion:
        'Presentar en la Secretaría de la Escuela Profesional de Ingeniería Industrial (Srta. Celia) el Formato Único de Trámite (FUT), recibo de pago correspondiente, informe de originalidad Turnitin visado por el asesor y los ejemplares del borrador de tesis.'
    },
    {
      paso: 'Paso 2',
      titulo: 'Designación y Revisión por el Jurado Evaluador',
      descripcion:
        'Una vez designado el Jurado Evaluador (Presidente, Secretario y Vocal), los tres ingenieros revisan el trabajo de tesis. Si existen observaciones, el tesista las subsana hasta obtener el dictamen favorable de los tres miembros.'
    },
    {
      paso: 'Paso 3',
      titulo: 'Programación de Fecha en el Calendario de Sustentaciones (Jueves · 11:00 a.m. a 1:00 p.m.)',
      descripcion:
        'Con la conformidad del jurado, Secretaría de Escuela programa la fecha de sustentación en el calendario oficial. Las sustentaciones se realizan los días jueves en el horario de 11:00 a.m. a 1:00 p.m.'
    },
    {
      paso: 'Paso 4',
      titulo: 'Notificación Oficial y Difusión del Flyer de Sustentación',
      descripcion:
        'La Secretaría de Escuela envía por correo electrónico la citación oficial y el flyer de sustentación tanto al tesista como a los ingenieros miembros del jurado.'
    },
    {
      paso: 'Paso 5',
      titulo: 'Acto Público de Sustentación y Suscripción de Acta',
      descripcion:
        'Exposición y defensa de la tesis ante el Jurado Evaluador el día jueves programado (11:00 a.m. – 1:00 p.m.), deliberación final y firma del Acta de Sustentación.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Cabecera de Instrucciones para el Tesista */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-unt-blue text-[11px] font-bold uppercase tracking-wider">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Guía Oficial para el Tesista · Ingeniería Industrial UNT</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Instrucciones para el Proceso de Sustentación de Tesis
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Revisa los pasos oficiales que debes seguir en la Escuela Profesional de Ingeniería Industrial para presentar tu expediente, pasar por revisión de jurado y programar tu sustentación.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 shrink-0 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Horario de Sustentaciones:</span>
          </div>
          <p className="text-[11px] font-semibold">
            Días <strong>JUEVES de 11:00 a.m. a 1:00 p.m.</strong>
          </p>
          <p className="text-[10px] text-amber-800">
            Secretaría de Escuela · Ingeniería Industrial UNT
          </p>
        </div>
      </div>

      {/* Grid Principal: Pasos a la izquierda + Próximas Sustentaciones y Formatos a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Pasos de Sustentación */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FolderCheck className="w-4 h-4 text-unt-blue" />
            <span>Pasos que debe seguir el Tesista para su Sustentación</span>
          </h3>

          <div className="space-y-3">
            {pasosSustentacion.map((item) => (
              <div
                key={item.paso}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3"
              >
                <span className="px-2.5 py-1 rounded-lg bg-[#082F64] text-amber-300 font-mono text-xs font-bold shrink-0">
                  {item.paso}
                </span>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.titulo}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.descripcion}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Formatos Descargables */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Formatos y Documentos de Referencia
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {formatos.map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() =>
                    handleDescargarFormato(fmt.nombre, fmt.archivoNombre, fmt.descripcion)
                  }
                  className="p-3 rounded-xl border border-slate-200 hover:border-unt-blue bg-white hover:bg-blue-50/40 text-left transition-all flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{fmt.nombre}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {fmt.formato} · {fmt.peso}
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-unt-blue shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sustentaciones Programadas (Jueves 11:00 a.m. - 1:00 p.m.) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4 h-fit">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-unt-blue" />
              <span>Sustentaciones Programadas (Jueves 11:00 a.m. – 1:00 p.m.)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fechas anotadas en el calendario de Secretaría de Escuela.
            </p>
          </div>

          <div className="space-y-3">
            {sustentacionesJueves.length > 0 ? (
              sustentacionesJueves.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#082F64] text-amber-300 font-bold text-[11px]">
                      Jueves {s.fecha} · {s.horario}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      {s.estado}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{s.tesistaNombre}</div>
                  <p className="text-[11px] text-slate-600 italic line-clamp-2">"{s.tituloTesis}"</p>
                  <div className="pt-2 border-t border-blue-100 text-[11px] text-slate-700 space-y-0.5">
                    <div>
                      <strong>Presidente:</strong> {s.juradoPresidente}
                    </div>
                    <div>
                      <strong>Secretario:</strong> {s.juradoSecretario}
                    </div>
                    <div>
                      <strong>Vocal:</strong> {s.juradoVocal}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No hay sustentaciones programadas en este momento.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
