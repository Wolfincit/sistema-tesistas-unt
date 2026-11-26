import React, { useState, useMemo, useEffect } from 'react';
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
  X,
  HelpCircle,
  MessageCircle,
  AlertTriangle
} from 'lucide-react';

interface AsistentePredictivoOficialProps {
  codigoMatricula?: string;
  tesistaNombre?: string;
  preguntasSugeridasIds?: string[];
}

export function normalizarUrlWhatsappSecretaria(raw?: string): string {
  const val = String(raw || '').trim();
  if (!val) return '';
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(val)) {
    return val;
  }
  const digits = val.replace(/\D/g, '');
  if (!digits) return '';
  const conPais = digits.length === 9 ? `51${digits}` : digits;
  return `https://wa.me/${conPais}`;
}

const TEMAS_RAPIDOS = [
  { label: 'Pagos Interbank', query: 'tasas interbank' },
  { label: 'Proyecto y Asesor', query: 'proyecto asesor' },
  { label: 'Jurado Evaluador', query: 'jurado' },
  { label: 'Turnitin y Ética', query: 'turnitin etica' },
  { label: 'Repositorio UNT', query: 'repositorio valerio' },
  { label: 'URA y Colación', query: 'ura colacion' },
  { label: 'Bachiller', query: 'bachiller' },
  { label: 'Cambio de Título', query: 'cambio de titulo' }
];

export const AsistentePredictivoOficial: React.FC<AsistentePredictivoOficialProps> = ({
  codigoMatricula,
  preguntasSugeridasIds
}) => {
  const { faqs, cargando } = useApp();
  const [consulta, setConsulta] = useState<string>('');
  const [seleccionada, setSeleccionada] = useState<OfficialKbEntry | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string>(() =>
    normalizarUrlWhatsappSecretaria(logisticaSecretariaService.getConfigColacion().whatsappSecretaria)
  );

  // Refrescar el enlace de WhatsApp cuando termine de sincronizar la BD remota (Turso)
  useEffect(() => {
    const cfg = logisticaSecretariaService.getConfigColacion();
    setWhatsappUrl(normalizarUrlWhatsappSecretaria(cfg.whatsappSecretaria));
  }, [cargando]);

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
    if (consulta.trim().length < 2) return null;
    return buscarEnBaseOficial(consulta, faqs);
  }, [consulta, faqs]);

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
              Escribe una palabra común (pagos, Turnitin, jurado, repositorio, URA, bachiller...) y consulta las guías oficiales.
            </p>
          </div>
        </div>
      </div>

      {/* Buscador orientativo por palabras comunes */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={consulta}
          onChange={(e) => {
            setConsulta(e.target.value);
            setSeleccionada(null);
          }}
          placeholder="Busca por palabra clave (ej. pagos, auditorio, Turnitin, cambio de título, Bachiller, URA...)"
          className="w-full pl-10 pr-9 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#082F64] focus:outline-hidden text-xs sm:text-sm font-medium text-slate-800"
        />
        {consulta && (
          <button
            type="button"
            onClick={() => {
              setConsulta('');
              setSeleccionada(null);
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

      {/* Si no coincide con lo escrito: orientar con temas comunes */}
      {busquedaRes && !busquedaRes.encontrado && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 animate-in fade-in">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-[#082F64] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700">
              <strong>No encontramos resultados con esa palabra.</strong> Prueba tocando uno de los temas comunes:
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TEMAS_RAPIDOS.map((tema) => (
              <button
                key={tema.label}
                type="button"
                onClick={() => setConsulta(tema.query)}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#082F64] hover:text-[#082F64] text-[11px] font-bold text-slate-700 cursor-pointer transition-colors"
              >
                {tema.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bloque de WhatsApp directo a Secretaría con advertencia previa obligatoria */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 text-xs text-amber-950">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-amber-950">Lee primero todos los pasos y procedimientos antes de consultar.</strong>{' '}
            <span className="text-amber-900">
              La mayoría de dudas sobre pagos, formatos, Turnitin, Repositorio y URA ya están respondidas aquí. Escribe a Secretaría únicamente si tu caso puntual no figura en las guías.
            </span>
          </div>
        </div>

        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs shrink-0 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Secretaría</span>
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-amber-200 text-[11px] font-semibold text-amber-900 shrink-0">
            <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>WhatsApp aún no configurado</span>
          </span>
        )}
      </div>
    </div>
  );
};
