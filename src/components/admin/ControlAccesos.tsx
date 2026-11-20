import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  UploadCloud, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  FileSpreadsheet, 
  X,
  KeyRound,
  RotateCcw
} from 'lucide-react';

export const ControlAccesos: React.FC = () => {
  const { 
    correosAutorizados, 
    agregarCorreoAutorizado, 
    toggleActivoCorreo, 
    eliminarCorreoAutorizado, 
    eliminarCorreosMultiple,
    vaciarPadron,
    importarCorreosMasivo,
    resetearPasswordTesista,
    agregarToast
  } = useApp();

  const [busqueda, setBusqueda] = useState<string>('');
  const [modalManualAbierto, setModalManualAbierto] = useState<boolean>(false);
  const [modalImportarAbierto, setModalImportarAbierto] = useState<boolean>(false);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [correo, setCorreo] = useState<string>('');
  const [nombre, setNombre] = useState<string>('');
  const [codigo, setCodigo] = useState<string>('');
  const [promocion, setPromocion] = useState<string>('2026-I');
  const [textoImportacion, setTextoImportacion] = useState<string>('');
  const [procesando, setProcesando] = useState<boolean>(false);

  const correosFiltrados = correosAutorizados.filter((c) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase().trim();
    return (
      c.correo.toLowerCase().includes(q) ||
      c.nombreGraduando.toLowerCase().includes(q) ||
      c.codigoMatricula.includes(q)
    );
  });

  const handleCrearManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo.trim() || !nombre.trim() || !codigo.trim()) return;

    await agregarCorreoAutorizado({
      correo: correo.trim(),
      nombreGraduando: nombre.trim(),
      codigoMatricula: codigo.trim(),
      promocion
    });

    setCorreo('');
    setNombre('');
    setCodigo('');
    setModalManualAbierto(false);
  };

  const handleProcesarArchivoImportacion = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (text) {
          setProcesando(true);
          await importarCorreosMasivo(text);
          setProcesando(false);
          setModalImportarAbierto(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportarTexto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoImportacion.trim()) return;

    setProcesando(true);
    await importarCorreosMasivo(textoImportacion);
    setProcesando(false);
    setTextoImportacion('');
    setModalImportarAbierto(false);
  };

  const totalHabilitados = correosAutorizados.filter((c) => c.activo).length;

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-unt-blue" />
            <span>Control de Accesos y Padrón de Egresados</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-unt-blue text-[11px] font-bold">
              {totalHabilitados} habilitados
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Los estudiantes solo podrán iniciar sesión si su correo institucional (@unitru.edu.pe) figura en esta lista oficial.
          </p>
        </div>

        {/* Botones de Carga y Gestión */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModalImportarAbierto(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-unt-blue" />
            <span>Subir Excel / Word / TXT</span>
          </button>

          <button
            type="button"
            onClick={() => setModalManualAbierto(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-unt-blue hover:bg-unt-blue-light rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Agregar Correo</span>
          </button>
        </div>
      </div>

      {/* Buscador y Tabla de Correos Autorizados */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por correo, nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                if (correosAutorizados.length === 0) {
                  agregarToast('info', 'Padrón Vacío', 'El padrón está listo para cargar los correos de egresados.');
                  return;
                }
                if (confirm('⚠️ ¿Está completamente segura(o) de vaciar TODO el padrón de egresados? Esta acción eliminará todos los accesos registrados.')) {
                  await vaciarPadron();
                  setSeleccionados([]);
                }
              }}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Eliminar todos los registros de una sola vez"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Vaciar todo el padrón</span>
            </button>
          </div>
        </div>

        {/* Barra de Acciones Masivas cuando hay seleccionados */}
        {seleccionados.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50/90 border border-blue-200 px-4 py-2.5 rounded-xl text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-unt-blue font-bold">
              <span className="w-2 h-2 rounded-full bg-unt-blue animate-pulse"></span>
              <span>{seleccionados.length} {seleccionados.length === 1 ? 'correo seleccionado' : 'correos seleccionados'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSeleccionados([])}
                className="text-[11px] text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-white/80 cursor-pointer"
              >
                Deseleccionar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`¿Eliminar los ${seleccionados.length} correos seleccionados del padrón?`)) {
                    await eliminarCorreosMultiple(seleccionados);
                    setSeleccionados([]);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar seleccionados ({seleccionados.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-x-auto border border-slate-200/70 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={correosFiltrados.length > 0 && correosFiltrados.every((c) => seleccionados.includes(c.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const ids = correosFiltrados.map((c) => c.id);
                        setSeleccionados(Array.from(new Set([...seleccionados, ...ids])));
                      } else {
                        const setF = new Set(correosFiltrados.map((c) => c.id));
                        setSeleccionados(seleccionados.filter((id) => !setF.has(id)));
                      }
                    }}
                    className="rounded text-unt-blue focus:ring-unt-blue cursor-pointer w-3.5 h-3.5"
                    title="Seleccionar / deseleccionar todos los mostrados"
                  />
                </th>
                <th className="p-3.5">Correo Institucional</th>
                <th className="p-3.5">Graduando Titular</th>
                <th className="p-3.5">Cód. Matrícula</th>
                <th className="p-3.5">Contraseña</th>
                <th className="p-3.5">Promoción</th>
                <th className="p-3.5">Estado de Acceso</th>
                <th className="p-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {correosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">El padrón de egresados está limpio y listo para su uso.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Utilice <strong>Subir Excel / Word / TXT</strong> o <strong>+ Agregar Correo</strong> para registrar a los estudiantes habilitados para titulación.
                    </p>
                  </td>
                </tr>
              ) : (
                correosFiltrados.map((c) => {
                  const estaSeleccionado = seleccionados.includes(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/60 transition-colors ${estaSeleccionado ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={estaSeleccionado}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSeleccionados([...seleccionados, c.id]);
                            } else {
                              setSeleccionados(seleccionados.filter((id) => id !== c.id));
                            }
                          }}
                          className="rounded text-unt-blue focus:ring-unt-blue cursor-pointer w-3.5 h-3.5"
                        />
                      </td>
                      <td className="p-3.5 font-mono font-bold text-unt-blue">
                        {c.correo}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {c.nombreGraduando}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {c.codigoMatricula}
                      </td>
                      <td className="p-3.5">
                        {c.passwordCambiada ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
                              <KeyRound className="w-3 h-3" />
                              <span>Clave personalizada</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => resetearPasswordTesista(c.id)}
                              title="Restablecer contraseña a su Número de Matrícula"
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold">
                            <KeyRound className="w-3 h-3 text-slate-400" />
                            <span>N° Matrícula</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {c.promocion}
                      </td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => toggleActivoCorreo(c.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            c.activo
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                          title="Clic para habilitar o suspender acceso"
                        >
                          {c.activo ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Autorizado</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Inhabilitado</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`¿Retirar el correo "${c.correo}" del padrón?`)) {
                              await eliminarCorreoAutorizado(c.id);
                              setSeleccionados((prev) => prev.filter((id) => id !== c.id));
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar correo del padrón"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar Individual */}
      {modalManualAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-[#082F64] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Agregar Egresado al Padrón</h3>
              <button
                type="button"
                onClick={() => setModalManualAbierto(false)}
                className="p-1 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearManual} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Correo Institucional (@unitru.edu.pe):
                </label>
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@unitru.edu.pe"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nombre Completo del Graduando:
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Br. Mario Roberto Castillo Mendoza"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Código de Matrícula:</label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="1021400999"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  >
                  </input>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Promoción:</label>
                  <input
                    type="text"
                    value={promocion}
                    onChange={(e) => setPromocion(e.target.value)}
                    placeholder="2026-I"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalManualAbierto(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-unt-blue hover:bg-unt-blue-light text-white font-bold rounded-xl shadow-2xs"
                >
                  Habilitar Acceso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Carga Masiva (Excel / Word / PDF / TXT) */}
      {modalImportarAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-[#082F64] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-bold">Carga Masiva de Correos al Padrón</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalImportarAbierto(false)}
                className="p-1 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Opción 1: Subir Archivo */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                <FileSpreadsheet className="w-8 h-8 text-unt-blue mx-auto mb-2" />
                <p className="font-bold text-slate-800">
                  Suba archivo Excel (.xlsx / .csv), Word (.docx) o Texto (.txt)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  El sistema extraerá automáticamente todos los correos @unitru.edu.pe detectados en el archivo.
                </p>
                <label className="inline-block mt-3 px-4 py-2 bg-unt-blue hover:bg-unt-blue-light text-white font-bold rounded-xl shadow-2xs cursor-pointer">
                  Examinar archivo local
                  <input
                    type="file"
                    accept=".csv,.txt,.xlsx,.docx,.pdf"
                    className="hidden"
                    onChange={handleProcesarArchivoImportacion}
                  />
                </label>
              </div>

              {/* Opción 2: Pegar lista de correos */}
              <form onSubmit={handleImportarTexto} className="space-y-2">
                <label className="block font-bold text-slate-700">
                  O pegue una lista de correos directamente:
                </label>
                <textarea
                  rows={4}
                  value={textoImportacion}
                  onChange={(e) => setTextoImportacion(e.target.value)}
                  placeholder="ejemplo1@unitru.edu.pe&#10;ejemplo2@unitru.edu.pe&#10;ejemplo3@unitru.edu.pe..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                />
                <button
                  type="submit"
                  disabled={procesando || !textoImportacion.trim()}
                  className="w-full py-2.5 bg-unt-blue hover:bg-unt-blue-light disabled:opacity-50 text-white font-bold rounded-xl shadow-2xs cursor-pointer"
                >
                  {procesando ? 'Procesando correos...' : 'Importar y Habilitar en el Padrón'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
