const http = require('http');
const https = require('https');
const { pool } = require('../db/pool');
const { sha256Hex, stableStringify } = require('./rowHash');

const DEFAULT_CKAN_BASE_URL = 'https://data.moa.gov.et';
const DEFAULT_DATAHUB_BASE_URL = 'https://datahub.moa.gov.et';
const DEFAULT_ETHIOSEED_BASE_URL = 'https://ethioseed.moa.gov.et';
const DEFAULT_ETHIONSDI_WFS_BASE_URL = 'https://ethionsdi.gov.et/geoserver/wfs';

const DEFAULT_HTTP_TIMEOUT_MS = Number(process.env.MASTERDATA_HTTP_TIMEOUT_MS) || 30000;

/** Current NSDI layer for national woreda boundaries (eth_adm2 was retired on the service). */
const WFS_TYPENAME_WOREDA = 'geonode:eth_woreda_2013';

function getUrlProtocol(url) {
  if (url.startsWith('https://')) return 'https:';
  return 'http:';
}

async function getMasterdataSourceBaseUrls() {
  // Load from DB so admins can update endpoints without code changes.
  const result = await pool.query(
    `SELECT config_key, config_value FROM app_configuration
     WHERE config_group = 'masterdata' AND is_active = TRUE`
  );

  const map = new Map(result.rows.map((r) => [r.config_key, r.config_value]));

  return {
    ckanBaseUrl: map.get('ckan_base_url') || DEFAULT_CKAN_BASE_URL,
    datahubBaseUrl: map.get('datahub_base_url') || DEFAULT_DATAHUB_BASE_URL,
    ethioseedBaseUrl: map.get('ethioseed_base_url') || DEFAULT_ETHIOSEED_BASE_URL,
    ethionsdiWfsBaseUrl: map.get('ethionsdi_wfs_base_url') || DEFAULT_ETHIONSDI_WFS_BASE_URL,
  };
}

function effectiveHttpTimeoutMs(url, explicit) {
  if (explicit != null) return explicit;
  if (String(url).includes('datahub.moa.gov.et')) {
    return Math.min(12000, DEFAULT_HTTP_TIMEOUT_MS);
  }
  return DEFAULT_HTTP_TIMEOUT_MS;
}

async function httpGet(url, { headers = {}, timeoutMs, maxBodyBytes = 0 } = {}) {
  const protocol = getUrlProtocol(url);
  const lib = protocol === 'https:' ? https : http;

  const options = {
    method: 'GET',
    headers,
  };

  // Avoid TLS issues with upstream endpoints.
  if (protocol === 'https:' && lib === https) {
    options.rejectUnauthorized = false;
  }

  const waitMs = effectiveHttpTimeoutMs(url, timeoutMs);

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (err, val) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve(val);
    };

    const req = lib.request(url, options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
        if (maxBodyBytes > 0 && Buffer.byteLength(body, 'utf8') > maxBodyBytes) {
          req.destroy();
          finish(new Error(`GET response exceeded ${maxBodyBytes} bytes`));
        }
      });
      res.on('end', () => {
        if (settled) return;
        const status = res.statusCode || 0;
        if (status < 200 || status >= 300) {
          return finish(new Error(`GET ${url} failed with status ${status}: ${body.slice(0, 200)}`));
        }
        finish(null, body);
      });
    });
    req.setTimeout(waitMs, () => {
      req.destroy();
      finish(new Error(`GET ${url} timed out after ${waitMs}ms`));
    });
    req.on('error', (e) => finish(e));
    req.end();
  });
}

async function fetchJson(url, { timeoutMs, maxBodyBytes } = {}) {
  const text = await httpGet(url, {
    headers: { Accept: 'application/json' },
    timeoutMs,
    maxBodyBytes,
  });
  const trimmed = text.trim();
  if (trimmed.startsWith('<')) {
    throw new Error(`Expected JSON but received XML/HTML from ${url.slice(0, 80)}`);
  }
  return JSON.parse(text);
}

