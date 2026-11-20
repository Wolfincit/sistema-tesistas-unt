import { TesisItem, UniversidadId } from '../types';
import { MOCK_TESIS, UNIVERSIDADES_RANKING_PERU } from '../data/mockTesis';

export interface LiveSearchFuente {
  id: string;
  status: 'ok' | 'error' | 'timeout';
  encontrados: number;
  totalRepositorio: number;
}

export interface LiveSearchResponse {
  query: string;
  totalEnRepositorios: number;
  totalesPorUniversidad: Record<string, number>;
  fuentesConsultadas: LiveSearchFuente[];
  resultados: TesisItem[];
  origen: 'api-en-vivo' | 'catalogo-verificado';
}

/**
 * Normaliza cadenas para búsqueda insensible a tildes, diacríticos, signos de puntuación y mayúsculas.
 */
export function normalizarTexto(texto: string): string {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[,.;:()[\]"'“”?!/-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP_WORDS = new Set([
  'de', 'la', 'el', 'en', 'y', 'a', 'los', 'las', 'un', 'una', 'para',
  'por', 'con', 'del', 'al', 'se', 'su', 'que', 'es', 'tesis', 'estudio',
  'mediante', 'aplicacion', 'implementacion', 'propuesta', 'diseno', 'mejora',
  'mejorar', 'empresa', 'area', 'sistema', 'gestion', 'nivel', 'ano', 'trujillo'
]);

const SINONIMOS_INDUSTRIALES: Record<string, string[]> = {
  'six sigma': ['dmaic', 'lean six sigma', 'control estadistico', 'capacidad de proceso', 'nivel sigma'],
  'dmaic': ['six sigma', 'lean six sigma', 'control estadistico'],
  'lean': ['lean manufacturing', 'manufactura esbelta', '5s', 'vsm', 'kaizen', 'smed', 'kanban', 'poka yoke'],
  'lean manufacturing': ['manufactura esbelta', '5s', 'vsm', 'kaizen', 'smed', 'kanban', 'lean'],
  '5s': ['lean manufacturing', 'orden y limpieza', 'kaizen', 'estandares'],
  'tpm': ['mantenimiento productivo total', 'oee', 'mantenimiento autonomo', 'mantenimiento preventivo', 'disponibilidad'],
  'oee': ['tpm', 'mantenimiento productivo total', 'efectividad global'],
  'mantenimiento': ['tpm', 'mantenimiento preventivo', 'mantenimiento predictivo', 'confiabilidad', 'oee'],
  'sst': ['seguridad y salud ocupacional', 'iso 45001', 'iperc', 'ohsas', 'riesgos laborales', 'accidentes'],
  'iperc': ['seguridad y salud ocupacional', 'iso 45001', 'riesgos laborales', 'sst'],
  'ergonomia': ['reba', 'owas', 'rula', 'niosh', 'disergonomico', 'posturas'],
  'reba': ['ergonomia', 'disergonomico', 'owas', 'rula'],
  'calidad': ['iso 9001', 'sgc', 'phva', 'deming', 'servqual', 'haccp', 'bpm', 'six sigma', 'defectos'],
  'iso 9001': ['sistema de gestion de calidad', 'sgc', 'calidad', 'phva'],
  'logistica': ['cadena de suministro', 'supply chain', 'almacen', 'inventario', 'clasificacion abc', 'picking', 'mrp', 'abastecimiento'],
  'almacen': ['inventarios', 'clasificacion abc', 'logistica', 'picking', 'kardex', 'layout'],
  'inventario': ['almacen', 'clasificacion abc', 'eoq', 'mrp', 'rotacion', 'stock'],
  'cadena de suministro': ['supply chain', 'logistica', 'abastecimiento', 'distribucion'],
  'productividad': ['eficiencia', 'estudio de tiempos', 'balance de linea', 'rendimiento', 'lean manufacturing'],
  'costos': ['costos operativos', 'rentabilidad', 'mermas', 'desperdicios', 'evaluacion economica'],
  'proyectos': ['pmbok', 'factibilidad', 'viabilidad', 'van', 'tir', 'plan de negocio'],
  'pmbok': ['gestion de proyectos', 'cronograma', 'presupuesto', 'proyectos'],
  'simulacion': ['promodel', 'arena', 'flexsim', 'colas', 'cuellos de botella']
};

