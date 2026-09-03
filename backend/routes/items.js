const express = require('express');
const db = require('../db/index');

const router = express.Router();

// GET /api/items?status=stored&q=ITM
router.get('/', (req, res) => {
  const { status, q } = req.query;
  let sql = `
    SELECT i.*, b.bin_code
    FROM items i
    LEFT JOIN bins b ON b.id = i.bin_id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND i.status = ?'; params.push(status); }
  if (q) { sql += ' AND (i.item_code LIKE ? OR i.description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY i.created_at DESC LIMIT 200';
  res.json(db.prepare(sql).all(...params));
});

module.exports = router;
