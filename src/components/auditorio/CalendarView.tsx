import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Ban, 
  Check, 
  Plus, 
  CheckSquare
} from 'lucide-react';
import { TIME_SLOTS, formatDateISO } from '../../data/mockAuditorio';
import { ReservaAuditorio, BloqueoFecha } from '../../types';
import { useApp } from '../../context/AppContext';

interface CalendarViewProps {
  reservas: ReservaAuditorio[];
  bloqueos?: BloqueoFecha[];
  fechaSeleccionada: string | null;
  onSelectFecha: (fecha: string) => void;
  modoAdmin?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  reservas,
  fechaSeleccionada,
  onSelectFecha,
  modoAdmin = false
}) => {
  const { 
    fechasHabilitadas, 
    toggleHabilitarFecha, 
    habilitarTodosMes, 
    inhabilitarTodosMes,
    getSlotsFecha
  } = useApp();

  const [fechaActual, setFechaActual] = useState(new Date());

  const year = fechaActual.getFullYear();
  const month = fechaActual.getMonth();

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const handlePrevMonth = () => {
    setFechaActual(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setFechaActual(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setFechaActual(new Date());
  };

  // Cálculos de días del mes
  const primerDiaMes = new Date(year, month, 1);
  const ultimoDiaMes = new Date(year, month + 1, 0);
  const totalDias = ultimoDiaMes.getDate();

  // Convertir a inicio Lunes (0=Lun, 6=Dom)
  let diaInicio = primerDiaMes.getDay();
  diaInicio = diaInicio === 0 ? 6 : diaInicio - 1;

  // Días del mes anterior para rellenar el grid
  const diasMesAnterior: number[] = [];
  const ultimoDiaMesAnterior = new Date(year, month, 0).getDate();
  for (let i = diaInicio - 1; i >= 0; i--) {
    diasMesAnterior.push(ultimoDiaMesAnterior - i);
  }

  // Días del mes actual
  const diasMesActual = Array.from({ length: totalDias }, (_, i) => i + 1);

  // Determinar estado de cada día según la regla estricta:
  // POR DEFECTO TODOS LOS DÍAS ESTÁN INHABILITADOS
  // Solo los días expresamente habilitados por Secretaría son atendibles
  const getInfoDia = (dia: number) => {
    const fechaObj = new Date(year, month, dia);
    const fechaStr = formatDateISO(fechaObj);
    const diaSemanaIndex = fechaObj.getDay(); // 0 es Domingo
    const esDomingo = diaSemanaIndex === 0;

    const esHabilitado = !esDomingo && fechasHabilitadas.includes(fechaStr);

    const reservasDia = reservas.filter(
      (r) => r.fecha === fechaStr && (r.estado === 'confirmada' || r.estado === 'pre-reserva')
    );

    const slotsDia = getSlotsFecha ? getSlotsFecha(fechaStr) : TIME_SLOTS;
    const totalCupos = slotsDia.length;
    const cuposOcupados = reservasDia.length;
    const cuposDisponibles = Math.max(0, totalCupos - cuposOcupados);

    let estado: 'habilitado' | 'inhabilitado' | 'lleno' | 'domingo' = 'inhabilitado';
    if (esDomingo) {
      estado = 'domingo';
    } else if (!esHabilitado) {
      estado = 'inhabilitado';
    } else if (cuposDisponibles === 0) {
      estado = 'lleno';
    } else {
      estado = 'habilitado';
    }

    return {
      fechaStr,
      esHabilitado,
      cuposOcupados,
      cuposDisponibles,
      totalCupos,
      estado,
      esDomingo
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Cabecera del Calendario */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-unt-blue text-white flex items-center justify-center font-bold text-sm shadow-2xs">
            {month + 1}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 capitalize">
              {meses[month]} {year}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {modoAdmin && (
            <div className="flex items-center gap-1.5 mr-1">
              <button
                type="button"
                id="btn-habilitar-todos"
                onClick={() => habilitarTodosMes(year, month)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Habilitar todos los días laborables del mes"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Habilitar mes</span>
              </button>

              <button
                type="button"
                id="btn-inhabilitar-todos"
                onClick={() => inhabilitarTodosMes(year, month)}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Inhabilitar todos los días del mes"
              >
                <Ban className="w-3.5 h-3.5 text-rose-500" />
                <span>Inhabilitar mes</span>
              </button>
            </div>
          )}

          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Mes Actual
          </button>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Leyenda Visual Simplificada */}
      <div className="px-5 sm:px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="font-medium">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="text-slate-500">Inhabilitado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-unt-blue" />
          <span className="text-unt-blue font-semibold">Seleccionado</span>
        </div>
      </div>

      {/* Grilla Semanal */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {diasSemana.map((d, idx) => (
            <div
              key={d}
              className={`text-center text-xs font-bold py-1.5 uppercase tracking-wider ${
                idx === 6 ? 'text-slate-400' : 'text-slate-700'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Celdas de Días */}
        <div className="grid grid-cols-7 gap-2">
          {/* Días del mes anterior (inactivos) */}
          {diasMesAnterior.map((dia) => (
            <div
              key={`prev-${dia}`}
              className="h-20 sm:h-24 p-2 rounded-xl border border-slate-100 bg-slate-50/30 text-slate-300 text-xs font-medium select-none"
            >
              {dia}
            </div>
          ))}

          {/* Días del mes actual */}
          {diasMesActual.map((dia) => {
            const {
              fechaStr,
              esHabilitado,
              cuposDisponibles,
              totalCupos,
              estado,
              esDomingo
            } = getInfoDia(dia);

            const esSeleccionado = fechaSeleccionada === fechaStr;

            // Clases de estilo según el requerimiento:
            // Tesista: días inhabilitados salen en gris y deshabilitados (disabled)
            // Secretaría: permite habilitar o inhabilitar con el check
            let estiloContenedor = '';
            let estiloBadge = '';

            if (esDomingo) {
              estiloContenedor = 'border-slate-100 bg-slate-50/50 text-slate-300 cursor-not-allowed opacity-50';
              estiloBadge = 'text-slate-400';
            } else if (!esHabilitado) {
              // INHABILITADO POR DEFECTO
              if (modoAdmin) {
                estiloContenedor = 'border-slate-200 bg-slate-100/60 hover:bg-slate-100 hover:border-slate-300 cursor-pointer';
                estiloBadge = 'text-slate-500 bg-slate-200/80';
              } else {
                estiloContenedor = 'border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed opacity-60';
                estiloBadge = 'text-slate-400 bg-slate-200/60';
              }
            } else if (estado === 'lleno') {
              estiloContenedor = 'border-rose-200 bg-rose-50/40 cursor-pointer';
              estiloBadge = 'text-rose-700 bg-rose-100';
            } else {
              // HABILITADO
              estiloContenedor = 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-500 hover:bg-emerald-50/40 cursor-pointer';
              estiloBadge = 'text-emerald-800 bg-emerald-100/90 font-semibold';
            }

            if (esSeleccionado) {
              estiloContenedor = 'ring-2 ring-unt-blue border-unt-blue shadow-md bg-white';
            }

            const handleClickCelda = () => {
              if (esDomingo) return;
              if (!modoAdmin && !esHabilitado) return; // Tesista no puede seleccionar días inhabilitados
              onSelectFecha(fechaStr);
            };

            const handleToggleCheckSecretaria = (e: React.MouseEvent) => {
              e.stopPropagation();
              toggleHabilitarFecha(fechaStr);
            };

            const tesistaDeshabilitado = !modoAdmin && (!esHabilitado || esDomingo);

            return (
              <button
                key={dia}
                type="button"
                onClick={handleClickCelda}
                disabled={tesistaDeshabilitado}
                className={`h-20 sm:h-24 p-2 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between relative group ${estiloContenedor}`}
                title={
                  esDomingo
                    ? 'Domingo sin atención institucional'
                    : !esHabilitado
                    ? modoAdmin ? 'Día inhabilitado. Haz clic para habilitar' : 'Día inhabilitado por Secretaría'
                    : `Habilitado (${cuposDisponibles}/${totalCupos} cupos libres)`
                }
              >
                {/* Cabecera de la celda: Número de día y Check rápido para Secretaría */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      esSeleccionado
                        ? 'text-unt-blue'
                        : !esHabilitado || esDomingo
                        ? 'text-slate-400'
                        : 'text-slate-800'
                    }`}
                  >
                    {dia}
                  </span>

                  {/* Check de estado para Secretaría */}
                  {modoAdmin && !esDomingo && (
                    <button
                      type="button"
                      onClick={handleToggleCheckSecretaria}
                      className={`p-1 rounded-md transition-all cursor-pointer flex items-center justify-center ${
                        esHabilitado
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                          : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                      }`}
                      title={esHabilitado ? 'Inhabilitar este día' : 'Habilitar este día'}
                    >
                      {esHabilitado ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                    </button>
                  )}

                  {!modoAdmin && esHabilitado && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 opacity-70 group-hover:opacity-100" />
                  )}
                </div>

                {/* Badge Inferior */}
                <div className="w-full">
                  {esDomingo ? (
                    <div className="text-[10px] text-slate-400 font-medium">Domingo</div>
                  ) : !esHabilitado ? (
                    <div className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5 rounded-sm bg-slate-200/70 truncate flex items-center justify-between">
                      <span>Inhabilitado</span>
                      {modoAdmin && <span className="text-[9px] text-slate-400">(Inactivo)</span>}
                    </div>
                  ) : estado === 'lleno' ? (
                    <div className="text-[10px] text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-sm font-bold">
                      Completo ({totalCupos}/{totalCupos})
                    </div>
                  ) : (
                    <div
                      className={`text-[10px] px-1.5 py-0.5 rounded-sm flex items-center justify-between ${estiloBadge}`}
                    >
                      <span>Cupos:</span>
                      <span className="font-bold">{cuposDisponibles}/{totalCupos}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};