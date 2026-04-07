const { pool } = require('../db/pool');

const CATALOGUE_TABLE = {
  crop_catalogue: 'master_crop_seed_varieties',
  location_catalogue: 'master_location_administrative_boundaries',
  livestock_catalogue: 'master_livestock_catalogue',
};

const PUBLIC_CATALOGUES = new Set(['crop_catalogue', 'location_catalogue', 'livestock_catalogue']);

function tableForCatalogue(catalogue) {
  return CATALOGUE_TABLE[catalogue] || null;
}

function isPublicCatalogue(catalogue) {
  return PUBLIC_CATALOGUES.has(catalogue);
}

/** ILIKE pattern: %user% with %, _, \ escaped (PostgreSQL ESCAPE '\\'). */
function masterdataSearchPattern(raw) {
  const t = String(raw || '')
    .trim()
    .slice(0, 200);
  if (!t) return null;
  const esc = t.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
  return `%${esc}%`;
}

/**
 * Extra WHERE fragment using $3 for the search pattern (LIMIT $1 OFFSET $2 on list query).
 */
function masterdataSearchSqlFragment(catalogue, patternParamIndex = 3) {
  const p = `$${patternParamIndex}`;
  const esc = "ESCAPE '\\'";
  if (catalogue === 'crop_catalogue') {
    return ` AND (
      COALESCE(variety_name, '') ILIKE ${p} ${esc}
      OR COALESCE(crop_name, '') ILIKE ${p} ${esc}
      OR COALESCE(producer_name, '') ILIKE ${p} ${esc}
      OR COALESCE(seed_supply_notes, '') ILIKE ${p} ${esc}
      OR COALESCE(source_system, '') ILIKE ${p} ${esc}
      OR COALESCE(source_record_key, '') ILIKE ${p} ${esc}
      OR attributes::text ILIKE ${p} ${esc}
    )`;
  }
  if (catalogue === 'location_catalogue') {
    return ` AND (
      COALESCE(level, '') ILIKE ${p} ${esc}
      OR COALESCE(p_code, '') ILIKE ${p} ${esc}
      OR COALESCE(name, '') ILIKE ${p} ${esc}
      OR COALESCE(parent_p_code, '') ILIKE ${p} ${esc}
      OR COALESCE(source_system, '') ILIKE ${p} ${esc}
      OR COALESCE(source_record_key, '') ILIKE ${p} ${esc}
      OR attributes::text ILIKE ${p} ${esc}
    )`;
  }
  if (catalogue === 'livestock_catalogue') {
    return ` AND (
      COALESCE(species_common_name, '') ILIKE ${p} ${esc}
      OR COALESCE(species_scientific_name, '') ILIKE ${p} ${esc}
      OR COALESCE(production_program, '') ILIKE ${p} ${esc}
      OR COALESCE(animal_health_program, '') ILIKE ${p} ${esc}
      OR COALESCE(commercialization_program, '') ILIKE ${p} ${esc}
      OR COALESCE(source_system, '') ILIKE ${p} ${esc}
      OR COALESCE(source_record_key, '') ILIKE ${p} ${esc}
      OR attributes::text ILIKE ${p} ${esc}
    )`;
  }
  return '';
}

/**
 * @param {string} catalogue
 * @param {{ limit: number, offset: number, q?: string }} opts
 * @returns {Promise<{ rows: object[], total: number, limit: number, offset: number, qEcho: string }>}
 */
async function listMasterdataRecords(catalogue, opts) {
  const table = tableForCatalogue(catalogue);
  if (!table) {
    const err = new Error('Invalid catalogue');
    err.statusCode = 400;
    throw err;
  }

  const limit = opts.limit;
  const offset = opts.offset;
  const searchPattern = masterdataSearchPattern(opts.q);

  const searchSql = searchPattern ? masterdataSearchSqlFragment(catalogue, 3) : '';
  const listParams = searchPattern ? [limit, offset, searchPattern] : [limit, offset];
  const result = await pool.query(
    `SELECT * FROM ${table}
     WHERE is_active = TRUE
     ${searchSql}
     ORDER BY updated_at DESC
     LIMIT $1 OFFSET $2`,
    listParams
  );
  const countParams = searchPattern ? [searchPattern] : [];
  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS n FROM ${table} WHERE is_active = TRUE ${searchSql}`,
    countParams
  );
  const total = countRes.rows[0]?.n ?? 0;
  const qEcho = searchPattern ? String(opts.q || '').trim().slice(0, 200) : '';

  return {
    rows: result.rows,
    total,
    limit,
    offset,
    qEcho,
  };
}

module.exports = {
  CATALOGUE_TABLE,
  tableForCatalogue,
  isPublicCatalogue,
  masterdataSearchPattern,
  masterdataSearchSqlFragment,
  listMasterdataRecords,
};
