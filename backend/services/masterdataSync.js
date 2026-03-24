const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { pool } = require('../db/pool');

const DEFAULT_CKAN_BASE_URL = 'https://data.moa.gov.et';
const DEFAULT_ETHIOSEED_BASE_URL = 'https://ethioseed.moa.gov.et';
const DEFAULT_ETHIONSDI_WFS_BASE_URL = 'http://www.ethionsdi.gov.et/geoserver/wfs';

function sha256Hex(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function stableStringify(value) {
  if (value === null || value === undefined) return JSON.stringify(value);
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';

  const keys = Object.keys(value).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}

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
    ethioseedBaseUrl: map.get('ethioseed_base_url') || DEFAULT_ETHIOSEED_BASE_URL,
    ethionsdiWfsBaseUrl: map.get('ethionsdi_wfs_base_url') || DEFAULT_ETHIONSDI_WFS_BASE_URL,
  };
}

async function httpGet(url, { headers = {} } = {}) {
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

  return new Promise((resolve, reject) => {
    const req = lib.request(url, options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        const status = res.statusCode || 0;
        if (status < 200 || status >= 300) {
          return reject(new Error(`GET ${url} failed with status ${status}: ${body.slice(0, 200)}`));
        }
        resolve(body);
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function fetchJson(url) {
  const text = await httpGet(url, { headers: { Accept: 'application/json' } });
  return JSON.parse(text);
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

  const { ckanBaseUrl, ethioseedBaseUrl } = await getMasterdataSourceBaseUrls();
  const CROP_CROPS_URL_FALLBACK = `${ethioseedBaseUrl}/api/crops-catalog`;
  const CROP_VARIETIES_URL_FALLBACK = `${ethioseedBaseUrl}/api/varieties-catalog`;

  const cropUrls = await getCropSeedUrlsFromCkan(ckanBaseUrl).catch(() => null);
  const varietiesUrl = cropUrls?.varietiesUrl || CROP_VARIETIES_URL_FALLBACK;
  const cropsUrl = cropUrls?.cropsUrl || CROP_CROPS_URL_FALLBACK;

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

async function getCropSeedUrlsFromCkan(ckanBaseUrl) {
  // Crop Catalogue (Seed Varieties) is exposed via "Ethiopian Seed Catalog" on CKAN,
  // with resources named "Varieties" and "Crops".
  const searchUrl = `${ckanBaseUrl}/api/3/action/package_search?q=${encodeURIComponent('tags:Crop')}&rows=5`;
  const searchJson = await fetchJson(searchUrl);
  const datasets = searchJson?.result?.results || [];

  for (const ds of datasets) {
    const resources = Array.isArray(ds.resources) ? ds.resources : [];
    const varietiesRes = resources.find((r) => String(r.name || '').toLowerCase() === 'varieties');
    const cropsRes = resources.find((r) => String(r.name || '').toLowerCase() === 'crops');
    if (varietiesRes?.url && cropsRes?.url) {
      return { varietiesUrl: varietiesRes.url, cropsUrl: cropsRes.url };
    }
  }

  return null;
}

async function getLocationGeojsonUrlFromCkan(ckanBaseUrl) {
  // Location Catalogue is published on CKAN with dataset id: ethiopian-administrative-boundary
  const showUrl = `${ckanBaseUrl}/api/3/action/package_show?id=${encodeURIComponent('ethiopian-administrative-boundary')}`;
  const showJson = await fetchJson(showUrl);
  const resources = showJson?.result?.resources || [];

  const geojsonRes = resources.find((r) => {
    const name = String(r.name || '').toLowerCase();
    const url = String(r.url || '');
    return name.includes('json') && url.toLowerCase().includes('outputformat=json');
  });

  return geojsonRes?.url || null;
}

async function syncLocationAdministrativeBoundaries() {
  const sourceSystem = 'ethionsdi.gov.et';
  const sourceCatalogue = 'location_catalogue';

  const { ckanBaseUrl, ethionsdiWfsBaseUrl } = await getMasterdataSourceBaseUrls();
  const LOCATION_WFS_GEOJSON_URL_FALLBACK =
    `${ethionsdiWfsBaseUrl}?srsName=EPSG%3A4326&typename=geonode%3Aeth_adm2&outputFormat=json&version=1.0.0&service=WFS&request=GetFeature`;

  const locationUrl = await getLocationGeojsonUrlFromCkan(ckanBaseUrl).catch(() => null) || LOCATION_WFS_GEOJSON_URL_FALLBACK;
  const geojson = await fetchJson(locationUrl);
  const features = Array.isArray(geojson?.features) ? geojson.features : [];
  if (!features.length) return { insertedCount: 0, updatedCount: 0 };

  const maxRecords = process.env.LOCATION_MAX_RECORDS ? Number(process.env.LOCATION_MAX_RECORDS) : 0;
  const limitedFeatures = maxRecords > 0 ? features.slice(0, maxRecords) : features;

  const records = limitedFeatures.map((f) => {
    const props = f.properties || {};
    const pCode = props.ID_2 ?? props.id_2 ?? props.ID2 ?? props.p_code ?? null;
    const name = props.NAME_2 ?? props.name_2 ?? props.NAME2 ?? null;
    const parentPCode = props.ID_1 ?? props.id_1 ?? props.ID1 ?? null;
    const rawType = props.ENGTYPE_2 ?? props.TYPE_2 ?? props.type_2 ?? null;

    const level = mapLocationLevel(rawType);
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

async function syncLivestockCatalogue() {
  const sourceSystem = 'data.moa.gov.et';
  const sourceCatalogue = 'livestock_catalogue';

  const { ckanBaseUrl } = await getMasterdataSourceBaseUrls();
  const queries = [
    { q: 'tags:Livestock' },
    { q: 'tags:livestock' },
    { q: 'livestock-commercialization' },
  ];

  const maxRecords = process.env.LIVESTOCK_MAX_RECORDS ? Number(process.env.LIVESTOCK_MAX_RECORDS) : 500;

  let discoveredRecords = [];

  // Discovery: try to find a resource that returns JSON directly.
  for (const query of queries) {
    const searchUrl = `${ckanBaseUrl}/api/3/action/package_search?q=${encodeURIComponent(query.q)}&rows=20`;
    const searchJson = await fetchJson(searchUrl);
    const datasets = searchJson?.result?.results || [];

    for (const ds of datasets) {
      if (discoveredRecords.length >= maxRecords) break;
      const dsId = ds.id;
      if (!dsId) continue;

      const showUrl = `${ckanBaseUrl}/api/3/action/package_show?id=${encodeURIComponent(dsId)}`;
      const dsJson = await fetchJson(showUrl);
      const resources = dsJson?.result?.resources || [];

      for (const res of resources) {
        if (discoveredRecords.length >= maxRecords) break;
        const url = res.url;
        if (!url || typeof url !== 'string') continue;

        // Heuristics: prefer direct JSON-ish URLs.
        const looksJson =
          url.toLowerCase().includes('json') ||
          url.toLowerCase().includes('api/') ||
          url.toLowerCase().endsWith('.json');

        const looksCsv =
          url.toLowerCase().includes('csv') ||
          url.toLowerCase().endsWith('.csv');

        if (!looksJson && !looksCsv) continue;

        try {
          const payload = await fetchJson(url);
          const arr = normalizeJsonArray(payload);
          if (!arr.length) continue;
          discoveredRecords = discoveredRecords.concat(arr);
          if (discoveredRecords.length >= maxRecords) break;
        } catch (_) {
          // Ignore non-JSON resources for now.
        }
      }
    }
    if (discoveredRecords.length >= maxRecords) break;
  }

  discoveredRecords = discoveredRecords.slice(0, maxRecords);
  if (!discoveredRecords.length) {
    return { insertedCount: 0, updatedCount: 0, discoveredRecords: 0 };
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

  return { insertedCount, updatedCount, discoveredRecords: discoveredRecords.length };
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