function normalizeUpstreamLocationWfsUrl(url) {
  if (!url || typeof url !== 'string') return url;
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    if (h === 'www.ethionsdi.gov.et' || h === 'ethionsdi.gov.et') {
      u.protocol = 'https:';
      u.hostname = 'ethionsdi.gov.et';
    }
    let s = u.toString();
    s = s.replace(/typename=geonode%3Aeth_adm2/gi, `typename=${encodeURIComponent(WFS_TYPENAME_WOREDA)}`);
    s = s.replace(/typename=geonode:eth_adm2/gi, `typename=${encodeURIComponent(WFS_TYPENAME_WOREDA)}`);
    return s;
  } catch {
    return url
      .replace(/^http:\/\/www\.ethionsdi\.gov\.et/i, 'https://ethionsdi.gov.et')
      .replace(/^http:\/\/ethionsdi\.gov\.et/i, 'https://ethionsdi.gov.et');
  }
}

function buildNationalWoredaWfsGeojsonUrl(wfsBaseUrl) {
  const base = String(wfsBaseUrl || DEFAULT_ETHIONSDI_WFS_BASE_URL)
    .replace(/^http:\/\/www\.ethionsdi\.gov\.et/i, 'https://ethionsdi.gov.et')
    .replace(/^http:\/\/ethionsdi\.gov\.et/i, 'https://ethionsdi.gov.et')
    .replace(/\/+$/, '');
  const encodedType = encodeURIComponent(WFS_TYPENAME_WOREDA);
  return `${base}?srsName=EPSG%3A4326&typename=${encodedType}&outputFormat=json&version=1.0.0&service=WFS&request=GetFeature`;
}

function normalizeJsonArray(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  const candidateKeys = ['results', 'data', 'items', 'records'];
  for (const key of candidateKeys) {
    if (Array.isArray(data[key])) return data[key];
  }

  // Some endpoints return { result: { ... } }
  if (data.result && typeof data.result === 'object') {
    for (const key of candidateKeys) {
      if (Array.isArray(data.result[key])) return data.result[key];
    }
  }

  return [];
}

function mapLocationLevel(rawType) {
  if (!rawType) return 'woreda';
  const s = String(rawType).toLowerCase();
  if (s.includes('region')) return 'region';
  if (s.includes('zone')) return 'zone';
  if (s.includes('woreda') || s.includes('district')) return 'woreda';
  return 'woreda';
}

