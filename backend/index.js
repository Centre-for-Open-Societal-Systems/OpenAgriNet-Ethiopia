require('dotenv').config();
const express = require('express');
const cors = require('cors');
const usersRouter = require('./routes/users');
const masterdataRouter = require('./routes/masterdata');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api', usersRouter);
app.use('/api', masterdataRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'openagrinet-backend' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`OpenAgriNet backend listening on port ${PORT}`);
});
