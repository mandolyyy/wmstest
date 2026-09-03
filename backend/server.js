const express = require('express');
const cors = require('cors');

require('./db/index'); // initializes the SQLite database + schema on boot

const inboundRoutes = require('./routes/inbound');
const storageRoutes = require('./routes/storage');
const outboundRoutes = require('./routes/outbound');
const reportsRoutes = require('./routes/reports');
const itemsRoutes = require('./routes/items');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'wms-backend' }));

app.use('/api/inbound', inboundRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/outbound', outboundRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/items', itemsRoutes);

// Fallback 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`WMS backend listening on http://localhost:${PORT}`);
});
