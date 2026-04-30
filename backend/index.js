const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const inDocker = fs.existsSync('/.dockerenv');
if (!inDocker) {
  require('dotenv').config({ path: path.join(__dirname, '.env.local'), override: true });
}

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const usersRouter = require('./routes/users');
const masterdataRouter = require('./routes/masterdata');
const publicCataloguesRouter = require('./routes/publicCatalogues');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ✅ PostgreSQL (Odoo DB connection)

const odooPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// =========================
// ✅ GET (READ)
// =========================
app.get('/api/crop-registry', async (req, res) => {
  try {
    const result = await odooPool.query(
      `SELECT id, zone_name, woreda_name, kebele_name, land_id, land_area, owner_name, crop_name, crop_season 
       FROM g2p_crop_registry 
       ORDER BY id DESC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// =========================
// ✅ CREATE
// =========================
app.post('/api/crop-registry', async (req, res) => {
  try {
    const {
      zone_name,
      woreda_name,
      kebele_name,
      land_id,
      land_area,
      owner_name,
      crop_name,
      crop_season,
    } = req.body;

    const result = await odooPool.query(
      `INSERT INTO g2p_crop_registry 
      (zone_name, woreda_name, kebele_name, land_id, land_area, owner_name, crop_name, crop_season)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [zone_name, woreda_name, kebele_name, land_id, land_area, owner_name, crop_name, crop_season]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// =========================
// ✅ UPDATE
// =========================
app.put('/api/crop-registry/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      zone_name,
      woreda_name,
      kebele_name,
      land_id,
      land_area,
      owner_name,
      crop_name,
      crop_season,
    } = req.body;

    const result = await odooPool.query(
      `UPDATE g2p_crop_registry SET
        zone_name=$1,
        woreda_name=$2,
        kebele_name=$3,
        land_id=$4,
        land_area=$5,
        owner_name=$6,
        crop_name=$7,
        crop_season=$8
      WHERE id=$9
      RETURNING *`,
      [zone_name, woreda_name, kebele_name, land_id, land_area, owner_name, crop_name, crop_season, id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// =========================
// ✅ DELETE
// =========================
app.delete('/api/crop-registry/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await odooPool.query(
      'DELETE FROM g2p_crop_registry WHERE id = $1',
      [id]
    );

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// =========================
// Other routes
// =========================
app.use('/api', publicCataloguesRouter);
app.use('/api', usersRouter);
app.use('/api', masterdataRouter);


// =========================
// Health check
// =========================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'openagrinet-backend' });
});


// =========================
// Server start
// =========================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`OpenAgriNet backend listening on port ${PORT}`);
});
