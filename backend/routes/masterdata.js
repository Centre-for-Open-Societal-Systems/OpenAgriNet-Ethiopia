const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db/pool');
const { authRequired, requireAdmin } = require('../middleware/auth');
const { runMasterdataSync } = require('../services/masterdataSync');
const { sha256Hex, stableStringify } = require('../services/rowHash');
const { tableForCatalogue, listMasterdataRecords } = require('../services/masterdataRecordsService');

const router = express.Router();

const LOCAL_SOURCE = 'local.openagri.net';

function parseJsonBodyField(val, fallback) {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'object' && !Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const t = val.trim();
    if (!t) return fallback;
    try {
      return JSON.parse(t);
    } catch {
      const err = new Error('Invalid JSON in request body');
      err.statusCode = 400;
      throw err;
    }
  }
  return val;
}

function cropRowHash(fields) {
  return sha256Hex(
    stableStringify({
      varietyName: fields.variety_name,
      cropName: fields.crop_name,
      seedSupplyNotes: fields.seed_supply_notes,
      producerName: fields.producer_name,
      attributes: fields.attributes,
    })
  );
}

function locationRowHash(fields) {
  return sha256Hex(
    stableStringify({
      level: fields.level,
      pCode: fields.p_code,
      name: fields.name,
      parentPCode: fields.parent_p_code,
      geometry: fields.geometry_geojson,
    })
  );
}

function livestockRowHash(fields) {
  return sha256Hex(
    stableStringify({
      speciesCommonName: fields.species_common_name,
      speciesScientificName: fields.species_scientific_name,
      productionProgram: fields.production_program,
      animalHealthProgram: fields.animal_health_program,
      commercializationProgram: fields.commercialization_program,
      attributes: fields.attributes,
    })
  );
}

function validateCatalogue(catalogue) {
  const allowed = ['crop_catalogue', 'location_catalogue', 'livestock_catalogue', 'all'];
  if (!allowed.includes(catalogue)) return null;
  return catalogue;
}

function viewNameFor(catalogue) {
  if (catalogue === 'crop_catalogue') return 'vw_admin_master_crop_seed_varieties';
  if (catalogue === 'location_catalogue') return 'vw_admin_master_location_administrative_boundaries';
  if (catalogue === 'livestock_catalogue') return 'vw_admin_master_livestock_catalogue';
  return null;
}

router.post('/masterdata/sync', authRequired, requireAdmin, async (req, res) => {
  const catalogue = validateCatalogue(req.body?.catalogue || 'all') || 'all';

  try {
    const job = await pool.query(
      `INSERT INTO masterdata_sync_jobs (catalogue, status, source_query)
       VALUES ($1, 'running', $2)
       RETURNING _id, catalogue, started_at`,
      [catalogue, req.body?.sourceQuery ? req.body.sourceQuery : req.body || {}]
    );

    const jobId = job.rows[0]._id;

    const startedAt = Date.now();
    let result;
    try {
      result = await runMasterdataSync(catalogue);
    } catch (err) {
      await pool.query(
        `UPDATE masterdata_sync_jobs
         SET status = 'failed', finished_at = now(), last_error = $2, updated_at = now()
         WHERE _id = $1`,
        [jobId, err && err.message ? err.message : String(err)]
      );
      return res.status(500).json({ success: false, error: 'Sync failed', jobId });
    }

    // Persist job outcome.
    const updatePayload = (() => {
      if (catalogue === 'all') {
        return {
          inserted: (result.crop?.insertedCount || 0) + (result.loc?.insertedCount || 0) + (result.livestock?.insertedCount || 0),
          updated: (result.crop?.updatedCount || 0) + (result.loc?.updatedCount || 0) + (result.livestock?.updatedCount || 0),
        };
      }
      return { inserted: result.insertedCount || 0, updated: result.updatedCount || 0 };
    })();

    await pool.query(
      `UPDATE masterdata_sync_jobs
       SET status = 'success',
           finished_at = now(),
           inserted_count = $2,
           updated_count = $3,
           updated_at = now()
       WHERE _id = $1`,
      [jobId, updatePayload.inserted, updatePayload.updated]
    );

    return res.json({
      success: true,
      jobId,
      catalogue,
      elapsed_ms: Date.now() - startedAt,
      result,
    });
  } catch (err) {
    console.error('POST /api/masterdata/sync error:', err);
    return res.status(500).json({ success: false, error: 'Unable to start sync' });
  }
});

