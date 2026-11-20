import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FaqItem, ConsultaTesista } from '../types';
import { normalizarTexto } from '../services/tesisService';
import {
  HelpCircle,
  Plus,
  Edit3,
  Trash2,
  Search,
  X,
  Check,
  Sparkles
} from 'lucide-react';

interface SugerenciaFaqDetectada {
  key: string;
  preguntaSugerida: string;
  respuestaSugerida: string;
  categoria: string;
  frecuencia: number;
  origenLabel: string;
}

const PATRONES_TEMAS_FRECUENTES = [
  {
    id: 'turnitin-firma',
    regex: /(turnitin|similitud|porcentaje|plagio|firma.*asesor|refirma|dnie)/i,
    categoria: 'Requisitos',
    preguntaBase: '¿Cómo debe presentarse la firma del asesor en el reporte de Turnitin?',
    respuestaBase:
      'El reporte de similitud Turnitin (< 20%) debe contar con la firma digital válida del docente asesor (mediante certificado digital RENIEC/UNT) o firma manuscrita escaneada legible en la constancia de originalidad.'
  },
  {
    id: 'resolucion-jurado',
    regex: /(jurado|resoluci[oó]n|decanal|tribunal|tres docentes)/i,
    categoria: 'Expediente',
    preguntaBase: '¿Cuánto demora la emisión de la Resolución Decanal de designación de Jurado?',
    respuestaBase:
      'Una vez ingresado el FUT y aprobado el proyecto de tesis, la Resolución Decanal de Jurado Evaluador se emite en un plazo promedio de 3 a 5 días hábiles y debe adjuntarse en PDF en Gestión Documentaria.'
  },
  {
    id: 'no-adeudo',
    regex: /(adeudo|biblioteca|laboratorio|tesorer[ií]a|constancia)/i,
    categoria: 'Requisitos',
    preguntaBase: '¿Qué áreas comprende la Constancia de No Adeudo y cuál es su vigencia?',
    respuestaBase:
      'La Constancia de No Adeudo certifica no tener pendientes con Biblioteca Central, laboratorios de Ingeniería Industrial ni Tesorería UNT. Tiene una vigencia institucional de 60 días calendario.'
  },
  {
    id: 'cambio-horario-reserva',
    regex: /(cambiar.*fecha|reprogramar|cancelar.*reserva|corregir.*t[ií]tulo|auditorio|horario)/i,
    categoria: 'Auditorio',
    preguntaBase: '¿Puedo corregir el título de mi tesis o cambiar mi turno de auditorio después de reservar?',
    respuestaBase:
      'Sí. En la pestaña Reserva de Auditorio puedes usar el botón "Corregir Datos" para actualizar el título o asesor sin perder tu cupo, o "Eliminar Reserva" si necesitas liberar el turno y elegir otra fecha disponible.'
  },
  {
    id: 'egresado-fut',
    regex: /(egresado|fut|formato [uú]nico|recibo|derecho de tr[aá]mite)/i,
    categoria: 'Formatos',
    preguntaBase: '¿Qué datos deben consignarse obligatoriamente en el Formato Único de Trámite (FUT)?',
    respuestaBase:
      'En el FUT debes indicar tu código de matrícula, correo institucional @unitru.edu.pe, el título exacto de tu tesis según resolución y solicitar expresamente la declaración de apto y fecha de sustentación.'
  }
];

