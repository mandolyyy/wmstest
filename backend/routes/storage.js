const express = require('express');
const db = require('../db/index');
const { addLog } = require('../db/log');

const router = express.Router();

// ---------- ZONES ----------
router.get('/zones', (req, res) => {
  res.json(db.prepare('SELECT * FROM zones ORDER BY name').all());
});

router.post('/zones', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Zone name is required.' });
  try {
    const info = db.prepare('INSERT INTO zones (name) VALUES (?)').run(name.trim());
    res.status(201).json({ id: info.lastInsertRowid, name: name.trim() });
  } catch (e) {
    res.status(409).json({ error: 'A zone with that name already exists.' });
  }
});

router.delete('/zones/:id', (req, res) => {
  db.prepare('DELETE FROM zones WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- AISLES ----------
router.get('/aisles', (req, res) => {
  const { zone_id } = req.query;
  const rows = zone_id
    ? db.prepare('SELECT * FROM aisles WHERE zone_id = ? ORDER BY name').all(zone_id)
    : db.prepare('SELECT * FROM aisles ORDER BY name').all();
  res.json(rows);
});

router.post('/aisles', (req, res) => {
  const { zone_id, name } = req.body;
  if (!zone_id || !name || !name.trim()) return res.status(400).json({ error: 'zone_id and name are required.' });
  try {
    const info = db.prepare('INSERT INTO aisles (zone_id, name) VALUES (?, ?)').run(zone_id, name.trim());
    res.status(201).json({ id: info.lastInsertRowid, zone_id, name: name.trim() });
  } catch (e) {
    res.status(409).json({ error: 'An aisle with that name already exists in this zone.' });
  }
});

router.delete('/aisles/:id', (req, res) => {
  db.prepare('DELETE FROM aisles WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- RACKS ----------
router.get('/racks', (req, res) => {
  const { aisle_id } = req.query;
  const rows = aisle_id
    ? db.prepare('SELECT * FROM racks WHERE aisle_id = ? ORDER BY name').all(aisle_id)
    : db.prepare('SELECT * FROM racks ORDER BY name').all();
  res.json(rows);
});

router.post('/racks', (req, res) => {
  const { aisle_id, name } = req.body;
  if (!aisle_id || !name || !name.trim()) return res.status(400).json({ error: 'aisle_id and name are required.' });
  try {
    const info = db.prepare('INSERT INTO racks (aisle_id, name) VALUES (?, ?)').run(aisle_id, name.trim());
    res.status(201).json({ id: info.lastInsertRowid, aisle_id, name: name.trim() });
  } catch (e) {
    res.status(409).json({ error: 'A rack with that name already exists in this aisle.' });
  }
});

router.delete('/racks/:id', (req, res) => {
  db.prepare('DELETE FROM racks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- SHELVES ----------
router.get('/shelves', (req, res) => {
  const { rack_id } = req.query;
  const rows = rack_id
    ? db.prepare('SELECT * FROM shelves WHERE rack_id = ? ORDER BY name').all(rack_id)
    : db.prepare('SELECT * FROM shelves ORDER BY name').all();
  res.json(rows);
});

router.post('/shelves', (req, res) => {
  const { rack_id, name } = req.body;
  if (!rack_id || !name || !name.trim()) return res.status(400).json({ error: 'rack_id and name are required.' });
  try {
    const info = db.prepare('INSERT INTO shelves (rack_id, name) VALUES (?, ?)').run(rack_id, name.trim());
    res.status(201).json({ id: info.lastInsertRowid, rack_id, name: name.trim() });
  } catch (e) {
    res.status(409).json({ error: 'A shelf with that name already exists in this rack.' });
  }
});

router.delete('/shelves/:id', (req, res) => {
  db.prepare('DELETE FROM shelves WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- BINS ----------
router.get('/bins', (req, res) => {
  const { shelf_id, status } = req.query;
  let sql = `
    SELECT b.*, s.name AS shelf_name, r.name AS rack_name, a.name AS aisle_name, z.name AS zone_name,
           i.item_code AS current_item_code
    FROM bins b
    JOIN shelves s ON s.id = b.shelf_id
    JOIN racks r ON r.id = s.rack_id
    JOIN aisles a ON a.id = r.aisle_id
    JOIN zones z ON z.id = a.zone_id
    LEFT JOIN items i ON i.id = b.current_item_id
    WHERE 1=1
  `;
  const params = [];
  if (shelf_id) { sql += ' AND b.shelf_id = ?'; params.push(shelf_id); }
  if (status) { sql += ' AND b.status = ?'; params.push(status); }
  sql += ' ORDER BY b.bin_code';
  res.json(db.prepare(sql).all(...params));
});

router.post('/bins', (req, res) => {
  const { shelf_id, bin_code, max_weight, max_length, max_width, max_height } = req.body;
  if (!shelf_id || !bin_code || !bin_code.trim() ||
      max_weight == null || max_length == null || max_width == null || max_height == null) {
    return res.status(400).json({ error: 'shelf_id, bin_code and all max dimensions/weight are required.' });
  }
  try {
    const info = db.prepare(`
      INSERT INTO bins (shelf_id, bin_code, max_weight, max_length, max_width, max_height)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(shelf_id, bin_code.trim(), max_weight, max_length, max_width, max_height);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (e) {
    res.status(409).json({ error: 'A bin with that code already exists.' });
  }
});

router.delete('/bins/:id', (req, res) => {
  const bin = db.prepare('SELECT * FROM bins WHERE id = ?').get(req.params.id);
  if (bin && bin.status === 'occupied') {
    return res.status(400).json({ error: 'Cannot delete a bin that currently holds an item.' });
  }
  db.prepare('DELETE FROM bins WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- FULL TREE (Zone -> Aisle -> Rack -> Shelf -> Bin) ----------
router.get('/tree', (req, res) => {
  const zones = db.prepare('SELECT * FROM zones ORDER BY name').all();
  const aisles = db.prepare('SELECT * FROM aisles ORDER BY name').all();
  const racks = db.prepare('SELECT * FROM racks ORDER BY name').all();
  const shelves = db.prepare('SELECT * FROM shelves ORDER BY name').all();
  const bins = db.prepare(`
    SELECT b.*, i.item_code AS current_item_code
    FROM bins b LEFT JOIN items i ON i.id = b.current_item_id
    ORDER BY b.bin_code
  `).all();

  const tree = zones.map((z) => ({
    ...z,
    aisles: aisles.filter((a) => a.zone_id === z.id).map((a) => ({
      ...a,
      racks: racks.filter((r) => r.aisle_id === a.id).map((r) => ({
        ...r,
        shelves: shelves.filter((s) => s.rack_id === r.id).map((s) => ({
          ...s,
          bins: bins.filter((b) => b.shelf_id === s.id),
        })),
      })),
    })),
  }));

  res.json(tree);
});

module.exports = router;
