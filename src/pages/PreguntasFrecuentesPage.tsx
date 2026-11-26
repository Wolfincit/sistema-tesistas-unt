import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FaqItem } from '../types';
import { normalizarTexto } from '../services/tesisService';
import {
  HelpCircle,
  Plus,
  Edit3,
  Trash2,
  Search,
  X,
  Check
} from 'lucide-react';

export const PreguntasFrecuentesPage: React.FC = () => {
  const { faqs, rolActual, agregarFaq, editarFaq, eliminarFaq } = useApp();
  const [busqueda, setBusqueda] = useState<string>('');
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [faqEditando, setFaqEditando] = useState<FaqItem | null>(null);
  const [pregunta, setPregunta] = useState<string>('');
  const [respuesta, setRespuesta] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('Requisitos');

  const esSecretaria = rolActual === 'secretaria';

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