async function syncCropSeedVarieties() {
  const sourceSystem = 'ethioseed.moa.gov.et';
  const sourceCatalogue = 'crop_catalogue';

  const { ethioseedBaseUrl } = await getMasterdataSourceBaseUrls();
  const cropsUrl = `${String(ethioseedBaseUrl).replace(/\/+$/, '')}/api/crops-catalog`;
  const varietiesUrl = `${String(ethioseedBaseUrl).replace(/\/+$/, '')}/api/varieties-catalog`;

  const [cropsData, varietiesData] = await Promise.all([fetchJson(cropsUrl), fetchJson(varietiesUrl)]);
  const crops = normalizeJsonArray(cropsData);
  const varieties = normalizeJsonArray(varietiesData);

  if (!crops.length || !varieties.length) {
    return { insertedCount: 0, updatedCount: 0 };
  }

  const cropById = new Map(crops.map((c) => [String(c.id), c]));

  const records = varieties.map((v) => {
    const recordKey = String(v.id);
    const seedId = v.seed_id !== undefined ? v.seed_id : v.seedId;
    const cropName = seedId !== undefined && seedId !== null ? (cropById.get(String(seedId))?.name || null) : null;

    const varietyName = v.registered_name || v.variety_common_name || v.scientific_name || null;
    const seedSupplyNotes = v.released_for || v.planting_method || null;

    const attributes = v;
    const rowHash = sha256Hex(
      stableStringify({
        varietyName,
        cropName,
        seedSupplyNotes,
        attributes,
      })
    );

    return {
      sourceSystem,
      sourceCatalogue,
      sourceRecordKey: recordKey,
      varietyName,
      cropName,
      producerName: null,
      seedSupplyNotes,
      attributes,
      rowHash,
      isActive: true,
      sourceUpdatedAt: null,
    };
  });

  const keys = records.map((r) => r.sourceRecordKey);
  const existing = await pool.query(
    `SELECT source_record_key, row_hash FROM master_crop_seed_varieties
     WHERE source_system = $1 AND source_catalogue = $2 AND source_record_key = ANY($3::text[])`,
    [sourceSystem, sourceCatalogue, keys]
  );
  const existingByKey = new Map(existing.rows.map((r) => [r.source_record_key, r.row_hash]));

  let insertedCount = 0;
  let updatedCount = 0;
  for (const r of records) {
    if (!existingByKey.has(r.sourceRecordKey)) insertedCount++;
    else if (existingByKey.get(r.sourceRecordKey) !== r.rowHash) updatedCount++;
  }

  await pool.query('BEGIN');
  try {
    for (const r of records) {
      await pool.query(
        `INSERT INTO master_crop_seed_varieties
           (source_system, source_catalogue, source_record_key, variety_name, crop_name, producer_name, seed_supply_notes,
            attributes, row_hash, source_updated_at, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (source_system, source_catalogue, source_record_key)
         DO UPDATE SET
           variety_name = EXCLUDED.variety_name,
           crop_name = EXCLUDED.crop_name,
           producer_name = EXCLUDED.producer_name,
           seed_supply_notes = EXCLUDED.seed_supply_notes,
           attributes = EXCLUDED.attributes,
           row_hash = EXCLUDED.row_hash,
           source_updated_at = EXCLUDED.source_updated_at,
           is_active = EXCLUDED.is_active,
           updated_at = now()
         WHERE master_crop_seed_varieties.row_hash IS DISTINCT FROM EXCLUDED.row_hash
               OR master_crop_seed_varieties.is_active IS DISTINCT FROM EXCLUDED.is_active`,
        [
          r.sourceSystem,
          r.sourceCatalogue,
          r.sourceRecordKey,
          r.varietyName,
          r.cropName,
          r.producerName,
          r.seedSupplyNotes,
          r.attributes,
          r.rowHash,
          r.sourceUpdatedAt,
          r.isActive,
        ]
      );
    }
    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }

  return { insertedCount, updatedCount };
}

async function getLocationGeojsonUrlFromCkan(ckanBaseUrl) {
  const root = String(ckanBaseUrl).replace(/\/+$/, '');
  const showUrl = `${root}/api/3/action/package_show?id=${encodeURIComponent('ethiopian-administrative-boundary')}`;
  const showJson = await fetchJson(showUrl);
  const resources = showJson?.result?.resources || [];

  const geojsonRes = resources.find((r) => {
    const url = String(r.url || '').toLowerCase();
    const name = String(r.name || '').toLowerCase();
    const isWfsJson =
      (url.includes('outputformat=json') || url.includes('outputformat=application%2fjson')) &&
      (url.includes('wfs') || url.includes('geoserver'));
    return isWfsJson || (name.includes('json') && url.includes('outputformat=json'));
  });

  return geojsonRes?.url || null;
}

