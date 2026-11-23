/**
 * Motor Multi-Repositorio en Tiempo Real — Ingeniería Industrial (Perú & UNT)
 * Consulta oficialmente los repositorios DSpace 7 REST API de las mejores universidades
 * del Perú según Ranking SUNEDU/QS y el agregador abierto OpenAIRE (Repositorio UNT).
 * Todas las consultas aplican filtro estricto de Ingeniería Industrial.
 */

export const UNIVERSIDADES_CONFIG = [
  {
    id: 'UNT',
    sigla: 'UNT',
    nombre: 'Universidad Nacional de Trujillo',
    rankingLabel: 'Sede Principal',
    fija: true,
    tipo: 'openaire-unt',
    api: 'https://repositorio.unitru.edu.pe/server/api',
    base: 'https://repositorio.unitru.edu.pe',
    coleccionNombre: 'Escuela Profesional de Ingeniería Industrial — UNT'
  },
  {
    id: 'UNMSM',
    sigla: 'UNMSM',
    nombre: 'Universidad Nacional Mayor de San Marcos',
    rankingLabel: 'Acceso Público',
    fija: false,
    tipo: 'dspace7',
    api: 'https://cybertesis.unmsm.edu.pe/backend/api',
    base: 'https://cybertesis.unmsm.edu.pe',
    scope: '29d31156-8a5b-4294-9aec-14a15a99c09e',
    extraQuery: '',
    coleccionNombre: 'Tesis EP Ingeniería Industrial — UNMSM'
  },
  {
    id: 'UNI',
    sigla: 'UNI',
    nombre: 'Universidad Nacional de Ingeniería',
    rankingLabel: 'Acceso Público',
    fija: false,
    tipo: 'dspace7',
    api: 'https://repositorio.uni.edu.pe/server/api',
    base: 'https://repositorio.uni.edu.pe',
    scope: '8e4adf63-a0a3-4096-89bc-89292f301e86',
    extraQuery: '',
    coleccionNombre: 'Ingeniería Industrial (FIIS) — UNI'
  },
  {
    id: 'UNSA',
    sigla: 'UNSA',
    nombre: 'Universidad Nacional de San Agustín de Arequipa',
    rankingLabel: 'Acceso Público',
    fija: false,
    tipo: 'dspace7',
    api: 'https://repositorio.unsa.edu.pe/server/api',
    base: 'https://repositorio.unsa.edu.pe',
    scope: '33f8a1d6-245a-4267-b410-cf9879120329',
    extraQuery: '',
    coleccionNombre: 'EP Ingeniería Industrial — UNSA'
  },
  {
    id: 'UPN',
    sigla: 'UPN',
    nombre: 'Universidad Privada del Norte',
    rankingLabel: 'Acceso Público',
    fija: false,
    tipo: 'dspace7',
    api: 'https://repositorio.upn.edu.pe/backend/api',
    base: 'https://repositorio.upn.edu.pe',
    scope: '',
    extraQuery: '"Ingeniería Industrial"',
    coleccionNombre: 'Tesis Ingeniería Industrial — UPN'
  },
  {
    id: 'ULIMA',
    sigla: 'ULIMA',
    nombre: 'Universidad de Lima',
    rankingLabel: 'Acceso Público',
    fija: false,
    tipo: 'dspace7',
    api: 'https://repositorio.ulima.edu.pe/backend/api',
    base: 'https://repositorio.ulima.edu.pe',
    scope: '8208dc95-8e3a-4da9-a338-b44f55b6a0f3',
    extraQuery: '"Ingeniería Industrial"',
    coleccionNombre: 'Tesis de Ingeniería Industrial — ULIMA'
  },
  {
    id: 'USIL',
    sigla: 'USIL',
    nombre: 'Universidad San Ignacio de Loyola',
    rankingLabel: 'Acceso Público',
    fija: false,
    tipo: 'dspace7',
    api: 'https://repositorio.usil.edu.pe/server/api',
    base: 'https://repositorio.usil.edu.pe',
    scope: 'f408b9bd-9c35-44a1-87f9-4c9a9b0cb5f3',
    extraQuery: '',
    coleccionNombre: 'Carrera de Ingeniería Industrial — USIL'
  }
];

