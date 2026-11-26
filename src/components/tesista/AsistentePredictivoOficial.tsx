import React, { useState, useMemo } from 'react';
import {
  buscarEnBaseOficial,
  OFFICIAL_KB_ENTRIES,
  OfficialKbEntry
} from '../../data/officialKnowledgeBase';
import { logisticaSecretariaService } from '../../services/logisticaSecretariaService';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Sparkles,
  BookCheck,
  ExternalLink,
  Send,
  CheckCircle2,
  X,
  HelpCircle
} from 'lucide-react';

interface AsistentePredictivoOficialProps {
  codigoMatricula?: string;
  tesistaNombre?: string;
  preguntasSugeridasIds?: string[];
}

export const AsistentePredictivoOficial: React.FC<AsistentePredictivoOficialProps> = ({
  codigoMatricula,
  tesistaNombre,
  preguntasSugeridasIds
}) => {
  const { faqs, agregarToast } = useApp();
  const [consulta, setConsulta] = useState<string>('');
  const [seleccionada, setSeleccionada] = useState<OfficialKbEntry | null>(null);
  const [dudaEnviada, setDudaEnviada] = useState<boolean>(false);
  const [enviandoDuda, setEnviandoDuda] = useState<boolean>(false);
  const [matriculaManual, setMatriculaManual] = useState<string>(codigoMatricula || '');

  const sugeridas = useMemo(() => {
    const ids =
      preguntasSugeridasIds && preguntasSugeridasIds.length > 0
        ? preguntasSugeridasIds
        : [
            'kb-proyecto-asesor',
            'kb-nombramiento-jurado',
            'kb-dictamen-fisico',
            'kb-horario-auditorio-costo',
            'kb-etica-turnitin-2',
            'kb-bachiller-vs-titulado'
          ];
    return ids
      .map((id) => OFFICIAL_KB_ENTRIES.find((e) => e.id === id))
      .filter((x): x is OfficialKbEntry => Boolean(x));
  }, [preguntasSugeridasIds]);

  const busquedaRes = useMemo(() => {
    if (consulta.trim().length < 3) return null;
    return buscarEnBaseOficial(consulta, faqs);
  }, [consulta, faqs]);

  const handleEnviarASecretaria = async () => {
    const texto = consulta.trim();
    if (texto.length < 5) return;
    setEnviandoDuda(true);
    try {
      await logisticaSecretariaService.registrarDudaTesista({
        codigoMatricula: codigoMatricula || matriculaManual,
        tesistaNombre,
        pregunta: texto,
        categoriaSugerida: 'Trámite'
      });
      setDudaEnviada(true);
      agregarToast(
        'success',
        'Consulta enviada a Secretaría',
        'La Srta. Celia la revisará y te llegará un aviso automático cuando responda.'
      );
    } finally {
      setEnviandoDuda(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              Asistente Oficial de Dudas de Tesis
            </h3>
            <p className="text-xs text-slate-500">
              Respuestas verificadas de las Guías Oficiales de la Escuela (Drive) y Secretaría — nunca inventa montos ni pasos.
            </p>
          </div>
        </div>
      </div>

      {/* Buscador predictivo */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={consulta}
          onChange={(e) => {
            setConsulta(e.target.value);
            setSeleccionada(null);
            setDudaEnviada(false);
          }}
          placeholder="Escribe tu duda (ej. cuánto cuesta el auditorio, Turnitin, cambio de título, Bachiller, URA...)"
          className="w-full pl-10 pr-9 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#082F64] focus:outline-hidden text-xs sm:text-sm font-medium text-slate-800"
        />
        {consulta && (
          <button
            type="button"
            onClick={() => {
              setConsulta('');
              setSeleccionada(null);
              setDudaEnviada(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Chips predictivos (adaptados a la etapa actual si el alumno ya ingresó matrícula) */}
      {!busquedaRes && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {codigoMatricula ? 'Dudas frecuentes para tu etapa actual:' : 'Consultas más frecuentes:'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sugeridas.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSeleccionada(seleccionada?.id === item.id ? null : item)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                  seleccionada?.id === item.id
                    ? 'bg-[#082F64] text-white border-[#082F64]'
                    : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200 hover:border-blue-200'
                }`}
              >
                {item.pregunta}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Respuesta de chip seleccionado */}
      {!busquedaRes && seleccionada && (
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#082F64]">
              <BookCheck className="w-3.5 h-3.5 text-emerald-600" />
              {seleccionada.fuenteOficial}
            </span>
            <button
              type="button"
              onClick={() => setSeleccionada(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h4 className="text-sm font-black text-slate-900">{seleccionada.pregunta}</h4>
          <p className="text-xs sm:text-[13px] text-slate-700 whitespace-pre-line leading-relaxed">
            {seleccionada.respuesta}
          </p>
          {seleccionada.linkUrl && (
            <a
              href={seleccionada.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-[#082F64] hover:bg-blue-100 text-xs font-bold"
            >
              <span>{seleccionada.linkTexto || 'Abrir documento oficial'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Resultados de búsqueda oficial */}
      {busquedaRes && busquedaRes.encontrado && (
        <div className="space-y-3 animate-in fade-in">
          {busquedaRes.resultados.map((res) => (
            <div
              key={res.id}
              className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800">
                  <BookCheck className="w-3.5 h-3.5" />
                  {res.fuenteOficial}
                </span>
                <span className="px-2 py-0.5 rounded bg-white border border-emerald-200 text-[10px] font-bold text-slate-600">
                  {res.categoria}
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900">{res.pregunta}</h4>
              <p className="text-xs sm:text-[13px] text-slate-700 whitespace-pre-line leading-relaxed">
                {res.respuesta}
              </p>
              {res.linkUrl && (
                <a
                  href={res.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-900 hover:bg-emerald-100 text-xs font-bold"
                >
                  <span>{res.linkTexto || 'Abrir enlace oficial'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Si NO existe en la base oficial: NO inventar, derivar 1 sola vez a Srta. Celia */}
      {busquedaRes && !busquedaRes.encontrado && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in">
          {dudaEnviada ? (
            <div className="flex items-center gap-2.5 text-emerald-900 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                ¡Listo! Enviamos tu duda a la Srta. Celia. Cuando la responda, quedará publicada en Preguntas Frecuentes y recibirás el aviso en tu celular.
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950">
                  <strong>No encontré esta consulta exacta en las guías oficiales.</strong> Para no darte datos incorrectos, puedes enviársela directo a la Srta. Celia y su respuesta oficial se guardará aquí:
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {!codigoMatricula && (
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={matriculaManual}
                    onChange={(e) => setMatriculaManual(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Tu matrícula (10 dígitos, opcional)"
                    className="sm:w-56 px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-mono font-bold text-slate-800"
                  />
                )}
                <button
                  type="button"
                  disabled={enviandoDuda}
                  onClick={handleEnviarASecretaria}
                  className="px-4 py-2 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-amber-300" />
                  <span>{enviandoDuda ? 'Enviando...' : 'Enviar consulta a Secretaría'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