// Admin-only: read master catalogues for frontend rendering.
router.get('/masterdata/:catalogue', authRequired, requireAdmin, async (req, res) => {
  const catalogue = validateCatalogue(req.params.catalogue);
  if (!catalogue || catalogue === 'all') {
    return res.status(400).json({ success: false, error: 'Invalid catalogue' });
  }

  const view = viewNameFor(catalogue);
  if (!view) {
    return res.status(500).json({ success: false, error: 'No view configured for catalogue' });
  }

  const limit = Math.min(Number(req.query.limit || 100), 500);
  const offset = Math.max(Number(req.query.offset || 0), 0);

  try {
    const result = await pool.query(
      `SELECT * FROM ${view}
       ORDER BY updated_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return res.json({ success: true, catalogue, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error('GET /api/masterdata/:catalogue error:', err);
    return res.status(500).json({ success: false, error: 'Unable to read catalogue' });
  }
});

// Admin-only: sync job status
router.get('/masterdata/sync-jobs/:jobId', authRequired, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM masterdata_sync_jobs WHERE _id = $1`,
      [req.params.jobId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    return res.json({ success: true, job: result.rows[0] });
  } catch (err) {
    console.error('GET /api/masterdata/sync-jobs/:jobId error:', err);
    return res.status(500).json({ success: false, error: 'Unable to read job' });
  }
});

// Admin CRUD: full rows (for UI) — sync remains upsert-by-source-key; local rows use LOCAL_SOURCE.
router.get('/masterdata/:catalogue/records', authRequired, requireAdmin, async (req, res) => {
  const catalogue = validateCatalogue(req.params.catalogue);
  if (!catalogue || catalogue === 'all') {
    return res.status(400).json({ success: false, error: 'Invalid catalogue' });
  }
  if (!tableForCatalogue(catalogue)) {
    return res.status(400).json({ success: false, error: 'Invalid catalogue' });
  }

  const limit = Math.min(Number(req.query.limit || 200), 500);
  const offset = Math.max(Number(req.query.offset || 0), 0);

  try {
    const { rows, total, limit: lim, offset: off, qEcho } = await listMasterdataRecords(catalogue, {
      limit,
      offset,
      q: req.query.q,
    });
    return res.json({
      success: true,
      catalogue,
      count: rows.length,
      total,
      data: rows,
      limit: lim,
      offset: off,
      q: qEcho,
    });
  } catch (err) {
    console.error('GET /api/masterdata/:catalogue/records error:', err);
    return res.status(500).json({ success: false, error: 'Unable to read records' });
  }
});

router.post('/masterdata/:catalogue/records', authRequired, requireAdmin, async (req, res) => {
  const catalogue = validateCatalogue(req.params.catalogue);
  if (!catalogue || catalogue === 'all') {
    return res.status(400).json({ success: false, error: 'Invalid catalogue' });
  }
  const table = tableForCatalogue(catalogue);
  if (!table) {
    return res.status(400).json({ success: false, error: 'Invalid catalogue' });
  }

  const b = req.body || {};

  try {
    if (catalogue === 'crop_catalogue') {
      const attributes = parseJsonBodyField(b.attributes, {});
      const variety_name = b.variety_name != null ? String(b.variety_name) : null;
      const crop_name = b.crop_name != null ? String(b.crop_name) : null;
      const producer_name = b.producer_name != null ? String(b.producer_name) : null;
      const seed_supply_notes = b.seed_supply_notes != null ? String(b.seed_supply_notes) : null;
      const source_record_key = b.source_record_key != null ? String(b.source_record_key) : crypto.randomUUID();
      const row_hash = cropRowHash({
        variety_name,
        crop_name,
        producer_name,
        seed_supply_notes,
        attributes,
      });
      const ins = await pool.query(
        `INSERT INTO master_crop_seed_varieties
           (source_system, source_catalogue, source_record_key, variety_name, crop_name, producer_name, seed_supply_notes,
            attributes, row_hash, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE)
         RETURNING *`,
        [LOCAL_SOURCE, catalogue, source_record_key, variety_name, crop_name, producer_name, seed_supply_notes, attributes, row_hash]
      );
      return res.status(201).json({ success: true, data: ins.rows[0] });
    }

    if (catalogue === 'location_catalogue') {
      const attributes = parseJsonBodyField(b.attributes, {});
      const geometry_geojson = parseJsonBodyField(b.geometry_geojson, null);
      const level = b.level != null ? String(b.level) : 'woreda';
      const p_code = b.p_code != null ? String(b.p_code) : null;
      const name = b.name != null ? String(b.name) : null;
      const parent_p_code = b.parent_p_code != null ? String(b.parent_p_code) : null;
      const source_record_key =
        b.source_record_key != null ? String(b.source_record_key) : p_code || crypto.randomUUID();
      const row_hash = locationRowHash({ level, p_code, name, parent_p_code, geometry_geojson });
      const ins = await pool.query(
        `INSERT INTO master_location_administrative_boundaries
           (source_system, source_catalogue, source_record_key, level, p_code, name, parent_p_code,
            geometry_geojson, attributes, row_hash, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)
         RETURNING *`,
        [LOCAL_SOURCE, catalogue, source_record_key, level, p_code, name, parent_p_code, geometry_geojson, attributes, row_hash]
      );
      return res.status(201).json({ success: true, data: ins.rows[0] });
    }

    if (catalogue === 'livestock_catalogue') {
      const attributes = parseJsonBodyField(b.attributes, {});
      const species_common_name = b.species_common_name != null ? String(b.species_common_name) : null;
      const species_scientific_name = b.species_scientific_name != null ? String(b.species_scientific_name) : null;
      const production_program = b.production_program != null ? String(b.production_program) : null;
      const animal_health_program = b.animal_health_program != null ? String(b.animal_health_program) : null;
      const commercialization_program = b.commercialization_program != null ? String(b.commercialization_program) : null;
      const source_record_key = b.source_record_key != null ? String(b.source_record_key) : crypto.randomUUID();
      const row_hash = livestockRowHash({
        species_common_name,
        species_scientific_name,
        production_program,
        animal_health_program,
        commercialization_program,
        attributes,
      });
      const ins = await pool.query(
        `INSERT INTO master_livestock_catalogue
           (source_system, source_catalogue, source_record_key,
            species_common_name, species_scientific_name,
            production_program, animal_health_program, commercialization_program,
            attributes, row_hash, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)
         RETURNING *`,
        [
          LOCAL_SOURCE,
          catalogue,
          source_record_key,
          species_common_name,
          species_scientific_name,
          production_program,
          animal_health_program,
          commercialization_program,
          attributes,
          row_hash,
        ]
      );
      return res.status(201).json({ success: true, data: ins.rows[0] });
    }
  } catch (err) {
    if (err && err.statusCode === 400) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (err && err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Duplicate source_record_key for this source' });
    }
    console.error('POST /api/masterdata/:catalogue/records error:', err);
    return res.status(500).json({ success: false, error: 'Unable to create record' });
  }

  return res.status(500).json({ success: false, error: 'Unable to create record' });
});

router.put('/masterdata/:catalogue/records/:id', authRequired, requireAdmin, async (req, res) => {
  const catalogue = validateCatalogue(req.params.catalogue);
  if (!catalogue || catalogue === 'all') {
    return res.status(400).json({ success: false, error: 'Invalid catalogue' });
  }
  const table = tableForCatalogue(catalogue);
  if (!table) {
    return res.status(400).json({ success: false, error: 'Invalid catalogue' });
  }

  const b = req.body || {};

  try {
    if (catalogue === 'crop_catalogue') {
      const attributes = parseJsonBodyField(b.attributes, {});
      const variety_name = b.variety_name != null ? String(b.variety_name) : null;
      const crop_name = b.crop_name != null ? String(b.crop_name) : null;
      const producer_name = b.producer_name != null ? String(b.producer_name) : null;
      const seed_supply_notes = b.seed_supply_notes != null ? String(b.seed_supply_notes) : null;
      const row_hash = cropRowHash({
        variety_name,
        crop_name,
        producer_name,
        seed_supply_notes,
        attributes,
      });
      const upd = await pool.query(
        `UPDATE master_crop_seed_varieties SET
           variety_name = $2,
           crop_name = $3,
           producer_name = $4,
           seed_supply_notes = $5,
           attributes = $6,
           row_hash = $7,
           updated_at = now()
         WHERE _id = $1 AND is_active = TRUE
         RETURNING *`,
        [req.params.id, variety_name, crop_name, producer_name, seed_supply_notes, attributes, row_hash]
      );
      if (!upd.rows.length) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }
      return res.json({ success: true, data: upd.rows[0] });
    }

    if (catalogue === 'location_catalogue') {
      const attributes = parseJsonBodyField(b.attributes, {});
      const geometry_geojson = parseJsonBodyField(b.geometry_geojson, null);
      const level = b.level != null ? String(b.level) : 'woreda';
      const p_code = b.p_code != null ? String(b.p_code) : null;
      const name = b.name != null ? String(b.name) : null;
      const parent_p_code = b.parent_p_code != null ? String(b.parent_p_code) : null;
      const row_hash = locationRowHash({ level, p_code, name, parent_p_code, geometry_geojson });
      const upd = await pool.query(
        `UPDATE master_location_administrative_boundaries SET
           level = $2,
           p_code = $3,
           name = $4,
           parent_p_code = $5,
           geometry_geojson = $6,
           attributes = $7,
           row_hash = $8,
           updated_at = now()
         WHERE _id = $1 AND is_active = TRUE
         RETURNING *`,
        [req.params.id, level, p_code, name, parent_p_code, geometry_geojson, attributes, row_hash]
      );
      if (!upd.rows.length) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }
      return res.json({ success: true, data: upd.rows[0] });
    }

    if (catalogue === 'livestock_catalogue') {
      const attributes = parseJsonBodyField(b.attributes, {});
      const species_common_name = b.species_common_name != null ? String(b.species_common_name) : null;
      const species_scientific_name = b.species_scientific_name != null ? String(b.species_scientific_name) : null;
      const production_program = b.production_program != null ? String(b.production_program) : null;
      const animal_health_program = b.animal_health_program != null ? String(b.animal_health_program) : null;
      const commercialization_program = b.commercialization_program != null ? String(b.commercialization_program) : null;
      const row_hash = livestockRowHash({
        species_common_name,
        species_scientific_name,
        production_program,
        animal_health_program,
        commercialization_program,
        attributes,
      });
      const upd = await pool.query(
        `UPDATE master_livestock_catalogue SET
           species_common_name = $2,
           species_scientific_name = $3,
           production_program = $4,
           animal_health_program = $5,
           commercialization_program = $6,
           attributes = $7,
           row_hash = $8,
           updated_at = now()
         WHERE _id = $1 AND is_active = TRUE
         RETURNING *`,
        [
          req.params.id,
          species_common_name,
          species_scientific_name,
          production_program,
          animal_health_program,
          commercialization_program,
          attributes,
          row_hash,
        ]
      );
      if (!upd.rows.length) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }
      return res.json({ success: true, data: upd.rows[0] });
    }
  } catch (err) {
    if (err && err.statusCode === 400) {
      return res.status(400).json({ success: false, error: err.message });
    }
    console.error('PUT /api/masterdata/:catalogue/records/:id error:', err);
    return res.status(500).json({ success: false, error: 'Unable to update record' });
  }

  return res.status(500).json({ success: false, error: 'Unable to update record' });
});