/**
 * Stemmer ligero en español para términos de Ingeniería Industrial
 * (ej: inventarios -> inventari, almacenes -> almacen, productivos -> productiv).
 */
export function stemEs(palabra: string): string {
  const w = normalizarTexto(palabra);
  if (w.length <= 4) return w;
  if (w.endsWith('ciones')) return w.slice(0, -6);
  if (w.endsWith('cion')) return w.slice(0, -4);
  if (w.endsWith('idades')) return w.slice(0, -6);
  if (w.endsWith('idad')) return w.slice(0, -4);
  if (w.endsWith('amientos')) return w.slice(0, -8);
  if (w.endsWith('amiento')) return w.slice(0, -7);
  if (w.endsWith('ivos') || w.endsWith('ivas')) return w.slice(0, -2);
  if (w.endsWith('es') && w.length > 5) return w.slice(0, -2);
  if (w.endsWith('s') && w.length > 4) return w.slice(0, -1);
  return w;
}

/**
 * Coincidencia precisa por límite de palabra (evita que "iso" coincida con "piso" o "aviso").
 */
function contienePalabra(textoNorm: string, terminoNorm: string): boolean {
  if (!textoNorm || !terminoNorm) return false;
  const padded = ` ${textoNorm} `;
  if (padded.includes(` ${terminoNorm} `)) return true;
  if (terminoNorm.length >= 4) {
    const raiz = stemEs(terminoNorm);
    if (raiz.length >= 4 && padded.includes(` ${raiz}`)) return true;
  }
  return false;
}

export interface EvaluacionCoincidencia {
  score: number;
  motivo: string;
  exacto: boolean;
}