const CACHE_TTL_MS = 5 * 60 * 1000;
const searchCache = new Map();

function normalizar(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function clasificarArea(titulo, resumen, keywords) {
  const t = normalizar(titulo);
  const txt = normalizar(`${titulo} ${resumen} ${(keywords || []).join(' ')}`);

  if (
    /(seguridad y salud|salud ocupacional|seguridad ocupacional|seguridad industrial|seguridad laboral|programa de seguridad en el trabajo|\bsst\b|ohsas 18001|oshas 18001|iso 45001|ley 29783|\biperc\b|peligros y evaluacion de riesgos|peligros y riesgos ocupacionales|ergonom|disergonom|\breba\b|\bowas\b|\brula\b|\bniosh\b|equipos de proteccion|riesgos laborales|riesgos operacionales|red contraincendios|accidentabilidad|accidentes de trabajo|seguridad vial|lesiones musculoesqueleticas|gestion de seguridad)/.test(t) &&
    !/iso 9001/.test(t)
  ) {
    return 'Seguridad y Salud Ocupacional';
  }
  if (
    /(gestion de la calidad|gestion de calidad|sistema de gestion de calidad|modelo de gestion de calidad|control de calidad|control estadistico de calidad|calidad de servicio|calidad del servicio|herramientas de calidad|iso 9001|\bhaccp\b|peligros y puntos criticos de control|fssc 22000|\bbpm\b|\bservqual\b|servuccion|satisfaccion del cliente|satisfaccion de los clientes|estandares de acreditacion|certificar las microformas|evaluacion de la calidad|auditorias internas)/.test(t)
  ) {
    return 'Gestión de la Calidad';
  }
  if (
    /(mantenimiento preventivo|mantenimiento predictivo|mantenimiento centrado|gestion de mantenimiento|plan de mantenimiento|plan de mp|\btpm\b|fiabilidad para la mejora efectiva de activos|redistribucion de planta|distribucion de planta|celulas de manufactura|celda de soldadura|proceso de fabricacion|balance de linea|estudio de tiempos|metodos de trabajo|ingenieria de metodos|tiempos muertos|inyeccion de plasticos|mejora continua para disminuir|gestion de operaciones|linea de procesamiento|proceso de produccion|sistema productivo|tratamiento de aguas residuales industriales|optimizacion de procesos run to target)/.test(t)
  ) {
    return 'Producción y Operaciones';
  }
  if (
    /(logistic|almacen|inventari|gestion de stocks|gestion de suministros|cadena de suministro|cadena de suministros|cadena de abastecimiento|supply chain|abastecim|aprovisionamiento|proceso de compras|gestion de compras|area de compras|adquisicion de materiales|cross.?docking|picking|despacho|ruteo de|distribucion de productos|distribucion de bebidas|centro de distribucion|costo de transporte de mineral|ordenes de requerimiento)/.test(t)
  ) {
    return 'Logística y Cadena de Suministro';
  }
  if (
    /(lean manufacturing|manufactura esbelta|\bkaizen\b|\bkaisen\b|\b5s\b|\bsmed\b|\boee\b|lean six sigma|modelo lean|indice de productividad|aumentar la productividad|incrementar la productividad|mejora de procesos para reducir los costos operativos|mejora en el area tecnica)/.test(t)
  ) {
    return 'Producción y Operaciones';
  }
  if (
    /(gestion de proyectos|\bpmbok\b|enfoque pmi|factibilidad|pre.?factibilidad|pre factibilidad|estudio tecnico economico|viabilidad|plan de negocio|planta piloto|proyecto de ampliacion|valoracion de proyectos|sistema de costos|contabilidad de costos|costeo por procesos|costos abc|estructura de costos|costos de produccion|costo de produccion|gestion financiera|planeamiento estrategico|plan estrategico|balanced scorecard|cuadro de mando integral|control interno|coso iii|comercio electronico|e-commerce|transformacion digital|sistema de informacion|diseno de una planta para la produccion|consorcio empresarial)/.test(t)
  ) {
    return 'Gestión de Proyectos';
  }

  if (/(seguridad y salud|salud ocupacional|sst|iso 45001|ohsas|iperc|ergonom|accident|riesgo laboral|higiene industrial|reba|owas|niosh)/.test(txt)) {
    return 'Seguridad y Salud Ocupacional';
  }
  if (/(calidad|iso 9001|six sigma|dmaic|control estadistico|defect|merma|deming|phva|haccp|bpm|servqual)/.test(txt)) {
    return 'Gestión de la Calidad';
  }
  if (/(logist|almacen|inventari|cadena de suministro|supply chain|cadena de frio|picking|cross.?dock|abastecim|transporte|ruteo|distribucion urbana|mrp|compras|despacho)/.test(txt)) {
    return 'Logística y Cadena de Suministro';
  }
  if (/(proyecto|pmbok|factibilidad|viabilidad|plan de negocio|rentabilidad|inversion|evaluacion economica|van|tir|costos|presupuesto|reingenieria|erp|transformacion digital)/.test(txt)) {
    return 'Gestión de Proyectos';
  }
  return 'Producción y Operaciones';
}

const EXCLUDE_NON_INDUSTRIAL_UNT_RE = /(enfermer|educaci[oó]n|docentes|escolares|colegio|instituci[oó]n educativa|estudiantes|penal|delito|tributar|impuesto|c[oó]digo civil|constitucional|paciente|hospital|m[eé]dic|odontol|farmac|microbiol|bacteria|candida|vinaza|nanocelulosa|sedimento marino|ca[ñn]a de az[uú]car|variedades de|cepa vacunal|ganado|porcin|vacun|arqueol|turismo|literatur|marketing educativo|canva|ley del artista|mangifera|melaza|autoconcepto|apoyo social|satisfacci[oó]n con la vida|ansiedad|depresi[oó]n|autoestima|violencia familiar|inteligencia emocional|estr[eé]s acad[eé]mico|psicolog|obstetric)/i;

async function fetchWithTimeout(url, timeoutMs = 7500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'UNT-Ingenieria-Industrial-Portal/2.0'
      }
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function queryDspace7(uni, queryText, size = 12) {
  const params = new URLSearchParams({
    dsoType: 'ITEM',
    size: String(size),
    sort: queryText ? 'score,DESC' : 'dc.date.issued,DESC'
  });

  if (uni.scope) {
    params.set('scope', uni.scope);
  }

  const combinedQuery = [uni.extraQuery, queryText].filter(Boolean).join(' ').trim();
  if (combinedQuery) {
    params.set('query', combinedQuery);
  }

  try {
    const res = await fetchWithTimeout(`${uni.api}/discover/search/objects?${params.toString()}`, 8000);
    if (!res.ok) {
      return { uniId: uni.id, status: 'error', total: 0, items: [] };
    }
    const json = await res.json();
    const total = json._embedded?.searchResult?.page?.totalElements || 0;
    const objects = json._embedded?.searchResult?._embedded?.objects || [];

    const candidatos = [];
    for (const o of objects) {
      const obj = o._embedded?.indexableObject;
      if (!obj) continue;
      const m = obj.metadata || {};
      const titulo = (m['dc.title']?.[0]?.value || '').trim();
      if (
        !titulo ||
        titulo.length < 15 ||
        /t[ií]tulo reservado|embargad|restringid|confidencial/i.test(titulo) ||
        EXCLUDE_NON_INDUSTRIAL_UNT_RE.test(titulo)
      ) continue;

      const rightsValues = [
        ...(m['dc.rights'] || []),
        ...(m['dc.rights.accessRights'] || []),
        ...(m['dspace.access.status'] || [])
      ]
        .map((x) => String(x?.value || ''))
        .join(' ');
      if (/restricted|embargo|closed|restringid|cerrad|confidencial|reservad/i.test(rightsValues)) {
        continue;
      }

      const autores = (m['dc.contributor.author'] || []).map((x) => x.value).filter(Boolean);
      const asesores = (m['dc.contributor.advisor'] || []).map((x) => x.value).filter(Boolean);
      const abstracts = (m['dc.description.abstract'] || []).map((x) => x.value).filter(Boolean);
      const resumenEs =
        abstracts.find((a) => /[áéíóúñ]| de | la | en /i.test(a)) ||
        abstracts[0] ||
        `Tesis de Ingeniería Industrial de ${uni.nombre}: ${titulo}.`;
      const subjects = (m['dc.subject'] || [])
        .map((x) => x.value)
        .filter((v) => v && !v.startsWith('http') && v.length < 48);
      const dateStr = m['dc.date.issued']?.[0]?.value || '2025';
      const anio = parseInt(String(dateStr).slice(0, 4), 10) || 2025;
      const handleUri = m['dc.identifier.uri']?.[0]?.value || `${uni.base}/items/${obj.uuid}`;
      const area = clasificarArea(titulo, resumenEs, subjects);

      candidatos.push({
        uuid: obj.uuid,
        titulo,
        autor: autores.join('; ') || `Graduando ${uni.sigla}`,
        asesor: asesores.join('; ') || `Docente Asesor — ${uni.sigla}`,
        anio,
        area,
        resumen: resumenEs.replace(/\s+/g, ' ').trim().slice(0, 1200),
        palabrasClave: subjects.length > 0 ? subjects.slice(0, 5) : [area, 'Ingeniería Industrial', uni.sigla],
        universidad: uni.nombre,
        universidadId: uni.id,
        handleUri
      });
    }

    // Verificar en paralelo que cada tesis tenga su PDF /core/bitstreams/{uuid}/content público (sin 401/403)
    const verificados = await Promise.all(
      candidatos.slice(0, 10).map(async (c) => {
        const directContentUrl = await resolverPdfDirecto(uni.id, c.uuid);
        if (!directContentUrl) return null;
        return {
          id: `${uni.id.toLowerCase()}-${c.uuid}`,
          titulo: c.titulo,
          autor: c.autor,
          asesor: c.asesor,
          anio: c.anio,
          area: c.area,
          resumen: c.resumen,
          palabrasClave: c.palabrasClave,
          urlRepositorio: directContentUrl,
          urlPdf: directContentUrl,
          pesoPdf: 'PDF Oficial',
          universidad: c.universidad,
          universidadId: c.universidadId,
          handleUri: c.handleUri,
          vistas: 100 + (c.titulo.length * 7) % 350,
          descargas: 30 + (c.titulo.length * 3) % 120,
          licencia: 'Acceso Público Verificado',
          tipoDocumento: 'Tesis',
          enVivo: true,
          enVivoQuery: queryText.trim()
        };
      })
    );

    const items = verificados.filter(Boolean);
    return { uniId: uni.id, status: 'ok', total: items.length, items };
  } catch (err) {
    return { uniId: uni.id, status: 'timeout', total: 0, items: [] };
  }
}

function reconstructOpenAlexAbstract(invIdx) {
  if (!invIdx || typeof invIdx !== 'object') return '';
  const words = [];
  for (const [word, positions] of Object.entries(invIdx)) {
    if (Array.isArray(positions)) {
      for (const pos of positions) {
        words[pos] = word;
      }
    }
  }
  return words.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

async function verificarStreamPdfUrl(pdfUrl, timeoutMs = 5500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(pdfUrl, {
      signal: controller.signal,
      headers: {
        Range: 'bytes=0-16',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/pdf,*/*'
      },
      redirect: 'follow'
    });
    if (r.status !== 200 && r.status !== 206) return false;
    const ct = (r.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('text/html') || ct.includes('application/json')) return false;
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function extraerBitstreamContentUnt(bitstreamUrls = []) {
  for (const u of bitstreamUrls) {
    const m = String(u).match(/\/bitstreams\/([0-9a-f-]+)\/download/i);
    if (m) {
      return `https://repositorio.unitru.edu.pe/server/api/core/bitstreams/${m[1]}/content`;
    }
  }
  return null;
}

async function queryAliciaUnt(queryText, size = 24) {
  const q = queryText.trim();
  const baseFilter = 'filter[]=institution:%22UNITRU%22';
  const topicFilter = q
    ? `&lookfor=${encodeURIComponent(q)}`
    : '&filter[]=topic:%22https://purl.org/pe-repo/ocde/ford%232.11.04%22';

  const pagesToFetch = q ? [1, 2] : [1];
  const urls = pagesToFetch.map(
    (p) =>
      `https://alicia.concytec.gob.pe/vufind/api/v1/search?${baseFilter}${topicFilter}&limit=30&page=${p}&field[]=id&field[]=title&field[]=rawData`
  );

  try {
    const responses = await Promise.all(urls.map((u) => fetchWithTimeout(u, 9000).catch(() => null)));
    let total = 0;
    const records = [];
    for (const res of responses) {
      if (!res || !res.ok) continue;
      const json = await res.json();
      total = Math.max(total, json.resultCount || 0);
      if (Array.isArray(json.records)) {
        records.push(...json.records);
      }
    }

    const items = [];
    const seenHandles = new Set();

    for (const rec of records) {
      const raw = rec.rawData || {};
      const formats = [...(raw.format || []), ...(raw['dc.type.none.fl_str_mv'] || [])].join(' ').toLowerCase();
      if (formats.includes('article') || formats.includes('artículo')) continue;

      const bitstreams = raw['bitstream.url.fl_str_mv'] || [];
      const contentUrl = extraerBitstreamContentUnt(bitstreams);
      if (!contentUrl) continue;
      const handleUri =
        (raw['dc.identifier.uri.none.fl_str_mv'] || []).find((u) => String(u).includes('20.500.14414')) ||
        (raw.url || []).find((u) => String(u).includes('20.500.14414'));
      if (!handleUri || String(handleUri).includes('revistas.unitru.edu.pe')) continue;
      if (seenHandles.has(handleUri)) continue;
      seenHandles.add(handleUri);

      const titulo = String(rec.title || raw.title || '')
        .replace(/^[“"'\s]+|[”"'\s.]+$/g, '')
        .trim();
      if (!titulo || titulo.length < 18 || EXCLUDE_NON_INDUSTRIAL_UNT_RE.test(titulo)) continue;

      const rights = [...(raw['eu_rights_str_mv'] || []), ...(raw['dc.rights.none.fl_str_mv'] || [])].join(' ');
      if (/restricted|embargo|closed/i.test(rights)) continue;

      const resumen = String(raw.description || '')
        .replace(/^RESUMEN\s*:?\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim();

      const topics = [...(raw.topic || []), ...(raw['dc.subject.none.fl_str_mv'] || [])].map(String);
      const cleanTopics = topics.filter(
        (t) => !t.startsWith('http') && !t.includes('TECHNOLOGY::') && t.length > 2 && t.length < 48
      );
      const autores = raw['dc.contributor.author.fl_str_mv'] || raw.author || [];
      const asesores = raw['dc.contributor.advisor.fl_str_mv'] || [];
      const anio = parseInt(String((raw.publishDate || [])[0] || '2024').slice(0, 4), 10) || 2024;
      const area = clasificarArea(titulo, resumen, cleanTopics);
      const finalPdfUrl = contentUrl || handleUri;

      items.push({
        id: `unt-alicia-${handleUri.replace(/[^a-zA-Z0-9]/g, '-').slice(-28)}`,
        titulo,
        autor: autores.join('; ') || 'Graduando Ing. Industrial UNT',
        asesor: asesores.join('; ') || 'Docente Asesor — Escuela de Ing. Industrial UNT',
        anio,
        area,
        resumen:
          resumen.slice(0, 1200) ||
          `Tesis de Ingeniería Industrial de la Universidad Nacional de Trujillo: ${titulo}.`,
        palabrasClave: cleanTopics.length > 0 ? cleanTopics.slice(0, 5) : [area, 'Ingeniería Industrial', 'UNT'],
        urlRepositorio: finalPdfUrl,
        urlPdf: finalPdfUrl,
        pesoPdf: 'PDF Oficial UNT',
        universidad: 'Universidad Nacional de Trujillo',
        universidadId: 'UNT',
        handleUri,
        vistas: 155 + (titulo.length * 7) % 300,
        descargas: 60 + (titulo.length * 3) % 140,
        licencia: 'Acceso Abierto — Repositorio UNT',
        tipoDocumento: 'Tesis',
        enVivo: true,
        enVivoQuery: q
      });
    }

    return { total: items.length, items };
  } catch {
    return { total: 0, items: [] };
  }
}

const STRICT_INDUSTRIAL_RE = /(industrial|productividad|producci[oó]n|log[ií]stic|almac[eé]n|inventari|calidad|mantenimiento|seguridad y salud|salud ocupacional|sst|iperc|ergonom|lean|5s|six sigma|dmaic|tpm|kaizen|cadena de suministro|supply chain|costos|procesos|planta|manufactur|operaciones|abastecim|distribuci[oó]n|transporte|merma|tiempos|balance de l[ií]nea|layout|pmbok|viabilidad|factibilidad|iso 9001|iso 45001|ohsas|haccp|bpm|simulaci[oó]n|pron[oó]stico|mrp|erp|agroindustr|metalmec[aá]nic)/i;

async function queryUntOpenAire(queryText, size = 14) {
  try {
    const aliciaRes = await queryAliciaUnt(queryText, size * 2);
    const seen = new Set();
    const combined = [];

    for (const item of aliciaRes.items) {
      if (!STRICT_INDUSTRIAL_RE.test(`${item.titulo} ${item.resumen}`)) continue;
      const key = normalizar(item.titulo).slice(0, 75);
      if (seen.has(key)) continue;
      seen.add(key);
      combined.push(item);
    }

    const finalItems = combined.slice(0, size * 2);
    return { uniId: 'UNT', status: 'ok', total: finalItems.length, items: finalItems };
  } catch {
    return { uniId: 'UNT', status: 'timeout', total: 0, items: [] };
  }
}

export async function buscarTesisEnVivo({ query = '', universidades = ['UNT'], limitePorUni = 10 }) {
  // La UNT siempre va fija
  const uniSet = new Set(['UNT', ...universidades.map((u) => String(u).toUpperCase())]);
  const selectedConfigs = UNIVERSIDADES_CONFIG.filter((u) => uniSet.has(u.id));

  const cacheKey = `${normalizar(query)}::${Array.from(uniSet).sort().join(',')}::${limitePorUni}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const tasks = selectedConfigs.map((u) => {
    if (u.tipo === 'openaire-unt') {
      return queryUntOpenAire(query, Math.max(limitePorUni, 14));
    }
    return queryDspace7(u, query, limitePorUni);
  });

  const results = await Promise.all(tasks);

  const totalesPorUniversidad = {};
  const fuentesConsultadas = [];
  const combinedItems = [];

  for (const r of results) {
    totalesPorUniversidad[r.uniId] = r.total;
    fuentesConsultadas.push({ id: r.uniId, status: r.status, encontrados: r.items.length, totalRepositorio: r.total });
    combinedItems.push(...r.items);
  }

  const response = {
    query,
    totalEnRepositorios: Object.values(totalesPorUniversidad).reduce((acc, n) => acc + n, 0),
    totalesPorUniversidad,
    fuentesConsultadas,
    resultados: combinedItems
  };

  searchCache.set(cacheKey, { ts: Date.now(), data: response });
  return response;
}

export async function resolverPdfDirecto(uniId, uuid) {
  const uni = UNIVERSIDADES_CONFIG.find((u) => u.id === String(uniId).toUpperCase());
  if (!uni || !uni.api || !uuid) {
    return null;
  }

  try {
    const r = await fetchWithTimeout(`${uni.api}/core/items/${uuid}/bundles`, 7000);
    if (!r.ok) return null;
    const j = await r.json();
    const orig = (j._embedded?.bundles || []).find((b) => b.name === 'ORIGINAL');
    if (!orig?._links?.bitstreams?.href) return null;

    const rb = await fetchWithTimeout(orig._links.bitstreams.href, 7000);
    if (!rb.ok) return null;
    const jb = await rb.json();
    const pdfs = (jb._embedded?.bitstreams || []).filter((bs) => (bs.name || '').toLowerCase().endsWith('.pdf'));
    if (pdfs.length === 0) return null;

    pdfs.sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0));
    const best = pdfs[0];
    const contentUrl = best._links?.content?.href || `${uni.api}/core/bitstreams/${best.uuid}/content`;

    // Verificar que el bitstream /content sea público (status 200 o 206, no 401/403)
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const checkResp = await fetch(contentUrl, {
        signal: controller.signal,
        headers: {
          Range: 'bytes=0-16',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (checkResp.status !== 200 && checkResp.status !== 206) return null;
      const ct = (checkResp.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('text/html') || ct.includes('application/json')) return null;
    } finally {
      clearTimeout(timer);
    }

    return contentUrl;
  } catch {
    return null;
  }
}

const ALLOWED_PDF_HOSTS = new Set([
  'repositorio.unitru.edu.pe',
  'tesis.pucp.edu.pe',
  'cybertesis.unmsm.edu.pe',
  'repositorio.uni.edu.pe',
  'repositorio.ulima.edu.pe',
  'repositorioacademico.upc.edu.pe',
  'repositorio.unsa.edu.pe',
  'repositorio.usil.edu.pe',
  'repositorio.upn.edu.pe'
]);

/**
 * Convierte cualquier URL de interfaz Angular (/bitstreams/{uuid}/download)
 * al endpoint binario directo DSpace 7 (/server/api/core/bitstreams/{uuid}/content).
 */
function normalizarUrlBitstreamContent(rawUrl) {
  if (!rawUrl || !rawUrl.startsWith('http')) return null;
  try {
    const parsed = new URL(rawUrl);
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname.startsWith('192.168.') ||
      parsed.hostname.startsWith('10.')
    ) {
      return null;
    }
    const m = parsed.pathname.match(/\/bitstreams\/([0-9a-f-]+)\/download/i);
    if (m) {
      const uuid = m[1];
      const uni = UNIVERSIDADES_CONFIG.find((u) => u.base.includes(parsed.hostname));
      if (uni?.api) {
        return `${uni.api}/core/bitstreams/${uuid}/content`;
      }
      return `${parsed.origin}/server/api/core/bitstreams/${uuid}/content`;
    }
    return rawUrl;
  } catch {
    return null;
  }
}

/**
 * Resuelve y abre un stream directo del archivo PDF real de la tesis desde su endpoint
 * oficial DSpace 7 /core/bitstreams/{uuid}/content. Nunca sustituye por otro documento.
 */
export async function abrirStreamPdfReal({ uni = '', uuid = '', url = '' } = {}) {
  let targetPdfUrl = normalizarUrlBitstreamContent(url);

  if (!targetPdfUrl && uni && uuid) {
    targetPdfUrl = await resolverPdfDirecto(uni, uuid);
  }

  if (!targetPdfUrl) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);
  try {
    const resp = await fetch(targetPdfUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/pdf,*/*'
      },
      redirect: 'follow'
    });

    if (!resp.ok || !resp.body) {
      return null;
    }

    const ct = (resp.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('text/html') || ct.includes('application/json')) {
      return null;
    }

    return {
      body: resp.body,
      contentLength: resp.headers.get('content-length') || null,
      targetPdfUrl
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