router.delete('/masterdata/:catalogue/records/:id', authRequired, requireAdmin, async (req, res) => {
  const catalogue = validateCatalogue(req.params.catalogue);
  if (!catalogue || catalogue === 'all') {
    return res.status(400).json({ success: false, error: 'Invalid catalogue' });
  }
  const table = tableForCatalogue(catalogue);
  if (!table) {
    return res.status(400).json({ success: false, error: 'Invalid catalogue' });
  }

  try {
    const del = await pool.query(`DELETE FROM ${table} WHERE _id = $1 RETURNING _id`, [req.params.id]);
    if (!del.rows.length) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    return res.json({ success: true, deletedId: del.rows[0]._id });
  } catch (err) {
    console.error('DELETE /api/masterdata/:catalogue/records/:id error:', err);
    return res.status(500).json({ success: false, error: 'Unable to delete record' });
  }
});

function isAllowedConfigKey(configKey) {
  return ['ckan_base_url', 'datahub_base_url', 'ethioseed_base_url', 'ethionsdi_wfs_base_url'].includes(configKey);
}

// Admin-only: read current masterdata base URLs configuration
router.get('/masterdata/config', authRequired, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT config_group, config_key, config_value, description, is_active, updated_at
       FROM vw_admin_app_configuration
       ORDER BY config_key ASC`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /api/masterdata/config error:', err);
    return res.status(500).json({ success: false, error: 'Unable to read configuration' });
  }
});

// Admin-only: update masterdata base URLs configuration
// Body:
// { "updates": [ { "config_key": "ckan_base_url", "config_value": "https://..." } ] }
router.put('/masterdata/config', authRequired, requireAdmin, async (req, res) => {
  try {
    const updates = Array.isArray(req.body?.updates) ? req.body.updates : [];
    if (!updates.length) {
      return res.status(400).json({ success: false, error: 'Missing updates array' });
    }

    const cleaned = [];
    for (const u of updates) {
      if (!u || !u.config_key || typeof u.config_key !== 'string') continue;
      if (!isAllowedConfigKey(u.config_key)) continue;
      if (u.config_value === undefined || u.config_value === null) continue;
      cleaned.push({ key: u.config_key, value: String(u.config_value) });
    }

    if (!cleaned.length) {
      return res.status(400).json({ success: false, error: 'No valid configuration updates' });
    }

    await pool.query('BEGIN');
    try {
      for (const u of cleaned) {
        await pool.query(
          `INSERT INTO app_configuration (config_group, config_key, config_value, description, is_active)
           VALUES ('masterdata', $1, $2, NULL, TRUE)
           ON CONFLICT (config_group, config_key)
           DO UPDATE SET
             config_value = EXCLUDED.config_value,
             is_active = TRUE,
             updated_at = now()`,
          [u.key, u.value]
        );
      }
      await pool.query('COMMIT');
    } catch (e) {
      await pool.query('ROLLBACK');
      throw e;
    }

    const result = await pool.query(
      `SELECT config_group, config_key, config_value, description, is_active, updated_at
       FROM vw_admin_app_configuration
       ORDER BY config_key ASC`
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('PUT /api/masterdata/config error:', err);
    return res.status(500).json({ success: false, error: 'Unable to update configuration' });
  }
});

module.exports = router;