export function evaluarCoincidenciaBusqueda(item: TesisItem, rawQuery: string): EvaluacionCoincidencia {
  const qNorm = normalizarTexto(rawQuery);
  if (!qNorm) return { score: 1, motivo: '', exacto: true };

  if (qNorm === 'tesis' || qNorm === 'ingenieria industrial' || qNorm === 'tesis ingenieria industrial') {
    return { score: 100, motivo: 'Catálogo Ingeniería Industrial', exacto: true };
  }

  const rawTokens = qNorm.split(/\s+/).filter(Boolean);
  const meaningfulTokens = rawTokens.filter((tk) => !STOP_WORDS.has(tk) && tk.length >= 2);
  const tokens = meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens;

  const tit = normalizarTexto(item.titulo);
  const res = normalizarTexto(item.resumen);
  const aut = normalizarTexto(item.autor);
  const ase = normalizarTexto(item.asesor);
  const uni = normalizarTexto(item.universidad);
  const area = normalizarTexto(item.area);
  const keys = item.palabrasClave.map(normalizarTexto);
  const keysJoined = keys.join(' ');

  let score = 0;
  let matchedTokens = 0;
  let hitTitulo = false;
  let hitAsesor = false;
  let hitAutor = false;
  let hitResumen = false;
  let hitSinonimo = false;

  // 1. Coincidencia exacta de frase completa (máxima prioridad)
  const fraseEnTitulo = contienePalabra(tit, qNorm);
  const fraseEnAsesor = ase.includes(qNorm) || (tokens.length >= 2 && tokens.every((t) => contienePalabra(ase, t)));
  const fraseEnAutor = aut.includes(qNorm) || (tokens.length >= 2 && tokens.every((t) => contienePalabra(aut, t)));
  const fraseEnResumen = contienePalabra(res, qNorm);
  const fraseEnKeys = contienePalabra(keysJoined, qNorm);

  if (fraseEnAsesor) {
    score += 130;
    hitAsesor = true;
  }
  if (fraseEnAutor) {
    score += 120;
    hitAutor = true;
  }
  if (fraseEnTitulo) {
    score += 110;
    hitTitulo = true;
  }
  if (fraseEnKeys) {
    score += 65;
    hitResumen = true;
  }
  if (fraseEnResumen) {
    score += 45;
    hitResumen = true;
  }

  // 2. Evaluación precisa token por token con límite de palabra y stemming español
  for (const tk of tokens) {
    let tokenHit = false;
    if (contienePalabra(tit, tk)) {
      score += 34;
      tokenHit = true;
      hitTitulo = true;
    }
    if (contienePalabra(keysJoined, tk)) {
      score += 24;
      tokenHit = true;
      hitResumen = true;
    }
    if (contienePalabra(ase, tk) || (tk.length >= 4 && ase.includes(tk))) {
      score += 22;
      tokenHit = true;
      hitAsesor = true;
    }
    if (contienePalabra(aut, tk) || (tk.length >= 4 && aut.includes(tk))) {
      score += 20;
      tokenHit = true;
      hitAutor = true;
    }
    if (contienePalabra(area, tk)) {
      score += 14;
      tokenHit = true;
    }
    if (contienePalabra(res, tk)) {
      score += 10;
      tokenHit = true;
      hitResumen = true;
    }
    if (contienePalabra(uni, tk)) {
      score += 6;
      tokenHit = true;
    }
    if (tokenHit) matchedTokens++;
  }

  // 3. Expansión técnica exhaustiva por sinónimos de Ingeniería Industrial
  const sinonimosAplicables = new Set<string>();
  if (SINONIMOS_INDUSTRIALES[qNorm]) {
    SINONIMOS_INDUSTRIALES[qNorm].forEach((s) => sinonimosAplicables.add(s));
  }
  tokens.forEach((tk) => {
    if (SINONIMOS_INDUSTRIALES[tk]) {
      SINONIMOS_INDUSTRIALES[tk].forEach((s) => sinonimosAplicables.add(s));
    }
  });

  if (sinonimosAplicables.size > 0) {
    let sinHits = 0;
    for (const sin of sinonimosAplicables) {
      if (contienePalabra(tit, sin)) {
        score += 18;
        sinHits++;
        hitSinonimo = true;
      } else if (contienePalabra(keysJoined, sin) || contienePalabra(res, sin)) {
        score += 9;
        sinHits++;
        hitSinonimo = true;
      }
      if (sinHits >= 2) break;
    }
  }

  // Regla de precisión estricta: si no hay frase exacta ni sinónimo técnico fuerte, exigir mayoría de tokens
  const minTokensRequeridos =
    tokens.length <= 1 ? 1 : tokens.length === 2 ? 2 : Math.ceil(tokens.length * 0.6);

  const fraseExacta = fraseEnTitulo || fraseEnAsesor || fraseEnAutor || fraseEnKeys || fraseEnResumen;

  if (!fraseExacta && matchedTokens < minTokensRequeridos && !hitSinonimo) {
    // Si el repositorio oficial devolvió esta tesis EN VIVO para esta misma búsqueda (coincidencia en texto completo o jurado),
    // nunca la descartamos para evitar mostrar "0 resultados" cuando la búsqueda en vivo sí encontró registros.
    if (item.enVivo && item.enVivoQuery && normalizarTexto(item.enVivoQuery) === qNorm) {
      return {
        score: 15,
        motivo: 'Hallado en texto / jurado del repositorio',
        exacto: false
      };
    }
    return { score: 0, motivo: '', exacto: false };
  }

  let motivo = 'Coincidencia en resumen';
  if (fraseEnTitulo) motivo = 'Frase exacta en título';
  else if (hitAsesor) motivo = 'Por Docente Asesor';
  else if (hitAutor) motivo = 'Por Autor';
  else if (hitTitulo && matchedTokens === tokens.length) motivo = 'Todos los términos en título';
  else if (hitTitulo) motivo = 'Coincidencia en título';
  else if (hitResumen) motivo = 'En resumen y palabras clave';
  else if (hitSinonimo) motivo = 'Metodología / término técnico equivalente';

  return { score, motivo, exacto: fraseExacta || matchedTokens === tokens.length };
}

export interface AnalisisOriginalidadResultado {
  incompleto: boolean;
  metodologiaDetectada: string | null;
  variableDetectada: string | null;
  sectorDetectado: string | null;
  maxSimilitud: number;
  similares: Array<{ tesis: TesisItem; porcentaje: number; razon: string }>;
  totalCoincidenciasUnt: number;
}

