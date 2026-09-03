const express = require('express');
const db = require('../db/index');
const { addLog } = require('../db/log');

const router = express.Router();

function nextItemCode() {
  const row = db.prepare("SELECT COUNT(*) AS n FROM items").get();
  const n = row.n + 1;
  return `ITM-${String(n).padStart(6, '0')}`;
}

// Find the smallest empty bin that can fit the item (best-fit by volume).
function findBestFitBin({ weight, length, width, height }) {
  return db.prepare(`
    SELECT * FROM bins
    WHERE status = 'empty'
      AND max_weight >= ?
      AND max_length >= ?
      AND max_width >= ?
      AND max_height >= ?
    ORDER BY (max_length * max_width * max_height) ASC
    LIMIT 1
  `).get(weight, length, width, height);
}

// GET /api/inbound - list all inbound item records
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT i.*, b.bin_code
    FROM items i
    LEFT JOIN bins b ON b.id = i.bin_id
    ORDER BY i.created_at DESC
  `).all();
  res.json(rows);
});

// POST /api/inbound - receive a new item
// body: { weight, length, width, height, description, user_id, datetime? }
router.post('/', (req, res) => {
  const { weight, length, width, height, description = '', user_id, datetime } = req.body;

  if ([weight, length, width, height].some((v) => v == null || isNaN(v) || Number(v) <= 0)) {
    return res.status(400).json({ error: 'weight, length, width and height must be positive numbers.' });
  }
  if (!user_id || !user_id.trim()) {
    return res.status(400).json({ error: 'user_id is required.' });
  }

  const createdAt = datetime ? new Date(datetime).toISOString() : new Date().toISOString();
  const itemCode = nextItemCode();

  const tx = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO items (item_code, description, weight, length, width, height, status, created_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'inbound', ?, ?)
    `).run(itemCode, description, weight, length, width, height, createdAt, user_id.trim());

    const itemId = info.lastInsertRowid;

    addLog({
      item_id: itemId,
      action: 'INBOUND_RECEIVED',
      details: `Item ${itemCode} received: ${weight}kg, ${length}x${width}x${height}cm`,
      user_id: user_id.trim(),
      created_at: createdAt,
    });

    const bin = findBestFitBin({ weight, length, width, height });

    if (bin) {
      db.prepare("UPDATE bins SET status = 'occupied', current_item_id = ? WHERE id = ?").run(itemId, bin.id);
      db.prepare("UPDATE items SET status = 'stored', bin_id = ? WHERE id = ?").run(bin.id, itemId);
      addLog({
        item_id: itemId,
        action: 'BIN_ASSIGNED',
        details: `Assigned to bin ${bin.bin_code}`,
        user_id: user_id.trim(),
        created_at: createdAt,
      });
    } else {
      addLog({
        item_id: itemId,
        action: 'BIN_UNAVAILABLE',
        details: 'No empty bin currently fits this item\'s weight/dimensions.',
        user_id: user_id.trim(),
        created_at: createdAt,
      });
    }

    return db.prepare(`
      SELECT i.*, b.bin_code
      FROM items i LEFT JOIN bins b ON b.id = i.bin_id
      WHERE i.id = ?
    `).get(itemId);
  });

  try {
    const item = tx();
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
