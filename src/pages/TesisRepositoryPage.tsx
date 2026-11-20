import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TesisItem, AreaIngenieria, UniversidadId } from '../types';
import {
  tesisService,
  normalizarTexto,
  LiveSearchFuente,
  analizarOriginalidadTitulo,
  evaluarCoincidenciaBusqueda
} from '../services/tesisService';
import { UNIVERSIDADES_RANKING_PERU } from '../data/mockTesis';
import { useApp } from '../context/AppContext';
import {
  Search,
  GraduationCap,
  User,
  ChevronRight,
  ChevronLeft,
  Tag,
  Copy,
  Check,
  FileText,
  Download,
  Building2,
  Globe,
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  BookOpen,
  ArrowUpDown,
  Lock,
  RefreshCw,
  CheckSquare,
  Square,
  Sparkles,
  Maximize2,
  Columns,
  Bookmark,
  Trash2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const AREAS_INGENIERIA: AreaIngenieria[] = [
  'Logística y Cadena de Suministro',
  'Gestión de la Calidad',
  'Producción y Operaciones',
  'Seguridad y Salud Ocupacional',
  'Gestión de Proyectos'
];

const ANTECEDENTES_STORAGE_KEY = 'unt_mis_antecedentes_guardados_v1';

const UNIS_NACIONALES_IDS: UniversidadId[] = UNIVERSIDADES_RANKING_PERU
  .filter((u) => !u.fija)
  .map((u) => u.id);

const ITEMS_POR_PAGINA = 8;

export const TesisRepositoryPage: React.FC = () => {
  const { agregarToast } = useApp();

  // Base verificada + resultados fusionados en vivo
  const [catalogoBase, setCatalogoBase] = useState<TesisItem[]>([]);
  const [resultadosEnVivo, setResultadosEnVivo] = useState<TesisItem[]>([]);
  const [cargandoInicial, setCargandoInicial] = useState<boolean>(true);
  const [buscandoEnVivo, setBuscandoEnVivo] = useState<boolean>(false);
  const [fuentesEnVivo, setFuentesEnVivo] = useState<LiveSearchFuente[]>([]);
  const [totalRemoto, setTotalRemoto] = useState<number>(0);
  const [ultimaConsultaEnVivo, setUltimaConsultaEnVivo] = useState<string>('');

  // Estados de Filtros
  const [busqueda, setBusqueda] = useState<string>('');
  const [areaSeleccionada, setAreaSeleccionada] = useState<AreaIngenieria | 'TODAS'>('TODAS');
  const [tipoDocSeleccionado, setTipoDocSeleccionado] = useState<'TODOS' | 'Tesis' | 'Artículo Científico'>('TODOS');
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(0);
  const [asesorSeleccionado, setAsesorSeleccionado] = useState<string>('TODOS');
  const [inputAsesor, setInputAsesor] = useState<string>('');
  const [mostrarDropdownAsesor, setMostrarDropdownAsesor] = useState<boolean>(false);

  // Control de Universidades: UNT SIEMPRE FIJA + Referencias Nacionales seleccionables (Ranking Perú)
  const [referenciasActivas, setReferenciasActivas] = useState<boolean>(true);
  const [panelRankingAbierto, setPanelRankingAbierto] = useState<boolean>(false);
  const [unisNacionalesSeleccionadas, setUnisNacionalesSeleccionadas] = useState<UniversidadId[]>(
    UNIS_NACIONALES_IDS
  );

  // Ordenamiento y Paginación
  const [ordenamiento, setOrdenamiento] = useState<'similitud' | 'reciente' | 'titulo'>('similitud');
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [resumenesExpandidos, setResumenesExpandidos] = useState<Record<string, boolean>>({});
  const [tesisModal, setTesisModal] = useState<TesisItem | null>(null);
  const [modoVisorModal, setModoVisorModal] = useState<'dual' | 'pdf' | 'ficha'>('dual');
  const [copiadoModal, setCopiadoModal] = useState<boolean>(false);
  const [descargandoIds, setDescargandoIds] = useState<Record<string, boolean>>({});

  // Herramienta 1 de Valor para el Tesista: Verificador de Originalidad de Tema en la UNT
  const [verificadorAbierto, setVerificadorAbierto] = useState<boolean>(false);
  const [ideaTituloTesis, setIdeaTituloTesis] = useState<string>('');

  // Herramienta 2 de Valor para el Tesista: Carpeta de Antecedentes Guardados (Marco Teórico / APA 7)
  const [antecedentesIds, setAntecedentesIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(ANTECEDENTES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const asesorBoxRef = useRef<HTMLDivElement>(null);

  // Cargar base verificada de 116 tesis reales al instante
  useEffect(() => {
    let montado = true;
    const cargar = async () => {
      setCargandoInicial(true);
      const items = await tesisService.getAll();
      if (montado) {
        setCatalogoBase(items);
        setCargandoInicial(false);
      }
    };
    cargar();
    return () => {
      montado = false;
    };
  }, []);

  // Cerrar dropdown predictivo de asesor al hacer clic fuera
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (asesorBoxRef.current && !asesorBoxRef.current.contains(e.target as Node)) {
        setMostrarDropdownAsesor(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Lista efectiva de universidades activas (UNT SIEMPRE FIJA)
  const universidadesActivas = useMemo<UniversidadId[]>(() => {
    if (!referenciasActivas) return ['UNT'];
    return ['UNT', ...unisNacionalesSeleccionadas];
  }, [referenciasActivas, unisNacionalesSeleccionadas]);

  // Ejecutar búsqueda en tiempo real contra DSpace 7 (Top 8 Perú) + OpenAIRE (UNT)
  const ejecutarBusquedaEnVivo = async (termino: string, unisOverride?: UniversidadId[]) => {
    const unisObjetivo = unisOverride || universidadesActivas;
    setBuscandoEnVivo(true);
    setPaginaActual(1);
    try {
      const resp = await tesisService.buscarEnVivo({
        query: termino,
        universidades: unisObjetivo,
        limitePorUni: termino.trim() ? 12 : 8
      });
      setResultadosEnVivo(resp.resultados);
      setFuentesEnVivo(resp.fuentesConsultadas);
      setTotalRemoto(resp.totalEnRepositorios);
      setUltimaConsultaEnVivo(termino.trim());
    } catch {
      // Mantiene catálogo verificado sin romper la interfaz
    } finally {
      setBuscandoEnVivo(false);
    }
  };

  // Fusión sin duplicados entre resultados en vivo y el catálogo base verificado
  const todasLasTesis = useMemo(() => {
    return tesisService.fusionarResultados(resultadosEnVivo, catalogoBase);
  }, [resultadosEnVivo, catalogoBase]);

  // Universo filtrado por búsqueda, universidades, tipo, año y asesor (para que los conteos de líneas nunca mientan)
  const conteoPorArea = useMemo(() => {
    const baseParaConteo = tesisService.filtrarLocal(todasLasTesis, {
      query: busqueda,
      universidades: universidadesActivas,
      tipoDocumento: tipoDocSeleccionado,
      anio: anioSeleccionado,
      asesor: asesorSeleccionado !== 'TODOS' ? asesorSeleccionado : inputAsesor
    });
    const mapa: Record<string, number> = {};
    AREAS_INGENIERIA.forEach((a) => (mapa[a] = 0));
    baseParaConteo.forEach((t) => {
      mapa[t.area] = (mapa[t.area] || 0) + 1;
    });
    return { total: baseParaConteo.length, mapa };
  }, [todasLasTesis, busqueda, universidadesActivas, tipoDocSeleccionado, anioSeleccionado, asesorSeleccionado, inputAsesor]);

  // Si el usuario escribe una búsqueda y la línea seleccionada tiene 0 resultados pero en 'TODAS' sí hay tesis, pasar a 'TODAS' automáticamente
  useEffect(() => {
    if (
      areaSeleccionada !== 'TODAS' &&
      (conteoPorArea.mapa[areaSeleccionada] || 0) === 0 &&
      conteoPorArea.total > 0
    ) {
      setAreaSeleccionada('TODAS');
    }
  }, [busqueda, areaSeleccionada, conteoPorArea]);

  // Si el usuario tiene seleccionado 'Solo Tesis' o 'Artículo Científico' y su búsqueda da 0 pero en 'TODOS' sí existen coincidencias, abrir a 'TODOS'
  useEffect(() => {
    if (tipoDocSeleccionado !== 'TODOS' && conteoPorArea.total === 0 && busqueda.trim().length > 0) {
      const enTodos = tesisService.filtrarLocal(todasLasTesis, {
        query: busqueda,
        universidades: universidadesActivas,
        tipoDocumento: 'TODOS',
        anio: anioSeleccionado,
        asesor: asesorSeleccionado !== 'TODOS' ? asesorSeleccionado : inputAsesor
      });
      if (enTodos.length > 0) {
        setTipoDocSeleccionado('TODOS');
      }
    }
  }, [
    busqueda,
    tipoDocSeleccionado,
    conteoPorArea.total,
    todasLasTesis,
    universidadesActivas,
    anioSeleccionado,
    asesorSeleccionado,
    inputAsesor
  ]);

  // Años disponibles dinámicamente según los resultados reales del filtro actual
  const aniosDisponibles = useMemo(() => {
    const baseAnios = tesisService.filtrarLocal(todasLasTesis, {
      query: busqueda,
      universidades: universidadesActivas,
      tipoDocumento: tipoDocSeleccionado,
      area: areaSeleccionada,
      asesor: asesorSeleccionado !== 'TODOS' ? asesorSeleccionado : inputAsesor
    });
    const setAnios = new Set<number>();
    baseAnios.forEach((t) => {
      if (t.anio >= 2010 && t.anio <= 2027) setAnios.add(t.anio);
    });
    return Array.from(setAnios).sort((a, b) => b - a);
  }, [todasLasTesis, busqueda, universidadesActivas, tipoDocSeleccionado, areaSeleccionada, asesorSeleccionado, inputAsesor]);

  // Si el año seleccionado ya no tiene tesis con la búsqueda actual, restablecer a Todos (0)
  useEffect(() => {
    if (anioSeleccionado !== 0 && !aniosDisponibles.includes(anioSeleccionado)) {
      setAnioSeleccionado(0);
    }
  }, [anioSeleccionado, aniosDisponibles]);

  // Docentes asesores únicos de las universidades activas con su línea de especialidad principal
  const todosLosAsesores = useMemo(() => {
    const mapa: Record<string, { total: number; areas: Record<string, number> }> = {};
    const setUnis = new Set(universidadesActivas);
    todasLasTesis.forEach((t) => {
      if (!setUnis.has(t.universidadId || 'UNT')) return;
      if (t.asesor && !t.asesor.startsWith('Docente Asesor') && !t.asesor.startsWith('Docente Investigador')) {
        if (!mapa[t.asesor]) {
          mapa[t.asesor] = { total: 0, areas: {} };
        }
        mapa[t.asesor].total += 1;
        mapa[t.asesor].areas[t.area] = (mapa[t.asesor].areas[t.area] || 0) + 1;
      }
    });
    return Object.entries(mapa)
      .map(([nombre, info]) => {
        const especialidad =
          Object.entries(info.areas).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          'Producción y Operaciones';
        return { nombre, total: info.total, especialidad };
      })
      .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre));
  }, [todasLasTesis, universidadesActivas]);

  const coincidenciasAsesores = useMemo(() => {
    const qTokens = normalizarTexto(inputAsesor).split(/\s+/).filter(Boolean);
    if (qTokens.length === 0) return todosLosAsesores.slice(0, 12);
    return todosLosAsesores
      .filter((a) => {
        const nomNorm = normalizarTexto(a.nombre);
        return qTokens.every((tk) => nomNorm.includes(tk));
      })
      .slice(0, 12);
  }, [todosLosAsesores, inputAsesor]);

  // Filtrado completo insensible a tildes y ordenamiento
  const tesisFiltradas = useMemo(() => {
    const filtradas = tesisService.filtrarLocal(todasLasTesis, {
      query: busqueda,
      universidades: universidadesActivas,
      tipoDocumento: tipoDocSeleccionado,
      area: areaSeleccionada,
      anio: anioSeleccionado,
      asesor: asesorSeleccionado !== 'TODOS' ? asesorSeleccionado : inputAsesor
    });

    if (ordenamiento === 'reciente') {
      return [...filtradas].sort((a, b) => b.anio - a.anio);
    }
    if (ordenamiento === 'titulo') {
      return [...filtradas].sort((a, b) => a.titulo.localeCompare(b.titulo));
    }
    if (!busqueda.trim()) {
      return [...filtradas].sort((a, b) => {
        const aUnt = a.universidadId === 'UNT' ? 1 : 0;
        const bUnt = b.universidadId === 'UNT' ? 1 : 0;
        if (aUnt !== bUnt && !referenciasActivas) return bUnt - aUnt;
        return b.anio - a.anio;
      });
    }
    return filtradas;
  }, [
    todasLasTesis,
    busqueda,
    universidadesActivas,
    tipoDocSeleccionado,
    areaSeleccionada,
    anioSeleccionado,
    asesorSeleccionado,
    inputAsesor,
    ordenamiento,
    referenciasActivas
  ]);

  // Conteo por universidad para las fichas del selector
  const conteoPorUni = useMemo(() => {
    const mapa: Record<string, number> = {};
    todasLasTesis.forEach((t) => {
      const uid = t.universidadId || 'UNT';
      mapa[uid] = (mapa[uid] || 0) + 1;
    });
    return mapa;
  }, [todasLasTesis]);

  const totalPaginas = Math.max(1, Math.ceil(tesisFiltradas.length / ITEMS_POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const indiceInicio = (paginaSegura - 1) * ITEMS_POR_PAGINA;
  const indiceFin = Math.min(indiceInicio + ITEMS_POR_PAGINA, tesisFiltradas.length);
  const tesisPaginadas = tesisFiltradas.slice(indiceInicio, indiceFin);

  const handleBuscarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaginaActual(1);
    await ejecutarBusquedaEnVivo(busqueda);
  };

  // Antecedentes guardados por el tesista para su Plan / Informe de Tesis
  const antecedentesGuardados = useMemo(() => {
    const mapa = new Map(todasLasTesis.map((t) => [t.id, t]));
    return antecedentesIds.map((id) => mapa.get(id)).filter((t): t is TesisItem => Boolean(t));
  }, [todasLasTesis, antecedentesIds]);

  const toggleGuardarAntecedente = (tesis: TesisItem) => {
    setAntecedentesIds((prev) => {
      const existe = prev.includes(tesis.id);
      const siguiente = existe ? prev.filter((id) => id !== tesis.id) : [...prev, tesis.id];
      try {
        localStorage.setItem(ANTECEDENTES_STORAGE_KEY, JSON.stringify(siguiente));
      } catch {
        // ignore storage error
      }
      agregarToast(
        existe ? 'info' : 'success',
        existe ? 'Antecedente retirado' : 'Guardado en Mis Antecedentes',
        existe
          ? 'Se quitó la tesis de tu lista de antecedentes.'
          : 'Se agregó a tu lista de antecedentes para tu Marco Teórico.'
      );
      return siguiente;
    });
  };

  const handleCopiarTodosAntecedentesApa = async () => {
    if (antecedentesGuardados.length === 0) return;
    const texto = antecedentesGuardados
      .map((t, idx) => `${idx + 1}. ${generarCitaApa(t)}`)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // ignore
    }
    agregarToast(
      'success',
      'Citas APA 7 Copiadas',
      `Se copiaron ${antecedentesGuardados.length} referencias APA 7 listas para pegar en tu tesis.`
    );
  };

  // Análisis de Originalidad de Tema (Similitud simétrica Dice + Bigramas + 3 Pilares de Tesis UNT)
  const analisisOriginalidadUnt = useMemo(() => {
    return analizarOriginalidadTitulo(ideaTituloTesis, todasLasTesis);
  }, [ideaTituloTesis, todasLasTesis]);

  // Resaltador preciso insensible a tildes para los términos buscados en títulos de tesis
  const resaltarCoincidencias = (texto: string, consulta: string): React.ReactNode => {
    const qNorm = normalizarTexto(consulta);
    if (!qNorm) return texto;
    const tokens = qNorm
      .split(/\s+/)
      .filter((t) => t.length >= 2)
      .slice(0, 6);
    if (tokens.length === 0) return texto;

    const escaped = tokens
      .map((t) =>
        t
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/a/g, '[aá]')
          .replace(/e/g, '[eé]')
          .replace(/i/g, '[ií]')
          .replace(/o/g, '[oó]')
          .replace(/u/g, '[uúü]')
          .replace(/n/g, '[nñ]')
      )
      .join('|');
    try {
      const re = new RegExp(`(${escaped})`, 'gi');
      const partes = texto.split(re);
      return partes.map((parte, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-amber-200/80 text-slate-900 rounded px-0.5 font-extrabold">
            {parte}
          </mark>
        ) : (
          <React.Fragment key={i}>{parte}</React.Fragment>
        )
      );
    } catch {
      return texto;
    }
  };

  const handleToggleReferencias = () => {
    const nuevoEstado = !referenciasActivas;
    setReferenciasActivas(nuevoEstado);
    if (nuevoEstado) {
      if (unisNacionalesSeleccionadas.length === 0) {
        setUnisNacionalesSeleccionadas(UNIS_NACIONALES_IDS);
      }
      setPanelRankingAbierto(true);
    } else {
      setPanelRankingAbierto(false);
    }
    setPaginaActual(1);
  };

  const handleToggleUniversidadNacional = (id: UniversidadId) => {
    if (id === 'UNT') return; // UNT siempre fija
    setReferenciasActivas(true);
    setUnisNacionalesSeleccionadas((prev) => {
      const existe = prev.includes(id);
      const siguiente = existe ? prev.filter((u) => u !== id) : [...prev, id];
      if (siguiente.length === 0) {
        setReferenciasActivas(false);
      }
      return siguiente;
    });
    setPaginaActual(1);
  };

  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setAreaSeleccionada('TODAS');
    setTipoDocSeleccionado('TODOS');
    setAnioSeleccionado(0);
    setAsesorSeleccionado('TODOS');
    setInputAsesor('');
    setMostrarDropdownAsesor(false);
    setResultadosEnVivo([]);
    setFuentesEnVivo([]);
    setTotalRemoto(0);
    setUltimaConsultaEnVivo('');
    setOrdenamiento('similitud');
    setPaginaActual(1);
  };

  const toggleExpandirResumen = (id: string) => {
    setResumenesExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandirTodos = (expandir: boolean) => {
    const nuevo: Record<string, boolean> = {};
    tesisPaginadas.forEach((t) => (nuevo[t.id] = expandir));
    setResumenesExpandidos(nuevo);
  };

  const generarCitaApa = (tesis: TesisItem) => {
    const autorLimpio = tesis.autor.replace(/^Br\.\s*/i, '').trim();
    const tipoLabel =
      tesis.tipoDocumento === 'Artículo Científico'
        ? `Artículo de investigación en Ingeniería Industrial, ${tesis.universidad}`
        : `Tesis de Ingeniería Industrial, ${tesis.universidad}`;
    return `${autorLimpio} (${tesis.anio}). ${tesis.titulo} [${tipoLabel}]. Repositorio Institucional. ${tesis.handleUri}`;
  };

  const handleCopiarCita = async (tesis: TesisItem) => {
    try {
      await navigator.clipboard.writeText(generarCitaApa(tesis));
    } catch {
      // ignore clipboard fallback
    }
    agregarToast('success', 'Cita APA 7 Copiada', 'Referencia bibliográfica oficial copiada al portapapeles.');
  };

  const requiereVentanaFlotanteUnt = (tesis: TesisItem): boolean => {
    const raw = `${tesis.urlPdf || ''} ${tesis.handleUri || ''}`.toLowerCase();
    return raw.includes('repositorio.unitru.edu.pe') || raw.includes('20.500.14414');
  };

  const abrirVisorFlotanteUnicoUnt = (tesis: TesisItem) => {
    // Abre directamente el enlace binario PDF (/server/api/core/bitstreams/{uuid}/content) sin abrir páginas del repositorio
    const targetUrl = tesis.urlPdf || tesis.handleUri || tesis.urlRepositorio;
    const w = Math.min(1040, Math.round(window.screen.availWidth * 0.8));
    const h = Math.min(820, Math.round(window.screen.availHeight * 0.86));
    const left = Math.max(20, Math.round((window.screen.availWidth - w) / 2));
    const top = Math.max(20, Math.round((window.screen.availHeight - h) / 2));
    const win = window.open(
      targetUrl,
      'VisorOficialPDF_UNT',
      `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes`
    );
    if (win) {
      win.focus();
    }
  };

  const handleAbrirVisorIntegrado = (tesis: TesisItem) => {
    setTesisModal(tesis);
    setModoVisorModal('dual');
    setCopiadoModal(false);
    if (requiereVentanaFlotanteUnt(tesis)) {
      abrirVisorFlotanteUnicoUnt(tesis);
    }
  };

  const handleDescargarPdfDirecto = async (tesis: TesisItem) => {
    setDescargandoIds((prev) => ({ ...prev, [tesis.id]: true }));
    if (requiereVentanaFlotanteUnt(tesis)) {
      abrirVisorFlotanteUnicoUnt(tesis);
    } else {
      await tesisService.descargarPdfDirecto(tesis);
    }
    setTimeout(() => {
      setDescargandoIds((prev) => ({ ...prev, [tesis.id]: false }));
    }, 800);
  };

  const totalUntCargadas = conteoPorUni['UNT'] || 0;
  const totalNacionalesCargadas = unisNacionalesSeleccionadas.reduce(
    (acc, id) => acc + (conteoPorUni[id] || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* BUSCADOR MULTI-REPOSITORIO DE INGENIERÍA INDUSTRIAL */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        {/* Barra de Búsqueda en Vivo */}
        <form onSubmit={handleBuscarSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 focus-within:border-[#082F64] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#082F64]/10 transition-all">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                placeholder="Buscar tesis por tema, metodología (ej. lean, arándanos, logística, TPM, calidad, ISO)..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-hidden"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => {
                    setBusqueda('');
                    setResultadosEnVivo([]);
                    setUltimaConsultaEnVivo('');
                    setPaginaActual(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={tipoDocSeleccionado}
              onChange={(e) => {
                setTipoDocSeleccionado(e.target.value as 'TODOS' | 'Tesis' | 'Artículo Científico');
                setPaginaActual(1);
              }}
              className="py-2 px-3 rounded-lg border border-slate-200 sm:border-transparent bg-white sm:bg-transparent text-xs font-bold text-[#082F64] focus:outline-hidden cursor-pointer"
            >
              <option value="TODOS">Todo (Tesis + Papers)</option>
              <option value="Tesis">Solo Tesis</option>
              <option value="Artículo Científico">Artículos / Papers</option>
            </select>

            <select
              value={areaSeleccionada}
              onChange={(e) => {
                setAreaSeleccionada(e.target.value as AreaIngenieria | 'TODAS');
                setPaginaActual(1);
              }}
              className="py-2 px-3 rounded-lg border border-slate-200 sm:border-transparent bg-white sm:bg-transparent text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="TODAS">Todas las líneas ({conteoPorArea.total})</option>
              {AREAS_INGENIERIA.map((a) => (
                <option key={a} value={a}>
                  {a} ({conteoPorArea.mapa[a] || 0})
                </option>
              ))}
            </select>

            <select
              value={anioSeleccionado}
              onChange={(e) => {
                setAnioSeleccionado(Number(e.target.value));
                setPaginaActual(1);
              }}
              className="py-2 px-3 rounded-lg border border-slate-200 sm:border-transparent bg-white sm:bg-transparent text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value={0}>Todos los años</option>
              {aniosDisponibles.map((a) => (
                <option key={a} value={a}>
                  Año {a}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={buscandoEnVivo}
              className="px-5 py-2 rounded-lg bg-[#082F64] hover:bg-[#0C4D96] disabled:opacity-60 text-white text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
            >
              {buscandoEnVivo ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Buscar</span>
                </>
              )}
            </button>
          </div>

          {/* SELECTOR DE UNIVERSIDADES: UNT FIJA + REFERENCIAS NACIONALES (TOP RANKING PERÚ) */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Repositorios:
              </span>

              {/* 1. UNT FIJA (Siempre activa, no se puede desmarcar) */}
              <div
                id="badge-unt-fija"
                className="px-3 py-1.5 rounded-xl bg-[#082F64] text-white text-xs font-bold flex items-center gap-2 shadow-2xs ring-1 ring-[#082F64] select-none"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>UNT</span>
                <span className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono">
                  {totalUntCargadas}
                </span>
              </div>

              {/* 2. REFERENCIAS NACIONALES (Sin nombres de universidades en el botón) */}
              <button
                type="button"
                id="btn-referencias-nacionales"
                onClick={handleToggleReferencias}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                  referenciasActivas
                    ? 'bg-[#1765B5] text-white border-[#1765B5] shadow-2xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
                title="Activar o desactivar búsqueda en las mejores universidades del Perú según Ranking Nacional"
              >
                <Globe className={`w-3.5 h-3.5 ${referenciasActivas ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>Referencias Nacionales</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    referenciasActivas ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {referenciasActivas
                    ? `${unisNacionalesSeleccionadas.length}/${UNIS_NACIONALES_IDS.length} · +${totalNacionalesCargadas}`
                    : 'Desactivado'}
                </span>
              </button>

              {/* Botón para desplegar/ocultar selección de otras universidades */}
              <button
                type="button"
                id="btn-elegir-universidades"
                onClick={() => {
                  if (!referenciasActivas) setReferenciasActivas(true);
                  setPanelRankingAbierto((v) => !v);
                }}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Elegir otra universidad</span>
                {panelRankingAbierto ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => ejecutarBusquedaEnVivo(busqueda)}
                disabled={buscandoEnVivo}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#082F64] border border-blue-200 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${buscandoEnVivo ? 'animate-spin' : ''}`} />
                <span>{buscandoEnVivo ? 'Consultando...' : 'Sincronizar en vivo'}</span>
              </button>

              {(busqueda || areaSeleccionada !== 'TODAS' || anioSeleccionado !== 0 || asesorSeleccionado !== 'TODOS' || inputAsesor) && (
                <button
                  type="button"
                  onClick={handleLimpiarFiltros}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 font-semibold text-xs cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>
          </div>

          {/* PANEL DESPLEGABLE DE UNIVERSIDADES CON ACCESO PÚBLICO */}
          {panelRankingAbierto && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold text-slate-800">
                  Seleccionar universidades
                </h4>

                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setReferenciasActivas(true);
                      setUnisNacionalesSeleccionadas(UNIS_NACIONALES_IDS);
                      setPaginaActual(1);
                    }}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#082F64] text-[#082F64] font-semibold cursor-pointer"
                  >
                    Marcar todas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUnisNacionalesSeleccionadas([]);
                      setReferenciasActivas(false);
                      setPaginaActual(1);
                    }}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-rose-400 text-rose-600 font-semibold cursor-pointer"
                  >
                    Solo UNT
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {UNIVERSIDADES_RANKING_PERU.map((u) => {
                  const activa = u.fija || (referenciasActivas && unisNacionalesSeleccionadas.includes(u.id));
                  return (
                    <button
                      key={u.id}
                      type="button"
                      disabled={u.fija}
                      onClick={() => handleToggleUniversidadNacional(u.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                        u.fija
                          ? 'bg-[#082F64]/5 border-[#082F64]/40 cursor-default'
                          : activa
                          ? 'bg-white border-[#1765B5] shadow-2xs cursor-pointer'
                          : 'bg-white/60 border-slate-200 opacity-70 hover:opacity-100 cursor-pointer'
                      }`}
                    >
                      <div className="pt-0.5 shrink-0">
                        {u.fija ? (
                          <Lock className="w-4 h-4 text-[#082F64]" />
                        ) : activa ? (
                          <CheckSquare className="w-4 h-4 text-[#1765B5]" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-900 block">{u.sigla}</span>
                        <p className="text-[11px] text-slate-600 truncate mt-0.5">{u.nombre}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Herramienta de Valor para el Tesista: Verificar si su idea/título de tesis ya existe en la UNT */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setVerificadorAbierto((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#082F64] hover:text-[#1765B5] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>¿Tu tema de tesis ya existe en la UNT? Verificar originalidad de título</span>
                {verificadorAbierto ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {verificadorAbierto && (
              <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={ideaTituloTesis}
                    onChange={(e) => setIdeaTituloTesis(e.target.value)}
                    placeholder="Ej: Aplicación de Six Sigma para reducir mermas en una empresa de calzado en Trujillo..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-[#082F64] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    disabled={buscandoEnVivo || ideaTituloTesis.trim().length < 3}
                    onClick={() => ejecutarBusquedaEnVivo(ideaTituloTesis)}
                    className="px-3.5 py-2 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${buscandoEnVivo ? 'animate-spin' : ''}`} />
                    <span>Cotejar en vivo</span>
                  </button>
                </div>

                {analisisOriginalidadUnt && (
                  <div className="space-y-2.5 text-xs">
                    {/* Diagnóstico de los 3 Pilares del Título de Tesis */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className={`p-2 rounded-lg border text-[11px] ${analisisOriginalidadUnt.metodologiaDetectada ? 'bg-white border-emerald-200 text-slate-800' : 'bg-slate-100/70 border-slate-200 text-slate-500'}`}>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">1. Metodología / Var. Indep.</span>
                        <span className="font-bold">
                          {analisisOriginalidadUnt.metodologiaDetectada || 'Sin especificar aún'}
                        </span>
                      </div>
                      <div className={`p-2 rounded-lg border text-[11px] ${analisisOriginalidadUnt.variableDetectada ? 'bg-white border-emerald-200 text-slate-800' : 'bg-slate-100/70 border-slate-200 text-slate-500'}`}>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">2. Variable a Mejorar</span>
                        <span className="font-bold">
                          {analisisOriginalidadUnt.variableDetectada || 'Sin especificar aún'}
                        </span>
                      </div>
                      <div className={`p-2 rounded-lg border text-[11px] ${analisisOriginalidadUnt.sectorDetectado ? 'bg-white border-emerald-200 text-slate-800' : 'bg-slate-100/70 border-slate-200 text-slate-500'}`}>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">3. Sector / Empresa</span>
                        <span className="font-bold">
                          {analisisOriginalidadUnt.sectorDetectado || 'Sin especificar aún'}
                        </span>
                      </div>
                    </div>

                    {/* Veredicto Preciso (sin falsos 98% por escribir 2 palabras) */}
                    <div
                      className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 font-bold ${
                        analisisOriginalidadUnt.incompleto
                          ? 'bg-blue-50 border-blue-200 text-[#082F64]'
                          : analisisOriginalidadUnt.maxSimilitud >= 65
                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                        {analisisOriginalidadUnt.incompleto ? (
                          <Sparkles className="w-4 h-4 text-[#1765B5] shrink-0" />
                        ) : analisisOriginalidadUnt.maxSimilitud >= 65 ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <span>
                          {analisisOriginalidadUnt.incompleto
                            ? 'Título incompleto: especifica tu variable a mejorar y el sector/empresa para medir originalidad exacta.'
                            : analisisOriginalidadUnt.maxSimilitud >= 65
                              ? 'Atención: Existe una tesis en la UNT con enfoque muy similar. Diferencia tu empresa, sector o variable.'
                              : 'Tema viable en la UNT: Tu combinación de metodología, variable y sector es diferenciada.'}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/90 shrink-0">
                        {analisisOriginalidadUnt.incompleto
                          ? `${analisisOriginalidadUnt.totalCoincidenciasUnt} antecedentes UNT`
                          : `Similitud real UNT: ${analisisOriginalidadUnt.maxSimilitud}%`}
                      </span>
                    </div>

                    {analisisOriginalidadUnt.similares.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-600 block">
                          Antecedentes UNT más cercanos ({analisisOriginalidadUnt.similares.length} de {analisisOriginalidadUnt.totalCoincidenciasUnt}):
                        </span>
                        {analisisOriginalidadUnt.similares.map(({ tesis, porcentaje, razon }) => (
                          <div
                            key={tesis.id}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <button
                                type="button"
                                onClick={() => handleAbrirVisorIntegrado(tesis)}
                                className="text-left font-bold text-slate-800 hover:text-[#1765B5] truncate block w-full cursor-pointer"
                              >
                                {resaltarCoincidencias(tesis.titulo, ideaTituloTesis)}
                              </button>
                              <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                                <span>{tesis.autor} ({tesis.anio}) • Asesor: {tesis.asesor}</span>
                                <span className="text-[10px] text-[#1765B5] font-semibold">· {razon}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {porcentaje}%
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleGuardarAntecedente(tesis)}
                                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[#082F64] text-[10px] font-bold cursor-pointer"
                              >
                                {antecedentesIds.includes(tesis.id) ? 'Guardado' : '+ Antecedente'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Estado de consulta en vivo si se ejecutó búsqueda remota */}
        {fuentesEnVivo.length > 0 && (
          <div className="px-3 py-2 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-900">
            <div className="flex items-center gap-2 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                Búsqueda en vivo completada{ultimaConsultaEnVivo ? ` para "${ultimaConsultaEnVivo}"` : ''}:{' '}
                <strong>{tesisFiltradas.length.toLocaleString('es-PE')}</strong>{' '}
                {tesisFiltradas.length === 1 ? 'resultado visible' : 'resultados visibles'} en los repositorios activos.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {fuentesEnVivo.map((f) => (
                <span
                  key={f.id}
                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                    f.status === 'ok'
                      ? 'bg-white text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {f.id}: {f.encontrados > 0 ? `+${f.encontrados}` : 'base'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ESTRUCTURA A DOS COLUMNAS: HERRAMIENTAS DEL TESISTA (ASESOR + MIS ANTECEDENTES) + LISTADO DE TESIS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMNA IZQUIERDA: DOCENTE ASESOR Y CARPETA DE ANTECEDENTES DEL TESISTA (SIN DUPLICAR FILTROS) */}
        <aside className="lg:col-span-3 space-y-4">
          {/* 1. Buscador y Especialidad de Docente Asesor */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div ref={asesorBoxRef} className="space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#082F64]" />
                <span>Docente Asesor</span>
              </span>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={inputAsesor}
                  onChange={(e) => {
                    setInputAsesor(e.target.value);
                    setAsesorSeleccionado('TODOS');
                    setMostrarDropdownAsesor(true);
                    setPaginaActual(1);
                  }}
                  onFocus={() => {
                    if (inputAsesor.trim()) setMostrarDropdownAsesor(true);
                  }}
                  placeholder="Buscar docente asesor..."
                  className="w-full pl-8 pr-7 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#082F64] focus:outline-hidden"
                />
                {inputAsesor && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputAsesor('');
                      setAsesorSeleccionado('TODOS');
                      setMostrarDropdownAsesor(false);
                      setPaginaActual(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {mostrarDropdownAsesor && inputAsesor.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-40 max-h-52 overflow-y-auto divide-y divide-slate-100">
                    {coincidenciasAsesores.length > 0 ? (
                      coincidenciasAsesores.map((as) => (
                        <button
                          key={as.nombre}
                          type="button"
                          onClick={() => {
                            setAsesorSeleccionado(as.nombre);
                            setInputAsesor(as.nombre);
                            setMostrarDropdownAsesor(false);
                            setPaginaActual(1);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex flex-col gap-0.5 cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-bold text-slate-800">{as.nombre}</span>
                            <span className="text-[10px] font-mono text-[#082F64] font-bold shrink-0">
                              {as.total} tesis
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 truncate">
                            Línea principal: {as.especialidad}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2.5 text-[11px] text-slate-400">
                        Sin coincidencias para "{inputAsesor}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {asesorSeleccionado !== 'TODOS' && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-[#082F64]">
                  <span className="font-bold truncate pr-2">{asesorSeleccionado}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAsesorSeleccionado('TODOS');
                      setInputAsesor('');
                      setPaginaActual(1);
                    }}
                    className="text-[#082F64] hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. Mis Antecedentes Guardados (Para el Marco Teórico / Plan de Tesis del estudiante) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-[#082F64]" />
                <span>Mis Antecedentes ({antecedentesGuardados.length})</span>
              </span>
              {antecedentesGuardados.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopiarTodosAntecedentesApa}
                  className="text-[11px] font-bold text-[#1765B5] hover:underline flex items-center gap-1 cursor-pointer"
                  title="Copiar todas las referencias guardadas en formato APA 7"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar APA 7</span>
                </button>
              )}
            </div>

            {antecedentesGuardados.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-0.5">
                {antecedentesGuardados.map((ant) => (
                  <div
                    key={ant.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span className="font-bold text-[#082F64]">
                        {ant.universidadId || 'UNT'} • {ant.anio}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleGuardarAntecedente(ant)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Quitar de mis antecedentes"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAbrirVisorIntegrado(ant)}
                      className="text-left font-semibold text-slate-800 hover:text-[#1765B5] line-clamp-2 leading-snug cursor-pointer"
                    >
                      {ant.titulo}
                    </button>
                    <div className="text-[10px] text-slate-500 truncate">{ant.autor}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 leading-snug">
                Guarda aquí las tesis que usarás como antecedentes en tu Plan de Tesis para copiar todas sus citas APA 7 juntas.
              </p>
            )}
          </div>
        </aside>

        {/* COLUMNA DERECHA: LISTADO DE INVESTIGACIONES */}
        <section className="lg:col-span-9 space-y-3.5">
          {/* Barra Superior de Control */}
          <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
            <div className="font-bold text-slate-900">
              Mostrando {tesisFiltradas.length > 0 ? indiceInicio + 1 : 0} – {indiceFin} de{' '}
              {tesisFiltradas.length} tesis
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const todosExpandidos = tesisPaginadas.every((t) => resumenesExpandidos[t.id]);
                  toggleExpandirTodos(!todosExpandidos);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] cursor-pointer"
              >
                {tesisPaginadas.length > 0 && tesisPaginadas.every((t) => resumenesExpandidos[t.id])
                  ? 'Contraer resúmenes'
                  : 'Expandir resúmenes'}
              </button>

              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                <select
                  value={ordenamiento}
                  onChange={(e) => setOrdenamiento(e.target.value as 'similitud' | 'reciente' | 'titulo')}
                  className="bg-transparent text-slate-700 font-semibold text-[11px] focus:outline-hidden cursor-pointer"
                >
                  <option value="similitud">Mayor Relevancia</option>
                  <option value="reciente">Más Recientes</option>
                  <option value="titulo">Título (A – Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Listado de Cards de Tesis */}
          {cargandoInicial ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-36 rounded-2xl bg-white border border-slate-200 animate-pulse p-5" />
              ))}
            </div>
          ) : tesisPaginadas.length > 0 ? (
            <div className="space-y-3">
              {tesisPaginadas.map((tesis) => {
                const esUnt = tesis.universidadId === 'UNT' || tesis.universidad === 'Universidad Nacional de Trujillo';
                const expandido = Boolean(resumenesExpandidos[tesis.id]);

                return (
                  <article
                    key={tesis.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-[#1765B5]/50 p-4 sm:p-5 shadow-2xs hover:shadow-sm transition-all space-y-2.5"
                  >
                    {/* Metadatos Superiores */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold ${
                            esUnt
                              ? 'bg-[#082F64] text-white'
                              : 'bg-blue-50 text-[#0C4D96] border border-blue-200'
                          }`}
                        >
                          <Building2 className="w-3 h-3" />
                          <span>{esUnt ? 'UNT · Trujillo' : tesis.universidadId || tesis.universidad}</span>
                        </span>

                        {!esUnt && (
                          <span className="text-slate-500 font-medium hidden sm:inline truncate max-w-[260px]">
                            {tesis.universidad}
                          </span>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded-full font-bold ${
                            tesis.tipoDocumento === 'Artículo Científico'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {tesis.tipoDocumento === 'Artículo Científico' ? 'Artículo / Paper' : 'Tesis'}
                        </span>

                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                          {tesis.anio}
                        </span>

                        <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 font-semibold">
                          {tesis.area}
                        </span>
                      </div>

                      {busqueda.trim().length > 0 && (() => {
                        const ev = evaluarCoincidenciaBusqueda(tesis, busqueda);
                        return ev.motivo ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-bold">
                            {ev.motivo}
                          </span>
                        ) : null;
                      })()}
                    </div>

                    {/* Título Real Clicable con Resaltado de Coincidencias */}
                    <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug">
                      <button
                        type="button"
                        onClick={() => handleAbrirVisorIntegrado(tesis)}
                        className="text-left hover:text-[#1765B5] transition-colors cursor-pointer"
                      >
                        {busqueda.trim() ? resaltarCoincidencias(tesis.titulo, busqueda) : tesis.titulo}
                      </button>
                    </h3>

                    {/* Autor y Asesor */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{tesis.autor}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-[#1765B5] shrink-0" />
                        <span className="text-slate-500">Asesor:</span>
                        <span className="font-medium text-slate-700">{tesis.asesor}</span>
                      </div>
                    </div>

                    {/* Resumen Expandible */}
                    <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                      <p className={expandido ? 'whitespace-pre-line' : 'line-clamp-2'}>
                        {tesis.resumen}
                      </p>
                      {tesis.resumen.length > 160 && (
                        <button
                          type="button"
                          onClick={() => toggleExpandirResumen(tesis.id)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[#1765B5] hover:underline font-bold text-[11px] cursor-pointer"
                        >
                          {expandido ? (
                            <>
                              <span>Ocultar resumen</span>
                              <ChevronUp className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              <span>Leer resumen completo</span>
                              <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Palabras Clave + 3 Botones Integrados (Sin abrir ventanas externas) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-1">
                        {tesis.palabrasClave.slice(0, 4).map((kw) => (
                          <span
                            key={kw}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                          >
                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                            <span>{kw}</span>
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {/* Botón Guardar Antecedente */}
                        <button
                          type="button"
                          onClick={() => toggleGuardarAntecedente(tesis)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-colors ${
                            antecedentesIds.includes(tesis.id)
                              ? 'border-amber-300 bg-amber-50 text-amber-900'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                          title="Guardar en Mis Antecedentes para mi Plan de Tesis"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>{antecedentesIds.includes(tesis.id) ? 'Guardado' : 'Guardar'}</span>
                        </button>

                        {/* Botón 1: APA 7 */}
                        <button
                          type="button"
                          onClick={() => handleCopiarCita(tesis)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold cursor-pointer transition-colors"
                          title="Copiar cita bibliográfica en formato APA 7ma edición"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>APA 7</span>
                        </button>

                        {/* Botón 2: Ver Tesis Aquí (Abre visor dentro del sistema, sin abrir pestañas) */}
                        <button
                          type="button"
                          onClick={() => handleAbrirVisorIntegrado(tesis)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#082F64] text-[11px] font-bold transition-colors cursor-pointer"
                          title="Abrir y leer la tesis dentro del propio sistema sin abrir otra ventana"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Tesis Aquí</span>
                        </button>

                        {/* Botón 3: Descargar PDF (Descarga directa en 1 clic sin abrir pestañas) */}
                        <button
                          type="button"
                          disabled={Boolean(descargandoIds[tesis.id])}
                          onClick={() => handleDescargarPdfDirecto(tesis)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#082F64] hover:bg-[#0C4D96] disabled:opacity-60 text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                          title="Descargar el archivo PDF directamente a tu computadora sin abrir otras ventanas"
                        >
                          {descargandoIds[tesis.id] ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Descargando...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Descargar PDF</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}

              {/* Paginación Limpia */}
              {totalPaginas > 1 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    disabled={paginaSegura <= 1}
                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-700 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>

                  <span className="font-semibold text-slate-600">
                    Página <strong>{paginaSegura}</strong> de <strong>{totalPaginas}</strong>
                  </span>

                  <button
                    type="button"
                    disabled={paginaSegura >= totalPaginas}
                    onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-700 cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  No se encontraron coincidencias locales para "{busqueda || inputAsesor}"
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Puedes consultar en tiempo real los repositorios oficiales de la UNT y universidades nacionales o restablecer los filtros activos.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => ejecutarBusquedaEnVivo(busqueda || inputAsesor)}
                  className="px-4 py-2 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${buscandoEnVivo ? 'animate-spin' : ''}`} />
                  <span>Buscar en vivo en repositorios DSpace</span>
                </button>
                <button
                  type="button"
                  onClick={handleLimpiarFiltros}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Restablecer filtros
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* VISOR INTEGRADO DE TESIS Y LECTOR PDF DENTRO DEL SISTEMA (SIN ABRIR VENTANAS EXTERNAS) */}
      {tesisModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setTesisModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Visor Integrado */}
            <div className="px-4 py-3.5 sm:px-5 bg-[#082F64] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  <span className="px-2 py-0.5 rounded bg-white/15 text-white">
                    {tesisModal.universidadId || 'UNT'}
                  </span>
                  <span>{tesisModal.universidad}</span>
                  <span>•</span>
                  <span>Año {tesisModal.anio}</span>
                  <span>•</span>
                  <span className="text-amber-300">{tesisModal.area}</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold leading-snug text-white line-clamp-2">
                  {tesisModal.titulo}
                </h3>
              </div>

              {/* Selector de Modo de Lectura + Cerrar */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="inline-flex items-center bg-white/10 p-1 rounded-xl border border-white/15 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setModoVisorModal('dual')}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                      modoVisorModal === 'dual'
                        ? 'bg-white text-[#082F64]'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Vista Dual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoVisorModal('pdf')}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                      modoVisorModal === 'pdf'
                        ? 'bg-white text-[#082F64]'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Solo PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoVisorModal('ficha')}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                      modoVisorModal === 'ficha'
                        ? 'bg-white text-[#082F64]'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Resumen</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setTesisModal(null)}
                  className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/15 cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cuerpo Principal del Visor Integrado */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden">
              {/* Panel Izquierdo: Ficha Técnica, Resumen Completo y Cita APA 7 */}
              {(modoVisorModal === 'dual' || modoVisorModal === 'ficha') && (
                <div
                  className={`${
                    modoVisorModal === 'dual' ? 'lg:col-span-5' : 'lg:col-span-12'
                  } p-4 sm:p-5 overflow-y-auto space-y-4 text-xs bg-white`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Autor(es)</span>
                      <span className="font-bold text-slate-900">{tesisModal.autor}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Docente Asesor</span>
                      <span className="font-semibold text-slate-800">{tesisModal.asesor}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Enlace Oficial</span>
                      <span className="font-mono text-[#1765B5] break-all select-all">
                        {tesisModal.handleUri}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Resumen de la Investigación
                    </h4>
                    <div className="text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-3.5 rounded-xl border border-slate-200 text-xs sm:text-[13px]">
                      {tesisModal.resumen}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Palabras Clave
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {tesisModal.palabrasClave.map((kw) => (
                        <span
                          key={kw}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold"
                        >
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{kw}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                        Cita Bibliográfica (APA 7ma Edición)
                      </h4>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleCopiarCita(tesisModal);
                          setCopiadoModal(true);
                          setTimeout(() => setCopiadoModal(false), 2000);
                        }}
                        className="inline-flex items-center gap-1 text-[#1765B5] hover:underline font-bold cursor-pointer"
                      >
                        {copiadoModal ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiadoModal ? '¡Cita copiada!' : 'Copiar cita APA 7'}</span>
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 font-serif text-slate-800 text-xs leading-relaxed select-all">
                      {generarCitaApa(tesisModal)}
                    </div>
                  </div>
                </div>
              )}

              {/* Panel Derecho: Lector de Tesis */}
              {(modoVisorModal === 'dual' || modoVisorModal === 'pdf') && (
                <div
                  className={`${
                    modoVisorModal === 'dual' ? 'lg:col-span-7' : 'lg:col-span-12'
                  } bg-slate-900 flex flex-col min-h-[340px] h-full`}
                >
                  {requiereVentanaFlotanteUnt(tesisModal) ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                        <FileText className="w-7 h-7" />
                      </div>
                      <div className="max-w-md space-y-1.5">
                        <h4 className="text-sm sm:text-base font-bold text-white">
                          Visor PDF Directo — Tesis Oficial UNT
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          El archivo PDF completo de esta tesis se ha enviado directamente desde el servidor de archivos de la UNT sin abrir páginas intermedias del repositorio.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => abrirVisorFlotanteUnicoUnt(tesisModal)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1765B5] hover:bg-blue-600 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Abrir / Ver PDF Completo de la Tesis</span>
                        </button>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 break-all max-w-md">
                        {tesisModal.urlPdf || tesisModal.handleUri}
                      </span>
                    </div>
                  ) : (
                    <iframe
                      key={tesisModal.id}
                      src={tesisService.construirUrlPdfInterno(tesisModal, 'inline')}
                      title={`Visor PDF - ${tesisModal.titulo}`}
                      className="w-full flex-1 border-0 bg-slate-900"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Barra Inferior de Acciones Directas */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopiarCita(tesisModal)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copiar APA 7</span>
              </button>

              <button
                type="button"
                disabled={Boolean(descargandoIds[tesisModal.id])}
                onClick={() => handleDescargarPdfDirecto(tesisModal)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#082F64] hover:bg-[#0C4D96] disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setTesisModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
