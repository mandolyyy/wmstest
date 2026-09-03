import { useEffect, useState } from 'react';
import { api } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';

const ACTION_LABEL = {
  INBOUND_RECEIVED: 'Inbound received',
  BIN_ASSIGNED: 'Bin assigned',
  BIN_UNAVAILABLE: 'No bin available',
  OUTBOUND_REQUESTED: 'Outbound pre-requested',
  OUTBOUND_COMPLETED: 'Outbound completed',
  OUTBOUND_CANCELLED: 'Outbound cancelled',
};

function ActionBadge({ action }) {
  const cls = action.includes('COMPLETED') ? 'badge-green'
    : action.includes('UNAVAILABLE') || action.includes('CANCELLED') ? 'badge-red'
    : action.includes('REQUESTED') ? 'badge-amber'
    : 'badge-blue';
  return <span className={`badge ${cls}`}>{ACTION_LABEL[action] || action}</span>;
}

export default function Reporting() {
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState('');
  const [lookup, setLookup] = useState('');
  const [itemReport, setItemReport] = useState(null);
  const [error, setError] = useState('');

  const loadLogs = (item_code = '') => api.getLogs(item_code ? { item_code } : {}).then(setLogs).catch((e) => setError(e.message));

  useEffect(() => {
    api.getSummary().then(setSummary).catch(() => {});
    loadLogs();
  }, []);

  const runFilter = (e) => {
    e.preventDefault();
    loadLogs(query);
  };

  const runLookup = async (e) => {
    e.preventDefault();
    setError('');
    setItemReport(null);
    if (!lookup.trim()) return;
    try {
      const rpt = await api.getItemReport(lookup.trim());
      setItemReport(rpt);
    } catch (e2) {
      setError(e2.message);
    }
  };

  const countFor = (arr, key) => (arr || []).reduce((m, r) => ({ ...m, [r[key]]: r.n }), {});
  const itemCounts = summary ? countFor(summary.items, 'status') : {};
  const binCounts = summary ? countFor(summary.bins, 'status') : {};

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Reporting</h1>
          <p>Every inbound, storage and outbound event is logged per item ID for a complete audit trail.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stat-row">
        <div className="stat-card"><div className="stat-val">{itemCounts.stored || 0}</div><div className="stat-label">Items stored</div></div>
        <div className="stat-card"><div className="stat-val">{itemCounts.outbound_requested || 0}</div><div className="stat-label">Outbound pending</div></div>
        <div className="stat-card"><div className="stat-val">{itemCounts.shipped || 0}</div><div className="stat-label">Items shipped</div></div>
        <div className="stat-card"><div className="stat-val">{binCounts.empty || 0}</div><div className="stat-label">Bins empty</div></div>
        <div className="stat-card"><div className="stat-val">{binCounts.occupied || 0}</div><div className="stat-label">Bins occupied</div></div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head"><h2>Look up an item</h2></div>
          <div className="panel-body">
            <form className="inline-form" onSubmit={runLookup}>
              <input type="text" placeholder="e.g. ITM-000001" value={lookup} onChange={(e) => setLookup(e.target.value)} />
              <button className="btn btn-sm btn-primary" type="submit">Look up</button>
            </form>

            {itemReport && (
              <div style={{ marginTop: 18 }}>
                <div className="section-title">Item detail</div>
                <table>
                  <tbody>
                    <tr><td>Item ID</td><td className="mono">{itemReport.item.item_code}</td></tr>
                    <tr><td>Description</td><td>{itemReport.item.description || '—'}</td></tr>
                    <tr><td>Weight</td><td className="num">{itemReport.item.weight} kg</td></tr>
                    <tr><td>Dimensions</td><td className="num">{itemReport.item.length}×{itemReport.item.width}×{itemReport.item.height} cm</td></tr>
                    <tr><td>Status</td><td><StatusBadge status={itemReport.item.status} /></td></tr>
                    <tr><td>Received by</td><td className="mono">{itemReport.item.created_by}</td></tr>
                    <tr><td>Received at</td><td className="mono">{new Date(itemReport.item.created_at).toLocaleString()}</td></tr>
                    <tr>
                      <td>Location</td>
                      <td className="mono">
                        {itemReport.bin
                          ? `${itemReport.bin.zone_name} / ${itemReport.bin.aisle_name} / ${itemReport.bin.rack_name} / ${itemReport.bin.shelf_name} / ${itemReport.bin.bin_code}`
                          : '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="section-title">Process log for this item</div>
                {itemReport.logs.map((l) => (
                  <div key={l.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                    <ActionBadge action={l.action} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5 }}>{l.details}</div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                        {new Date(l.created_at).toLocaleString()} · {l.user_id}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Global process log</h2>
            <span className="hint">{logs.length} entries</span>
          </div>
          <div className="panel-body">
            <form className="inline-form" onSubmit={runFilter} style={{ marginBottom: 12, marginTop: 0 }}>
              <input type="text" placeholder="Filter by item ID…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <button className="btn btn-sm" type="submit">Filter</button>
            </form>
            {logs.length === 0 ? (
              <div className="empty-state">No log entries match.</div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr><th>When</th><th>Item ID</th><th>Action</th><th>Detail</th><th>User</th></tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id}>
                        <td className="mono">{new Date(l.created_at).toLocaleString()}</td>
                        <td className="mono">{l.item_code || '—'}</td>
                        <td><ActionBadge action={l.action} /></td>
                        <td style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>{l.details}</td>
                        <td className="mono">{l.user_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