async function syncLocationAdministrativeBoundaries() {
  const sourceCatalogue = 'location_catalogue';

  const { datahubBaseUrl, ckanBaseUrl, ethionsdiWfsBaseUrl } = await getMasterdataSourceBaseUrls();
  const directWfsFallback = buildNationalWoredaWfsGeojsonUrl(ethionsdiWfsBaseUrl);

  let locationUrl = null;
  let sourceSystem = 'data.moa.gov.et';

  async function tryCkanMirror(baseUrl, label) {
    try {
      const u = await getLocationGeojsonUrlFromCkan(baseUrl);
      if (u) {
        locationUrl = normalizeUpstreamLocationWfsUrl(u);
        sourceSystem = label;
        return true;
      }
    } catch (_) {
      /* unreachable Data Hub / CKAN — try next */
    }
    return false;
  }

  // Prefer the MOA open-data portal first: datahub.moa.gov.et often times out outside Ethiopia.
  await tryCkanMirror(ckanBaseUrl, 'data.moa.gov.et');
  if (!locationUrl) {
    await tryCkanMirror(datahubBaseUrl, 'datahub.moa.gov.et');
  }
  if (!locationUrl) {
    locationUrl = directWfsFallback;
    sourceSystem = 'ethionsdi.gov.et';
  } else {
    locationUrl = normalizeUpstreamLocationWfsUrl(locationUrl);
  }

  let geojson;
  try {
    geojson = await fetchJson(locationUrl);
  } catch (_) {
    geojson = await fetchJson(directWfsFallback);
    sourceSystem = 'ethionsdi.gov.et';
  }

  if (!geojson || !Array.isArray(geojson.features) || !geojson.features.length) {
    geojson = await fetchJson(directWfsFallback);
    sourceSystem = 'ethionsdi.gov.et';
  }
  const features = Array.isArray(geojson?.features) ? geojson.features : [];
  if (!features.length) return { insertedCount: 0, updatedCount: 0 };

  const maxRecords = process.env.LOCATION_MAX_RECORDS ? Number(process.env.LOCATION_MAX_RECORDS) : 0;
  const limitedFeatures = maxRecords > 0 ? features.slice(0, maxRecords) : features;

  const records = limitedFeatures.map((f) => {
    const props = f.properties || {};
    const pCode =
      props.wor_p_code ??
      props.WOR_P_CODE ??
      props.hrpcode ??
      props.ID_2 ??
      props.id_2 ??
      props.ID2 ??
      props.p_code ??
      null;
    const name =
      props.woredaname ??
      props.hrname ??
      props.NAME_2 ??
      props.name_2 ??
      props.NAME2 ??
      props.name ??
      null;
    const parentPCode =
      props.zon_p_code ?? props.hrparent ?? props.ID_1 ?? props.id_1 ?? props.ID1 ?? null;
    const rawType = props.ENGTYPE_2 ?? props.TYPE_2 ?? props.type_2 ?? null;

    let level = mapLocationLevel(rawType);
    if (props.woredaname || props.wor_p_code) level = 'woreda';
    else if (props.zonename || props.zon_p_code) level = 'zone';
    else if (props.regionname || props.reg_p_code) level = 'region';
    // Use only p_code for stable identity across syncs.
    const recordKey = pCode !== null && pCode !== undefined ? String(pCode) : sha256Hex(stableStringify(props));

    const geometry = f.geometry || null;
    const attributes = props;

    const rowHash = sha256Hex(
      stableStringify({
        level,
        pCode,
        name,
        parentPCode,
        geometry,
      })
    );

    return {
      sourceSystem,
      sourceCatalogue,
      sourceRecordKey: recordKey,
      level,
      pCode: pCode !== null ? String(pCode) : null,
      name: name !== undefined ? name : null,
      parentPCode: parentPCode !== null ? String(parentPCode) : null,
      geometry,
      attributes,
      rowHash,
      isActive: true,
      sourceUpdatedAt: null,
    };
  });

  const keys = records.map((r) => r.sourceRecordKey);
  const existing = await pool.query(
    `SELECT source_record_key, row_hash FROM master_location_administrative_boundaries
     WHERE source_system = $1 AND source_catalogue = $2 AND source_record_key = ANY($3::text[])`,
    [sourceSystem, sourceCatalogue, keys]
  );
  const existingByKey = new Map(existing.rows.map((r) => [r.source_record_key, r.row_hash]));

  let insertedCount = 0;
  let updatedCount = 0;
  for (const r of records) {
    if (!existingByKey.has(r.sourceRecordKey)) insertedCount++;
    else if (existingByKey.get(r.sourceRecordKey) !== r.rowHash) updatedCount++;
  }

  await pool.query('BEGIN');
  try {
    for (const r of records) {
      await pool.query(
        `INSERT INTO master_location_administrative_boundaries
           (source_system, source_catalogue, source_record_key, level, p_code, name, parent_p_code,
            geometry_geojson, attributes, row_hash, source_updated_at, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (source_system, source_catalogue, source_record_key)
         DO UPDATE SET
           level = EXCLUDED.level,
           p_code = EXCLUDED.p_code,
           name = EXCLUDED.name,
           parent_p_code = EXCLUDED.parent_p_code,
           geometry_geojson = EXCLUDED.geometry_geojson,
           attributes = EXCLUDED.attributes,
           row_hash = EXCLUDED.row_hash,
           source_updated_at = EXCLUDED.source_updated_at,
           is_active = EXCLUDED.is_active,
           updated_at = now()
         WHERE master_location_administrative_boundaries.row_hash IS DISTINCT FROM EXCLUDED.row_hash
               OR master_location_administrative_boundaries.is_active IS DISTINCT FROM EXCLUDED.is_active`,
        [
          r.sourceSystem,
          r.sourceCatalogue,
          r.sourceRecordKey,
          r.level,
          r.pCode,
          r.name,
          r.parentPCode,
          r.geometry,
          r.attributes,
          r.rowHash,
          r.sourceUpdatedAt,
          r.isActive,
        ]
      );
    }
    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }

  return { insertedCount, updatedCount };
}