function generarSugerenciasDesdeConsultas(
  consultas: ConsultaTesista[],
  faqsExistentes: FaqItem[]
): SugerenciaFaqDetectada[] {
  const preguntasActualesNorm = faqsExistentes.map((f) => normalizarTexto(f.pregunta));
  const yaExisteEnFaqs = (preguntaCandidata: string) => {
    const norm = normalizarTexto(preguntaCandidata);
    return preguntasActualesNorm.some(
      (actual) => actual === norm || (norm.length > 20 && actual.includes(norm.slice(0, 28)))
    );
  };

  const sugerencias: SugerenciaFaqDetectada[] = [];
  const consultasUsadas = new Set<string>();

  // 1. Analizar patrones recurrentes entre las consultas reales enviadas por los tesistas
  for (const patron of PATRONES_TEMAS_FRECUENTES) {
    const coincidentes = consultas.filter((c) =>
      patron.regex.test(`${c.asunto} ${c.mensaje}`)
    );

    if (coincidentes.length > 0) {
      coincidentes.forEach((c) => consultasUsadas.add(c.id));
      const conRespuesta = coincidentes.find((c) => c.respuestaTexto && c.respuestaTexto.trim().length > 15);
      const preguntaSugerida = patron.preguntaBase;

      if (!yaExisteEnFaqs(preguntaSugerida)) {
        sugerencias.push({
          key: `pat-${patron.id}`,
          preguntaSugerida,
          respuestaSugerida: conRespuesta?.respuestaTexto?.trim() || patron.respuestaBase,
          categoria: patron.categoria,
          frecuencia: coincidentes.length,
          origenLabel:
            coincidentes.length > 1
              ? `${coincidentes.length} consultas de tesistas sobre este tema`
              : `Detectado en consulta de ${coincidentes[0].tesistaNombre}`
        });
      }
    }
  }

  // 2. Incluir cualquier otra consulta individual de los tesistas que no haya caído en los patrones anteriores
  for (const c of consultas) {
    if (consultasUsadas.has(c.id)) continue;
    const preguntaLimpia = c.asunto.trim().endsWith('?')
      ? c.asunto.trim()
      : `¿${c.asunto.trim()}?`;

    if (yaExisteEnFaqs(preguntaLimpia)) continue;

    sugerencias.push({
      key: `cons-${c.id}`,
      preguntaSugerida: preguntaLimpia,
      respuestaSugerida:
        c.respuestaTexto?.trim() ||
        'Escriba aquí la respuesta oficial para que todos los tesistas puedan consultarla directamente.',
      categoria: 'General',
      frecuencia: 1,
      origenLabel: `Consulta enviada por ${c.tesistaNombre}`
    });
  }

  // 3. Si el buzón aún no tiene consultas nuevas pero faltan temas frecuentes base, sugerir los más útiles para los tesistas
  for (const patron of PATRONES_TEMAS_FRECUENTES) {
    if (sugerencias.length >= 4) break;
    if (sugerencias.some((s) => s.key === `pat-${patron.id}`)) continue;
    if (yaExisteEnFaqs(patron.preguntaBase)) continue;

    sugerencias.push({
      key: `pat-${patron.id}`,
      preguntaSugerida: patron.preguntaBase,
      respuestaSugerida: patron.respuestaBase,
      categoria: patron.categoria,
      frecuencia: 1,
      origenLabel: 'Tema recurrente en trámites de titulación'
    });
  }

  return sugerencias.sort((a, b) => b.frecuencia - a.frecuencia);
}

