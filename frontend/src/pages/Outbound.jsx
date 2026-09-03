import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useUser } from '../App.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Outbound() {
  const { userId } = useUser();
  const [storedItems, setStoredItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    api.getItems({ status: 'stored' }).then(setStoredItems).catch((e) => setError(e.message));
    api.getOutboundRequests().then(setRequests).catch((e) => setError(e.message));
  };

  useEffect(() => { load(); }, []);

  const submitRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!userId.trim()) {
      setError('Enter an operator user ID in the top-right field before creating a pre-request.');
      return;
    }
    if (!selectedItem) {
      setError('Choose an item to pre-request for outbound.');
      return;
    }
    try {
      await api.createOutboundRequest({ item_id: Number(selectedItem), user_id: userId });
      setSuccess('Outbound pre-request created.');
      setSelectedItem('');
      load();
    } catch (e2) {
      setError(e2.message);
    }
  };

  const complete = async (id) => {
    if (!userId.trim()) {
      setError('Enter an operator user ID in the top-right field before completing outbound.');
      return;
    }
    setBusyId(id);
    setError('');
    try {
      await api.completeOutbound(id, { user_id: userId });
      setSuccess('Item marked as shipped and bin released.');
      load();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (id) => {
    setBusyId(id);
    setError('');
    try {
      await api.cancelOutbound(id, { user_id: userId || 'system' });
      load();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Outbound</h1>
          <p>Pre-request an item for pickup, then confirm outbound once it physically leaves the bin.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head"><h2>Pre-request</h2></div>
          <div className="panel-body">
            <form onSubmit={submitRequest}>
              <div className="field-row">
                <label>Item ID</label>
                <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
                  <option value="">Select a stored item…</option>
                  {storedItems.map((i) => (
                    <option key={i.id} value={i.id}>{i.item_code} — {i.bin_code} ({i.weight}kg)</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary btn-block" type="submit">Create pre-request</button>
            </form>
            <div className="section-title">Stored items available</div>
            {storedItems.length === 0 ? (
              <div className="empty-state">No items currently stored.</div>
            ) : (
              <table>
                <thead><tr><th>Item ID</th><th>Bin</th><th>Weight</th></tr></thead>
                <tbody>
                  {storedItems.map((i) => (
                    <tr key={i.id}>
                      <td className="mono">{i.item_code}</td>
                      <td className="mono">{i.bin_code}</td>
                      <td className="num">{i.weight} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Outbound requests</h2>
            <span className="hint">{requests.filter((r) => r.status === 'pending').length} pending</span>
          </div>
          <div className="panel-body flush">
            {requests.length === 0 ? (
              <div className="empty-state">No outbound requests yet.</div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Item ID</th>
                      <th>Requested</th>
                      <th>Requested by</th>
                      <th>Bin</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id}>
                        <td className="mono">{r.item_code}</td>
                        <td className="mono">{new Date(r.requested_at).toLocaleString()}</td>
                        <td className="mono">{r.requested_by}</td>
                        <td className="mono">{r.bin_code || '—'}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>
                          {r.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-sm btn-primary" disabled={busyId === r.id} onClick={() => complete(r.id)}>Ship</button>
                              <button className="btn btn-sm btn-danger" disabled={busyId === r.id} onClick={() => cancel(r.id)}>Cancel</button>
                            </div>
                          )}
                        </td>
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
