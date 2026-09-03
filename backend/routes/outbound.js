const express = require('express');
const db = require('../db/index');
const { addLog } = require('../db/log');

const router = express.Router();

// GET /api/outbound/requests - list all outbound requests
router.get('/requests', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT r.*, i.item_code, i.description, i.status AS item_status, b.bin_code
    FROM outbound_requests r
    JOIN items i ON i.id = r.item_id
    LEFT JOIN bins b ON b.id = i.bin_id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND r.status = ?'; params.push(status); }
  sql += ' ORDER BY r.requested_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// POST /api/outbound/requests - create a pre-request for an item
// body: { item_id, user_id, datetime? }
router.post('/requests', (req, res) => {
  const { item_id, user_id, datetime } = req.body;
  if (!item_id || !user_id || !user_id.trim()) {
    return res.status(400).json({ error: 'item_id and user_id are required.' });
  }

  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(item_id);
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  if (item.status !== 'stored') {
    return res.status(400).json({ error: `Item is currently '${item.status}' and cannot be pre-requested for outbound.` });
  }

  const requestedAt = datetime ? new Date(datetime).toISOString() : new Date().toISOString();

  const tx = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO outbound_requests (item_id, requested_at, requested_by, status)
      VALUES (?, ?, ?, 'pending')
    `).run(item_id, requestedAt, user_id.trim());

    db.prepare("UPDATE items SET status = 'outbound_requested' WHERE id = ?").run(item_id);

    addLog({
      item_id,
      action: 'OUTBOUND_REQUESTED',
      details: `Pre-request created for item ${item.item_code}`,
      user_id: user_id.trim(),
      created_at: requestedAt,
    });

    return db.prepare('SELECT * FROM outbound_requests WHERE id = ?').get(info.lastInsertRowid);
  });

  try {
    res.status(201).json(tx());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/outbound/requests/:id/complete - fulfill the outbound (ship item, free bin)
// body: { user_id, datetime? }
router.post('/requests/:id/complete', (req, res) => {
  const { user_id, datetime } = req.body;
  if (!user_id || !user_id.trim()) return res.status(400).json({ error: 'user_id is required.' });

  const reqRow = db.prepare('SELECT * FROM outbound_requests WHERE id = ?').get(req.params.id);
  if (!reqRow) return res.status(404).json({ error: 'Outbound request not found.' });
  if (reqRow.status !== 'pending') return res.status(400).json({ error: `Request is already '${reqRow.status}'.` });

  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(reqRow.item_id);
  const completedAt = datetime ? new Date(datetime).toISOString() : new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE outbound_requests SET status = 'completed', completed_at = ?, completed_by = ? WHERE id = ?
    `).run(completedAt, user_id.trim(), reqRow.id);

    db.prepare("UPDATE items SET status = 'shipped' WHERE id = ?").run(item.id);

    if (item.bin_id) {
      db.prepare("UPDATE bins SET status = 'empty', current_item_id = NULL WHERE id = ?").run(item.bin_id);
    }

    addLog({
      item_id: item.id,
      action: 'OUTBOUND_COMPLETED',
      details: `Item ${item.item_code} shipped out; bin released.`,
      user_id: user_id.trim(),
      created_at: completedAt,
    });

    return db.prepare('SELECT * FROM outbound_requests WHERE id = ?').get(reqRow.id);
  });

  try {
    res.json(tx());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/outbound/requests/:id/cancel
router.post('/requests/:id/cancel', (req, res) => {
  const { user_id } = req.body;
  const reqRow = db.prepare('SELECT * FROM outbound_requests WHERE id = ?').get(req.params.id);
  if (!reqRow) return res.status(404).json({ error: 'Outbound request not found.' });
  if (reqRow.status !== 'pending') return res.status(400).json({ error: `Request is already '${reqRow.status}'.` });

  const tx = db.transaction(() => {
    db.prepare("UPDATE outbound_requests SET status = 'cancelled' WHERE id = ?").run(reqRow.id);
    db.prepare("UPDATE items SET status = 'stored' WHERE id = ?").run(reqRow.item_id);
    addLog({
      item_id: reqRow.item_id,
      action: 'OUTBOUND_CANCELLED',
      details: 'Outbound pre-request cancelled; item returned to stored status.',
      user_id: (user_id || 'system').trim(),
    });
  });

  try {
    tx();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
