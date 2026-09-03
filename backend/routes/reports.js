const express = require('express');
const db = require('../db/index');

const router = express.Router();

// GET /api/reports/logs - global log feed (filterable by item_code / action / user_id)
router.get('/logs', (req, res) => {
  const { item_code, action, user_id, limit = 500 } = req.query;
  let sql = `
    SELECT l.*, i.item_code
    FROM logs l
    LEFT JOIN items i ON i.id = l.item_id
    WHERE 1=1
  `;
  const params = [];
  if (item_code) { sql += ' AND i.item_code LIKE ?'; params.push(`%${item_code}%`); }
  if (action) { sql += ' AND l.action = ?'; params.push(action); }
  if (user_id) { sql += ' AND l.user_id LIKE ?'; params.push(`%${user_id}%`); }
  sql += ' ORDER BY l.created_at DESC, l.id DESC LIMIT ?';
  params.push(Number(limit));
  res.json(db.prepare(sql).all(...params));
});

// GET /api/reports/item/:idOrCode - full item detail + its complete audit trail
router.get('/item/:idOrCode', (req, res) => {
  const key = req.params.idOrCode;
  const item = /^\d+$/.test(key)
    ? db.prepare('SELECT * FROM items WHERE id = ?').get(key)
    : db.prepare('SELECT * FROM items WHERE item_code = ?').get(key);

  if (!item) return res.status(404).json({ error: 'Item not found.' });

  const bin = item.bin_id
    ? db.prepare(`
        SELECT b.*, s.name AS shelf_name, r.name AS rack_name, a.name AS aisle_name, z.name AS zone_name
        FROM bins b
        JOIN shelves s ON s.id = b.shelf_id
        JOIN racks r ON r.id = s.rack_id
        JOIN aisles a ON a.id = r.aisle_id
        JOIN zones z ON z.id = a.zone_id
        WHERE b.id = ?
      `).get(item.bin_id)
    : null;

  const logs = db.prepare(`
    SELECT * FROM logs WHERE item_id = ? ORDER BY created_at ASC, id ASC
  `).all(item.id);

  const outboundHistory = db.prepare(`
    SELECT * FROM outbound_requests WHERE item_id = ? ORDER BY requested_at ASC
  `).all(item.id);

  res.json({ item, bin, logs, outboundHistory });
});

// GET /api/reports/summary - dashboard counts
router.get('/summary', (req, res) => {
  const items = db.prepare(`
    SELECT status, COUNT(*) AS n FROM items GROUP BY status
  `).all();
  const bins = db.prepare(`
    SELECT status, COUNT(*) AS n FROM bins GROUP BY status
  `).all();
  const pendingOutbound = db.prepare(`
    SELECT COUNT(*) AS n FROM outbound_requests WHERE status = 'pending'
  `).get();
  res.json({ items, bins, pendingOutbound: pendingOutbound.n });
});

module.exports = router;
