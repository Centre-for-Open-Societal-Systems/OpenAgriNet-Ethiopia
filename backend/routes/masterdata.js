const express = require('express');
const { pool } = require('../db/pool');
const { authRequired, requireAdmin } = require('../middleware/auth');
const { runMasterdataSync } = require('../services/masterdataSync');

const router = express.Router();

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

function isAllowedConfigKey(configKey) {
  return ['ckan_base_url', 'ethioseed_base_url', 'ethionsdi_wfs_base_url'].includes(configKey);
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