export function analizarOriginalidadTitulo(
  ideaTitulo: string,
  todasLasTesis: TesisItem[]
): AnalisisOriginalidadResultado | null {
  const limpio = normalizarTexto(ideaTitulo);
  if (limpio.length < 3) return null;

  const rawTokens = limpio.split(/\s+/).filter(Boolean);
  const tokens = rawTokens.filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
  if (tokens.length === 0) return null;

  // Detectar los 3 pilares de un título de tesis de Ingeniería Industrial
  const detect = (pairs: Array<[RegExp, string]>): string | null => {
    for (const [re, label] of pairs) {
      if (re.test(limpio)) return label;
    }
    return null;
  };

  const metodologiaDetectada = detect([
    [/lean six sigma|six sigma|dmaic/i, 'Six Sigma / DMAIC'],
    [/lean manufacturing|lean|manufactura esbelta|5s|smed|vsm|kaizen|kanban/i, 'Lean Manufacturing / 5S'],
    [/tpm|mantenimiento productivo|mantenimiento preventivo|mantenimiento/i, 'Mantenimiento / TPM'],
    [/iso 9001|calidad|haccp|bpm|servqual|phva/i, 'Gestión de la Calidad / ISO 9001'],
    [/iso 45001|seguridad|salud ocupacional|sst|iperc|ohsas/i, 'Seguridad y Salud Ocupacional'],
    [/reba|owas|rula|niosh|ergonom/i, 'Ergonomía (REBA/OWAS/NIOSH)'],
    [/almacen|inventari|logistica|cadena de suministro|abc|mrp|picking|abastecim/i, 'Logística / Almacenes / Inventarios'],
    [/pmbok|factibilidad|viabilidad|plan de negocio/i, 'Gestión de Proyectos / PMBOK'],
    [/simulacion|promodel|arena|flexsim/i, 'Simulación de Procesos'],
    [/estudio de tiempos|balance de linea|layout|disposicion de planta/i, 'Estudio de Métodos y Planta']
  ]);

  const variableDetectada = detect([
    [/productividad/i, 'Productividad'],
    [/costos|rentabilidad|ahorro|van|tir|merma/i, 'Costos / Rentabilidad'],
    [/calidad|defect|no conforme|satisfaccion|reclamo/i, 'Calidad / Satisfacción'],
    [/oee|disponibilidad|paradas|eficiencia|tiempo de ciclo|tiempos/i, 'Eficiencia / OEE / Tiempos'],
    [/accident|riesgo|disergonom|incidente/i, 'Seguridad / Reducción de Riesgos'],
    [/nivel de servicio|otif|rotura de stock|despacho|exactitud/i, 'Nivel de Servicio Logístico']
  ]);

  const sectorDetectado = detect([
    [/agroindustr|arandano|esparrago|palta|agricola|cerro prieto|camposol|azucar|cartavio|laredo/i, 'Agroindustria'],
    [/calzado|curtiembre|cuero|porvenir/i, 'Industria de Calzado'],
    [/metalmecan|soldadura|maquinaria/i, 'Metalmecánica'],
    [/pesquer|harina de pescado|conserva/i, 'Sector Pesquero'],
    [/alimento|panific|molino|avicola|lacteo|bebida|camal/i, 'Industria Alimentaria'],
    [/distribuid|comercial|retail|ferreter|supermercado|botica|farmacia/i, 'Comercio / Distribución'],
    [/minera|mineria|construct|construccion|saneamiento|energia|salud|telecomunic/i, 'Minería / Construcción / Servicios']
  ]);

  // Si el usuario escribió solo 1-3 palabras (ej. "six sigma"), el título está incompleto para evaluar plagio real
  const incompleto = tokens.length < 4 || (!variableDetectada && !sectorDetectado);

  const tesisUnt = todasLasTesis.filter((t) => (t.universidadId || 'UNT') === 'UNT');
  const setA = new Set(tokens.map(stemEs));

  // Bigramas de la idea del usuario
  const bigramsA = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i++) {
    bigramsA.add(`${stemEs(tokens[i])} ${stemEs(tokens[i + 1])}`);
  }

  const evaluadas = tesisUnt
    .map((t) => {
      const titNorm = normalizarTexto(t.titulo);
      const resNorm = normalizarTexto(t.resumen);
      const titTokens = titNorm.split(/\s+/).filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
      const setB = new Set(titTokens.map(stemEs));

      let interseccionTitulo = 0;
      for (const s of setA) {
        if (setB.has(s)) interseccionTitulo++;
      }

      // Similitud simétrica Dice: 2*|A∩B| / (|A| + |B|) — evita falsos 98% cuando |A| = 2 palabras!
      const diceTitulo =
        setA.size + setB.size > 0 ? (2 * interseccionTitulo) / (setA.size + setB.size) : 0;

      // Coincidencia de bigramas en el título
      let bigramHits = 0;
      if (bigramsA.size > 0) {
        const titStemmed = titTokens.map(stemEs).join(' ');
        for (const bg of bigramsA) {
          if (titStemmed.includes(bg)) bigramHits++;
        }
      }
      const bigramBonus = bigramsA.size > 0 ? (bigramHits / bigramsA.size) * 0.25 : 0;

      // Coincidencia en resumen (peso suave)
      let resHits = 0;
      for (const tk of tokens) {
        if (contienePalabra(resNorm, tk)) resHits++;
      }
      const resScore = (resHits / tokens.length) * 0.12;

      const fraseEnTitulo = contienePalabra(titNorm, limpio);
      let porcentaje = Math.round(Math.min(96, (diceTitulo * 0.78 + bigramBonus + resScore) * 100));

      // Si el usuario escribió menos de 4 palabras clave (ej. "six sigma"), topar la similitud al alcance real
      if (tokens.length <= 2 && porcentaje > 45) {
        porcentaje = Math.min(45, porcentaje);
      }

      if (interseccionTitulo === 0 && !fraseEnTitulo && resHits < tokens.length) {
        return { tesis: t, porcentaje: 0, razon: '' };
      }

      let razon = 'Términos relacionados en resumen';
      if (fraseEnTitulo && interseccionTitulo >= 3) {
        razon = 'Coincidencia directa de metodología y enfoque en título';
      } else if (fraseEnTitulo) {
        razon = `Misma metodología ("${ideaTitulo.trim()}") en título`;
      } else if (interseccionTitulo >= 2) {
        razon = `${interseccionTitulo} términos clave compartidos en título`;
      } else if (interseccionTitulo === 1) {
        razon = '1 término clave compartido en título';
      }

      return { tesis: t, porcentaje, razon };
    })
    .filter((x) => x.porcentaje >= 14)
    .sort((a, b) => b.porcentaje - a.porcentaje || b.tesis.anio - a.tesis.anio);

  return {
    incompleto,
    metodologiaDetectada,
    variableDetectada,
    sectorDetectado,
    maxSimilitud: evaluadas[0]?.porcentaje || 0,
    similares: evaluadas.slice(0, 5),
    totalCoincidenciasUnt: evaluadas.length
  };
}