/**
 * Curated baseline species when CKAN discovery finds no parseable JSON (fast, always completes).
 * source_record_key uses prefix so real upstream IDs never collide.
 */
function livestockSeedRows() {
  const rows = [
    { id: 'oan-seed-cattle', common_name: 'Cattle', scientific_name: 'Bos taurus' },
    { id: 'oan-seed-sheep', common_name: 'Sheep', scientific_name: 'Ovis aries' },
    { id: 'oan-seed-goat', common_name: 'Goat', scientific_name: 'Capra hircus' },
    { id: 'oan-seed-camel', common_name: 'Camel', scientific_name: 'Camelus dromedarius' },
    { id: 'oan-seed-chicken', common_name: 'Chicken', scientific_name: 'Gallus gallus domesticus' },
    { id: 'oan-seed-donkey', common_name: 'Donkey', scientific_name: 'Equus asinus' },
    { id: 'oan-seed-horse', common_name: 'Horse', scientific_name: 'Equus caballus' },
    { id: 'oan-seed-mule', common_name: 'Mule', scientific_name: 'Equus mulus' },
    { id: 'oan-seed-pig', common_name: 'Pig', scientific_name: 'Sus scrofa domesticus' },
    { id: 'oan-seed-bee', common_name: 'Honey bee', scientific_name: 'Apis mellifera' },
    { id: 'oan-seed-fish', common_name: 'Fish (aquaculture)', scientific_name: null },
    { id: 'oan-seed-turkey', common_name: 'Turkey', scientific_name: 'Meleagris gallopavo' },
  ];
  return rows;
}

