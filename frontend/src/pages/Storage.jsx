import { useEffect, useState } from 'react';
import { api } from '../api.js';

function TreeBin({ bin }) {
  return (
    <div className="tree-label">
      <span className="tree-type">bin</span>
      <span className="tree-name mono">{bin.bin_code}</span>
      <span className="tree-meta">
        max {bin.max_weight}kg · {bin.max_length}×{bin.max_width}×{bin.max_height}cm ·{' '}
        {bin.status === 'occupied' ? `holds ${bin.current_item_code}` : 'empty'}
      </span>
    </div>
  );
}

export default function Storage() {
  const [tree, setTree] = useState([]);
  const [error, setError] = useState('');

  const [zoneName, setZoneName] = useState('');
  const [aisle, setAisle] = useState({ zone_id: '', name: '' });
  const [rack, setRack] = useState({ aisle_id: '', name: '' });
  const [shelf, setShelf] = useState({ rack_id: '', name: '' });
  const [bin, setBin] = useState({ shelf_id: '', bin_code: '', max_weight: '', max_length: '', max_width: '', max_height: '' });

  const load = () => api.getTree().then(setTree).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const flat = {
    zones: tree,
    aisles: tree.flatMap((z) => z.aisles.map((a) => ({ ...a, zoneName: z.name }))),
    racks: tree.flatMap((z) => z.aisles.flatMap((a) => a.racks.map((r) => ({ ...r, aisleName: a.name })))),
    shelves: tree.flatMap((z) => z.aisles.flatMap((a) => a.racks.flatMap((r) => r.shelves.map((s) => ({ ...s, rackName: r.name }))))),
  };

  const handle = (fn) => async (e) => {
    e.preventDefault();
    setError('');
    try {
      await fn();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const addZone = handle(async () => {
    if (!zoneName.trim()) return;
    await api.createZone({ name: zoneName });
    setZoneName('');
  });
  const addAisle = handle(async () => {
    if (!aisle.zone_id || !aisle.name.trim()) return;
    await api.createAisle(aisle);
    setAisle({ ...aisle, name: '' });
  });
  const addRack = handle(async () => {
    if (!rack.aisle_id || !rack.name.trim()) return;
    await api.createRack(rack);
    setRack({ ...rack, name: '' });
  });
  const addShelf = handle(async () => {
    if (!shelf.rack_id || !shelf.name.trim()) return;
    await api.createShelf(shelf);
    setShelf({ ...shelf, name: '' });
  });
  const addBin = handle(async () => {
    if (!bin.shelf_id || !bin.bin_code.trim()) return;
    await api.createBin({
      ...bin,
      max_weight: Number(bin.max_weight),
      max_length: Number(bin.max_length),
      max_width: Number(bin.max_width),
      max_height: Number(bin.max_height),
    });
    setBin({ ...bin, bin_code: '', max_weight: '', max_length: '', max_width: '', max_height: '' });
  });

  const del = {
    zone: handle(async (id) => api.deleteZone(id)),
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Storage setting</h1>
          <p>Define the physical hierarchy — Zone → Aisle → Rack → Shelf → Bin — and each bin's weight and dimension capacity.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head"><h2>Add to hierarchy</h2></div>
          <div className="panel-body">
            <div className="section-title">Zone</div>
            <form className="inline-form" onSubmit={addZone}>
              <input type="text" placeholder="e.g. Zone A" value={zoneName} onChange={(e) => setZoneName(e.target.value)} />
              <button className="btn btn-sm" type="submit">Add</button>
            </form>

            <div className="section-title">Aisle</div>
            <div className="field-row"><label>Parent zone</label>
              <select value={aisle.zone_id} onChange={(e) => setAisle({ ...aisle, zone_id: e.target.value })}>
                <option value="">Select zone…</option>
                {flat.zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <form className="inline-form" onSubmit={addAisle}>
              <input type="text" placeholder="e.g. Aisle 1" value={aisle.name} onChange={(e) => setAisle({ ...aisle, name: e.target.value })} />
              <button className="btn btn-sm" type="submit">Add</button>
            </form>

            <div className="section-title">Rack</div>
            <div className="field-row"><label>Parent aisle</label>
              <select value={rack.aisle_id} onChange={(e) => setRack({ ...rack, aisle_id: e.target.value })}>
                <option value="">Select aisle…</option>
                {flat.aisles.map((a) => <option key={a.id} value={a.id}>{a.zoneName} / {a.name}</option>)}
              </select>
            </div>
            <form className="inline-form" onSubmit={addRack}>
              <input type="text" placeholder="e.g. Rack 1" value={rack.name} onChange={(e) => setRack({ ...rack, name: e.target.value })} />
              <button className="btn btn-sm" type="submit">Add</button>
            </form>

            <div className="section-title">Shelf</div>
            <div className="field-row"><label>Parent rack</label>
              <select value={shelf.rack_id} onChange={(e) => setShelf({ ...shelf, rack_id: e.target.value })}>
                <option value="">Select rack…</option>
                {flat.racks.map((r) => <option key={r.id} value={r.id}>{r.aisleName} / {r.name}</option>)}
              </select>
            </div>
            <form className="inline-form" onSubmit={addShelf}>
              <input type="text" placeholder="e.g. Shelf 1" value={shelf.name} onChange={(e) => setShelf({ ...shelf, name: e.target.value })} />
              <button className="btn btn-sm" type="submit">Add</button>
            </form>

            <div className="section-title">Bin</div>
            <div className="field-row"><label>Parent shelf</label>
              <select value={bin.shelf_id} onChange={(e) => setBin({ ...bin, shelf_id: e.target.value })}>
                <option value="">Select shelf…</option>
                {flat.shelves.map((s) => <option key={s.id} value={s.id}>{s.rackName} / {s.name}</option>)}
              </select>
            </div>
            <div className="field-row">
              <label>Bin ID</label>
              <input type="text" placeholder="e.g. A1-R1-S1-B1" value={bin.bin_code} onChange={(e) => setBin({ ...bin, bin_code: e.target.value })} />
            </div>
            <div className="field-grid" style={{ marginBottom: 14 }}>
              <div className="field-row" style={{ marginBottom: 0 }}>
                <label>Max weight</label>
                <div className="unit-suffix"><input type="number" min="0" value={bin.max_weight} onChange={(e) => setBin({ ...bin, max_weight: e.target.value })} /><span>kg</span></div>
              </div>
              <div className="field-row" style={{ marginBottom: 0 }}>
                <label>Max length</label>
                <div className="unit-suffix"><input type="number" min="0" value={bin.max_length} onChange={(e) => setBin({ ...bin, max_length: e.target.value })} /><span>cm</span></div>
              </div>
              <div className="field-row" style={{ marginBottom: 0 }}>
                <label>Max width</label>
                <div className="unit-suffix"><input type="number" min="0" value={bin.max_width} onChange={(e) => setBin({ ...bin, max_width: e.target.value })} /><span>cm</span></div>
              </div>
              <div className="field-row" style={{ marginBottom: 0 }}>
                <label>Max height</label>
                <div className="unit-suffix"><input type="number" min="0" value={bin.max_height} onChange={(e) => setBin({ ...bin, max_height: e.target.value })} /><span>cm</span></div>
              </div>
            </div>
            <button className="btn btn-primary btn-block" onClick={addBin}>Add bin</button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Warehouse layout</h2>
            <span className="hint">{flat.zones.length} zones</span>
          </div>
          <div className="panel-body">
            {tree.length === 0 ? (
              <div className="empty-state">No zones defined yet. Add one on the left to get started.</div>
            ) : (
              <div className="tree">
                {tree.map((z) => (
                  <div className="tree-node" key={z.id}>
                    <div className="tree-label">
                      <span className="tree-type">zone</span>
                      <span className="tree-name">{z.name}</span>
                      <span className="tree-meta">{z.aisles.length} aisles</span>
                      <button className="btn btn-sm btn-danger" style={{ marginLeft: 8 }} onClick={() => del.zone(z.id)}>Remove</button>
                    </div>
                    <div className="tree-children">
                      {z.aisles.map((a) => (
                        <div className="tree-node" key={a.id}>
                          <div className="tree-label">
                            <span className="tree-type">aisle</span>
                            <span className="tree-name">{a.name}</span>
                            <span className="tree-meta">{a.racks.length} racks</span>
                          </div>
                          <div className="tree-children">
                            {a.racks.map((r) => (
                              <div className="tree-node" key={r.id}>
                                <div className="tree-label">
                                  <span className="tree-type">rack</span>
                                  <span className="tree-name">{r.name}</span>
                                  <span className="tree-meta">{r.shelves.length} shelves</span>
                                </div>
                                <div className="tree-children">
                                  {r.shelves.map((s) => (
                                    <div className="tree-node" key={s.id}>
                                      <div className="tree-label">
                                        <span className="tree-type">shelf</span>
                                        <span className="tree-name">{s.name}</span>
                                        <span className="tree-meta">{s.bins.length} bins</span>
                                      </div>
                                      <div className="tree-children">
                                        {s.bins.map((b) => <TreeBin key={b.id} bin={b} />)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
