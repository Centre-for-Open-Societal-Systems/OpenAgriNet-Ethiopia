const express = require('express');
const { listMasterdataRecords, isPublicCatalogue } = require('../services/masterdataRecordsService');

const router = express.Router();

/** Public read-only catalogue APIs (no authentication). */
router.get('/public/catalogues/:catalogue/records', async (req, res) => {
  const catalogue = req.params.catalogue;
  if (!isPublicCatalogue(catalogue)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid catalogue. Use crop_catalogue, location_catalogue, or livestock_catalogue.',
    });
  }

  const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 100);
  const offset = Math.max(Number(req.query.offset ?? 0), 0);

  try {
    const { rows, total, limit: lim, offset: off, qEcho } = await listMasterdataRecords(catalogue, {
      limit,
      offset,
      q: req.query.q,
    });
    res.set('Cache-Control', 'public, max-age=60');
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
    if (err.statusCode === 400) {
      return res.status(400).json({ success: false, error: err.message });
    }
    console.error('GET /api/public/catalogues/:catalogue/records error:', err);
    return res.status(500).json({ success: false, error: 'Unable to read catalogue records' });
  }
});

module.exports = router;
