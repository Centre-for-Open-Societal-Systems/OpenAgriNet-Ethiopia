const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
// Host-only overrides (gitignored). Skip inside Docker so compose env wins over mounted files.
const inDocker = fs.existsSync('/.dockerenv');
if (!inDocker) {
  require('dotenv').config({ path: path.join(__dirname, '.env.local'), override: true });
}
const express = require('express');
const cors = require('cors');
const usersRouter = require('./routes/users');
const masterdataRouter = require('./routes/masterdata');
const publicCataloguesRouter = require('./routes/publicCatalogues');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api', publicCataloguesRouter);
app.use('/api', usersRouter);
app.use('/api', masterdataRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'openagrinet-backend' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`OpenAgriNet backend listening on port ${PORT}`);
});