export const PreguntasFrecuentesPage: React.FC = () => {
  const { faqs, consultas, rolActual, agregarFaq, editarFaq, eliminarFaq } = useApp();
  const [busqueda, setBusqueda] = useState<string>('');
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [faqEditando, setFaqEditando] = useState<FaqItem | null>(null);
  const [pregunta, setPregunta] = useState<string>('');
  const [respuesta, setRespuesta] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('Requisitos');

  const esSecretaria = rolActual === 'secretaria';

  const sugerenciasDetectadas = useMemo(() => {
    if (!esSecretaria) return [];
    return generarSugerenciasDesdeConsultas(consultas, faqs);
  }, [esSecretaria, consultas, faqs]);

  const faqsFiltradas = faqs.filter((f) => {
    if (!busqueda.trim()) return true;
    const q = normalizarTexto(busqueda);
    return (
      normalizarTexto(f.pregunta).includes(q) ||
      normalizarTexto(f.respuesta).includes(q) ||
      normalizarTexto(f.categoria || '').includes(q)
    );
  });

  const handleAbrirNuevo = () => {
    setFaqEditando(null);
    setPregunta('');
    setRespuesta('');
    setCategoria('Requisitos');
    setModalAbierto(true);
  };

  const handleAbrirEditar = (item: FaqItem) => {
    setFaqEditando(item);
    setPregunta(item.pregunta);
    setRespuesta(item.respuesta);
    setCategoria(item.categoria || 'General');
    setModalAbierto(true);
  };

  const handleRevisarSugerencia = (sug: SugerenciaFaqDetectada) => {
    setFaqEditando(null);
    setPregunta(sug.preguntaSugerida);
    setRespuesta(sug.respuestaSugerida);
    setCategoria(sug.categoria);
    setModalAbierto(true);
  };

  const handlePublicarSugerenciaDirecto = async (sug: SugerenciaFaqDetectada) => {
    await agregarFaq({
      pregunta: sug.preguntaSugerida,
      respuesta: sug.respuestaSugerida,
      categoria: sug.categoria
    });
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pregunta.trim() || !respuesta.trim()) return;

    if (faqEditando) {
      await editarFaq(faqEditando.id, { pregunta, respuesta, categoria });
    } else {
      await agregarFaq({ pregunta, respuesta, categoria });
    }
    setModalAbierto(false);
    setFaqEditando(null);
  };

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-[#082F64]" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Preguntas Frecuentes
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar pregunta..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#082F64] focus:outline-hidden"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {esSecretaria && (
            <button
              type="button"
              onClick={handleAbrirNuevo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Pregunta</span>
            </button>
          )}
        </div>
      </div>

      {/* PANEL INTELIGENTE PARA SECRETARÍA: SUGERENCIAS DE PREGUNTAS FRECUENTES SEGÚN CONSULTAS DE TESISTAS */}
      {esSecretaria && sugerenciasDetectadas.length > 0 && (
        <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Sugerencias según consultas de los tesistas ({sugerenciasDetectadas.length})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {sugerenciasDetectadas.slice(0, 4).map((sug) => (
              <div
                key={sug.key}
                className="bg-white rounded-xl border border-amber-200/90 p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-[#082F64] font-bold">
                      {sug.categoria}
                    </span>
                    <span className="font-semibold text-amber-700">
                      {sug.origenLabel}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {sug.preguntaSugerida}
                  </h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {sug.respuestaSugerida}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleRevisarSugerencia(sug)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold cursor-pointer"
                  >
                    Editar antes
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePublicarSugerenciaDirecto(sug)}
                    className="px-2.5 py-1 rounded-lg bg-[#082F64] hover:bg-[#0C4D96] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Publicar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Preguntas y Respuestas Publicadas */}
      {faqsFiltradas.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {faqsFiltradas.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  {item.categoria && (
                    <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-[#082F64] border border-blue-200 text-[10px] font-bold">
                      {item.categoria}
                    </span>
                  )}
                  <h3 className="text-sm font-bold text-slate-900">
                    {item.pregunta}
                  </h3>
                </div>

                {esSecretaria && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAbrirEditar(item)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-[#082F64]" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarFaq(item.id)}
                      className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                      title="Eliminar pregunta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                {item.respuesta}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-xs text-slate-500">
          No hay preguntas frecuentes registradas.
        </div>
      )}

      {/* Modal para Agregar / Editar Pregunta Frecuente (Secretaría) */}
      {modalAbierto && esSecretaria && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setModalAbierto(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#082F64] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {faqEditando ? 'Editar Pregunta Frecuente' : 'Nueva Pregunta Frecuente'}
              </h3>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="p-1 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Categoría:</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 font-medium"
                >
                  <option value="Requisitos">Requisitos</option>
                  <option value="Auditorio">Auditorio</option>
                  <option value="Expediente">Expediente</option>
                  <option value="Formatos">Formatos</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Pregunta:</label>
                <input
                  type="text"
                  required
                  value={pregunta}
                  onChange={(e) => setPregunta(e.target.value)}
                  placeholder="Ej: ¿Cuál es el porcentaje máximo de Turnitin?"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Respuesta Oficial:</label>
                <textarea
                  required
                  rows={4}
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  placeholder="Escriba la respuesta clara para los tesistas..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