function inferirUniversidadId(t: TesisItem): UniversidadId {
  if (t.universidadId) return t.universidadId;
  const u = normalizarTexto(t.universidad);
  if (u.includes('trujillo')) return 'UNT';
  if (u.includes('catolica')) return 'PUCP';
  if (u.includes('san marcos')) return 'UNMSM';
  if (u.includes('ingenieria')) return 'UNI';
  if (u.includes('lima')) return 'ULIMA';
  if (u.includes('ciencias aplicadas')) return 'UPC';
  if (u.includes('san agustin')) return 'UNSA';
  if (u.includes('san ignacio')) return 'USIL';
  if (u.includes('privada del norte')) return 'UPN';
  return 'UNT';
}

export const tesisService = {
  getUniversidades() {
    return UNIVERSIDADES_RANKING_PERU;
  },

  /**
   * Devuelve el catálogo verificado de tesis reales de Ingeniería Industrial (UNT + Top 8 Perú).
   */
  async getAll(): Promise<TesisItem[]> {
    return MOCK_TESIS.map((t) => ({
      ...t,
      universidadId: inferirUniversidadId(t)
    }));
  },

  /**
   * Consulta en tiempo real los repositorios oficiales DSpace 7 de las universidades seleccionadas
   * (con UNT siempre fija) + OpenAIRE (UNITRU-Tesis) con filtro estricto de Ingeniería Industrial.
   */
  async buscarEnVivo(params: {
    query: string;
    universidades: UniversidadId[];
    limitePorUni?: number;
  }): Promise<LiveSearchResponse> {
    const unisSet = new Set<UniversidadId>(['UNT', ...params.universidades]);
    const unisList = Array.from(unisSet);
    const limite = params.limitePorUni || 10;

    try {
      const searchParams = new URLSearchParams({
        q: params.query.trim(),
        universidades: unisList.join(','),
        limit: String(limite)
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 11000);
      const res = await fetch(`/api/repositorio/buscar?${searchParams.toString()}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        return {
          query: params.query,
          totalEnRepositorios: json.totalEnRepositorios || 0,
          totalesPorUniversidad: json.totalesPorUniversidad || {},
          fuentesConsultadas: json.fuentesConsultadas || [],
          resultados: (json.resultados || []).map((item: TesisItem) => ({
            ...item,
            universidadId: inferirUniversidadId(item)
          })),
          origen: 'api-en-vivo'
        };
      }
    } catch {
      // Fallback limpio al catálogo verificado local si se hospeda en servidor estático sin Node
    }

    const base = await this.getAll();
    const filtradas = this.filtrarLocal(base, {
      query: params.query,
      universidades: unisList
    });

    const totalesPorUniversidad: Record<string, number> = {};
    for (const u of unisList) {
      totalesPorUniversidad[u] = filtradas.filter((t) => inferirUniversidadId(t) === u).length;
    }

    return {
      query: params.query,
      totalEnRepositorios: filtradas.length,
      totalesPorUniversidad,
      fuentesConsultadas: unisList.map((id) => ({
        id,
        status: 'ok',
        encontrados: totalesPorUniversidad[id] || 0,
        totalRepositorio: totalesPorUniversidad[id] || 0
      })),
      resultados: filtradas,
      origen: 'catalogo-verificado'
    };
  },

  /**
   * Fusiona resultados en vivo con la base verificada evitando duplicados por título o handle.
   */
  fusionarResultados(enVivo: TesisItem[], baseLocal: TesisItem[]): TesisItem[] {
    const mapa = new Map<string, TesisItem>();

    const clave = (t: TesisItem) => {
      const h = (t.handleUri || '').toLowerCase().trim();
      if (h && !h.endsWith('/')) return `h::${h}`;
      return `t::${normalizarTexto(t.titulo).slice(0, 75)}`;
    };

    for (const item of enVivo) {
      const k = clave(item);
      if (!mapa.has(k)) mapa.set(k, { ...item, universidadId: inferirUniversidadId(item) });
    }
    for (const item of baseLocal) {
      const k = clave(item);
      if (!mapa.has(k)) mapa.set(k, { ...item, universidadId: inferirUniversidadId(item) });
    }

    return Array.from(mapa.values());
  },

  /**
   * Búsqueda local inteligente insensible a tildes y con ponderación por relevancia.
   */
  filtrarLocal(
    lista: TesisItem[],
    params: {
      query?: string;
      universidades?: UniversidadId[];
      area?: string;
      anio?: number;
      asesor?: string;
      tipoDocumento?: string;
    }
  ): TesisItem[] {
    let resultado = lista;

    if (params.universidades && params.universidades.length > 0) {
      const setUnis = new Set(params.universidades);
      resultado = resultado.filter((t) => setUnis.has(inferirUniversidadId(t)));
    }

    if (params.tipoDocumento && params.tipoDocumento !== 'TODOS') {
      resultado = resultado.filter((t) => (t.tipoDocumento || 'Tesis') === params.tipoDocumento);
    }

    if (params.area && params.area !== 'TODAS') {
      resultado = resultado.filter((t) => t.area === params.area);
    }

    if (params.anio && params.anio !== 0) {
      resultado = resultado.filter((t) => t.anio === params.anio);
    }

    if (params.asesor && params.asesor !== 'TODOS' && params.asesor.trim() !== '') {
      const qAsTokens = normalizarTexto(params.asesor).split(/\s+/).filter(Boolean);
      if (qAsTokens.length > 0) {
        resultado = resultado.filter((t) => {
          const aseNorm = normalizarTexto(t.asesor);
          return qAsTokens.every((tk) => aseNorm.includes(tk));
        });
      }
    }

    if (params.query && params.query.trim() !== '') {
      const qNorm = normalizarTexto(params.query);
      if (qNorm === 'tesis' || qNorm === 'ingenieria industrial' || qNorm === 'tesis ingenieria industrial') {
        return [...resultado].sort((a, b) => b.anio - a.anio);
      }

      const scored = resultado
        .map((item) => {
          const ev = evaluarCoincidenciaBusqueda(item, params.query || '');
          return { item, score: ev.score, exacto: ev.exacto };
        })
        .filter((entry) => entry.score > 0);

      scored.sort(
        (a, b) =>
          (b.exacto ? 1 : 0) - (a.exacto ? 1 : 0) ||
          b.score - a.score ||
          b.item.anio - a.item.anio
      );
      return scored.map((s) => s.item);
    }

    return resultado;
  },

  async getById(id: string): Promise<TesisItem | undefined> {
    const list = await this.getAll();
    return list.find((t) => t.id === id);
  },

  /**
   * Indica si la tesis cuenta con enlace directo de transmisión PDF verificada.
   */
  tienePdfDirecto(tesis: TesisItem): boolean {
    return Boolean(tesis.urlPdf && tesis.urlPdf.length > 5);
  },

  /**
   * Construye el endpoint interno (/api/repositorio/pdf) del mismo origen para visualizar
   * o descargar el PDF real dentro del sistema sin bloqueos X-Frame-Options ni pestañas externas.
   */
  construirUrlPdfInterno(tesis: TesisItem, mode: 'inline' | 'download' = 'inline'): string {
    const uni = inferirUniversidadId(tesis);
    let directBitstreamUrl = '';
    let uuid = '';

    if (tesis.urlPdf && tesis.urlPdf.startsWith('http')) {
      directBitstreamUrl = tesis.urlPdf;
    } else if (tesis.urlPdf && tesis.urlPdf.startsWith('/api/repositorio/pdf')) {
      try {
        const parsed = new URL(tesis.urlPdf, window.location.origin);
        uuid = parsed.searchParams.get('uuid') || '';
        directBitstreamUrl = parsed.searchParams.get('url') || '';
      } catch {
        uuid = '';
      }
    }

    const params = new URLSearchParams({
      mode,
      uni,
      uuid,
      url: directBitstreamUrl,
      titulo: tesis.titulo.slice(0, 260),
      autor: tesis.autor,
      asesor: tesis.asesor || 'Docente Asesor UNT',
      area: tesis.area || 'Ingeniería Industrial',
      anio: String(tesis.anio),
      resumen: (tesis.resumen || '').slice(0, 900),
      handle: tesis.handleUri || tesis.urlRepositorio
    });

    return `/api/repositorio/pdf?${params.toString()}`;
  },

  /**
   * Nombre de archivo limpio para la descarga directa.
   */
  obtenerNombreArchivoPdf(tesis: TesisItem): string {
    const uni = inferirUniversidadId(tesis);
    const slugAutor =
      normalizarTexto(tesis.autor)
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 28) || 'tesista';
    return `Tesis_${uni}_${tesis.anio}_${slugAutor}.pdf`;
  },

  /**
   * Descarga el archivo PDF directamente en el navegador mediante Content-Disposition: attachment
   * sin abrir ninguna pestaña nueva.
   */
  async descargarPdfDirecto(tesis: TesisItem): Promise<void> {
    const urlDescarga = this.construirUrlPdfInterno(tesis, 'download');
    const link = document.createElement('a');
    link.href = urlDescarga;
    link.download = this.obtenerNombreArchivoPdf(tesis);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