async function syncLivestockCatalogue() {
  const sourceCatalogue = 'livestock_catalogue';

  const resourceTimeoutMs = Number(process.env.LIVESTOCK_RESOURCE_TIMEOUT_MS) || 12000;
  const maxBodyBytes = Number(process.env.LIVESTOCK_MAX_BODY_BYTES) || 2_500_000;
  const searchRows = Number(process.env.LIVESTOCK_SEARCH_ROWS) || 10;
  const maxPackageShow = Number(process.env.LIVESTOCK_MAX_PACKAGE_SHOW) || 12;
  const maxResourceFetches = Number(process.env.LIVESTOCK_MAX_RESOURCE_FETCHES) || 18;
  const earlyExitCount = Number(process.env.LIVESTOCK_EARLY_EXIT_COUNT) || 35;

  const { datahubBaseUrl, ckanBaseUrl } = await getMasterdataSourceBaseUrls();
  const ckanApiRoots = [ckanBaseUrl, datahubBaseUrl].filter((u, i, a) => u && a.indexOf(u) === i);

  // Fewer, higher-signal queries; wide term "animal" pulls irrelevant huge datasets and slows sync.
  const queries = [
    { q: 'tags:livestock' },
    { q: 'livestock-commercialization' },
    { q: 'livestock' },
  ];

  const maxRecords = process.env.LIVESTOCK_MAX_RECORDS ? Number(process.env.LIVESTOCK_MAX_RECORDS) : 500;

  let discoveredRecords = [];
  let resolvedSourceSystem = null;
  let packageShowCalls = 0;
  let resourceFetchCalls = 0;
  let usedSeedFallback = false;

  function labelForRoot(root) {
    return String(root).includes('datahub') ? 'datahub.moa.gov.et' : 'data.moa.gov.et';
  }

  // Discovery: MOA portal first (often more reachable than Data Hub). Hard caps prevent multi-minute hangs.
  outer: for (const ckanRoot of ckanApiRoots) {
    for (const query of queries) {
      if (discoveredRecords.length >= maxRecords) break outer;
      const searchUrl = `${String(ckanRoot).replace(/\/+$/, '')}/api/3/action/package_search?q=${encodeURIComponent(query.q)}&rows=${searchRows}`;
      let searchJson;
      try {
        searchJson = await fetchJson(searchUrl, {
          timeoutMs: Math.min(resourceTimeoutMs, 15000),
          maxBodyBytes,
        });
      } catch (_) {
        continue;
      }
      const datasets = searchJson?.result?.results || [];

      for (const ds of datasets) {
        if (discoveredRecords.length >= maxRecords) break outer;
        if (packageShowCalls >= maxPackageShow) break outer;
        const dsId = ds.id;
        if (!dsId) continue;

        const showUrl = `${String(ckanRoot).replace(/\/+$/, '')}/api/3/action/package_show?id=${encodeURIComponent(dsId)}`;
        let dsJson;
        try {
          packageShowCalls += 1;
          dsJson = await fetchJson(showUrl, {
            timeoutMs: Math.min(resourceTimeoutMs, 15000),
            maxBodyBytes,
          });
        } catch (_) {
          continue;
        }
        if (!dsJson?.success || !dsJson?.result) continue;

        const resources = dsJson.result.resources || [];

        for (const res of resources) {
          if (discoveredRecords.length >= maxRecords) break outer;
          if (resourceFetchCalls >= maxResourceFetches) break outer;
          const url = res.url;
          if (!url || typeof url !== 'string') continue;

          const fmt = String(res.format || '').toLowerCase();
          if (fmt === 'html') continue;

          // Only JSON: fetchJson on CSV/HTML wastes full timeouts and never parses.
          const looksJson =
            fmt === 'json' ||
            url.toLowerCase().includes('json') ||
            url.toLowerCase().includes('api/') ||
            url.toLowerCase().endsWith('.json');

          if (!looksJson) continue;

          try {
            resourceFetchCalls += 1;
            const payload = await fetchJson(url, { timeoutMs: resourceTimeoutMs, maxBodyBytes });
            const arr = normalizeJsonArray(payload);
            if (!arr.length) continue;
            if (resolvedSourceSystem === null) {
              resolvedSourceSystem = labelForRoot(ckanRoot);
            }
            discoveredRecords = discoveredRecords.concat(arr);
            if (discoveredRecords.length >= earlyExitCount) break outer;
            if (discoveredRecords.length >= maxRecords) break outer;
          } catch (_) {
            /* ignore slow/bad resources */
          }
        }
      }
    }
  }

  let sourceSystem = resolvedSourceSystem || 'data.moa.gov.et';

  discoveredRecords = discoveredRecords.slice(0, maxRecords);
  if (!discoveredRecords.length) {
    discoveredRecords = livestockSeedRows();
    sourceSystem = 'openagrinet.masterdata.seed';
    usedSeedFallback = true;
  }

  const records = discoveredRecords.map((r) => {
    const idCandidate =
      r.id ?? r.species_id ?? r.category_id ?? r.livestock_id ?? r.name ?? r.common_name ?? null;

    const recordKey = idCandidate !== null && idCandidate !== undefined ? String(idCandidate) : sha256Hex(stableStringify(r));

    const speciesCommonName = r.species_common_name ?? r.common_name ?? r.name ?? null;
    const speciesScientificName = r.species_scientific_name ?? r.scientific_name ?? null;

    const productionProgram = r.production_program ?? r.productionProgram ?? null;
    const animalHealthProgram = r.animal_health_program ?? r.animalHealthProgram ?? null;
    const commercializationProgram = r.commercialization_program ?? r.commercializationProgram ?? null;

    const rowHash = sha256Hex(
      stableStringify({
        speciesCommonName,
        speciesScientificName,
        productionProgram,
        animalHealthProgram,
        commercializationProgram,
        attributes: r,
      })
    );

    return {
      sourceSystem,
      sourceCatalogue,
      sourceRecordKey: recordKey,
      speciesCommonName,
      speciesScientificName,
      productionProgram,
      animalHealthProgram,
      commercializationProgram,
      attributes: r,
      rowHash,
      isActive: true,
      sourceUpdatedAt: null,
    };
  });

  const keys = records.map((x) => x.sourceRecordKey);
  const existing = await pool.query(
    `SELECT source_record_key, row_hash FROM master_livestock_catalogue
     WHERE source_system = $1 AND source_catalogue = $2 AND source_record_key = ANY($3::text[])`,
    [sourceSystem, sourceCatalogue, keys]
  );
  const existingByKey = new Map(existing.rows.map((r) => [r.source_record_key, r.row_hash]));

  let insertedCount = 0;
  let updatedCount = 0;
  for (const r of records) {
    if (!existingByKey.has(r.sourceRecordKey)) insertedCount++;
    else if (existingByKey.get(r.sourceRecordKey) !== r.rowHash) updatedCount++;
  }

  await pool.query('BEGIN');
  try {
    for (const r of records) {
      await pool.query(
        `INSERT INTO master_livestock_catalogue
           (source_system, source_catalogue, source_record_key,
            species_common_name, species_scientific_name,
            production_program, animal_health_program, commercialization_program,
            attributes, row_hash, source_updated_at, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (source_system, source_catalogue, source_record_key)
         DO UPDATE SET
           species_common_name = EXCLUDED.species_common_name,
           species_scientific_name = EXCLUDED.species_scientific_name,
           production_program = EXCLUDED.production_program,
           animal_health_program = EXCLUDED.animal_health_program,
           commercialization_program = EXCLUDED.commercialization_program,
           attributes = EXCLUDED.attributes,
           row_hash = EXCLUDED.row_hash,
           source_updated_at = EXCLUDED.source_updated_at,
           is_active = EXCLUDED.is_active,
           updated_at = now()
         WHERE master_livestock_catalogue.row_hash IS DISTINCT FROM EXCLUDED.row_hash
               OR master_livestock_catalogue.is_active IS DISTINCT FROM EXCLUDED.is_active`,
        [
          r.sourceSystem,
          r.sourceCatalogue,
          r.sourceRecordKey,
          r.speciesCommonName,
          r.speciesScientificName,
          r.productionProgram,
          r.animalHealthProgram,
          r.commercializationProgram,
          r.attributes,
          r.rowHash,
          r.sourceUpdatedAt,
          r.isActive,
        ]
      );
    }
    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }

  return {
    insertedCount,
    updatedCount,
    discoveredRecords: records.length,
    seedFallback: usedSeedFallback,
    sourceSystem,
  };
}

async function runMasterdataSync(catalogue) {
  if (catalogue === 'all') {
    const crop = await syncCropSeedVarieties();
    const loc = await syncLocationAdministrativeBoundaries();
    const livestock = await syncLivestockCatalogue();
    return { crop, loc, livestock };
  }

  if (catalogue === 'crop_catalogue') return syncCropSeedVarieties();
  if (catalogue === 'location_catalogue') return syncLocationAdministrativeBoundaries();
  if (catalogue === 'livestock_catalogue') return syncLivestockCatalogue();

  throw new Error(`Unsupported catalogue: ${catalogue}`);
}

module.exports = { runMasterdataSync };

