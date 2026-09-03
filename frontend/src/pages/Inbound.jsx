import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useUser } from '../App.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const emptyForm = { weight: '', length: '', width: '', height: '', description: '' };

export default function Inbound() {
  const { userId } = useUser();
  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.getInbound().then(setRows).catch((e) => setError(e.message));

  useEffect(() => { load(); }, []);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!userId.trim()) {
      setError('Enter an operator user ID in the top-right field before receiving an item.');
      return;
    }
    setSubmitting(true);
    try {
      const item = await api.receiveItem({
        weight: Number(form.weight),
        length: Number(form.length),
        width: Number(form.width),
        height: Number(form.height),
        description: form.description,
        user_id: userId,
      });
      if (item.bin_code) {
        setSuccess(`${item.item_code} received and assigned to bin ${item.bin_code}.`);
      } else {
        setSuccess(`${item.item_code} received, but no bin currently fits it — set up more bins or free capacity.`);
      }
      setForm(emptyForm);
      load();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Inbound receiving</h1>
          <p>Log a new item as it arrives at the dock. Weight and dimensions are matched against bin capacity automatically.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <h2>Receive item</h2>
            <span className="hint">timestamp + operator auto-logged</span>
          </div>
          <div className="panel-body">
            {error && <div className="error-banner">{error}</div>}
            {success && <div className="success-banner">{success}</div>}
            <form onSubmit={submit}>
              <div className="field-row">
                <label>Description (optional)</label>
                <input type="text" value={form.description} onChange={update('description')} placeholder="e.g. Ceramic tile carton" />
              </div>
              <div className="field-row">
                <label>Weight</label>
                <div className="unit-suffix">
                  <input type="number" min="0" step="0.01" required value={form.weight} onChange={update('weight')} />
                  <span>kg</span>
                </div>
              </div>
              <div className="section-title">Dimensions</div>
              <div className="field-grid" style={{ marginBottom: 14 }}>
                <div className="field-row" style={{ marginBottom: 0 }}>
                  <label>Length</label>
                  <div className="unit-suffix"><input type="number" min="0" step="0.1" required value={form.length} onChange={update('length')} /><span>cm</span></div>
                </div>
                <div className="field-row" style={{ marginBottom: 0 }}>
                  <label>Width</label>
                  <div className="unit-suffix"><input type="number" min="0" step="0.1" required value={form.width} onChange={update('width')} /><span>cm</span></div>
                </div>
              </div>
              <div className="field-row">
                <label>Height</label>
                <div className="unit-suffix"><input type="number" min="0" step="0.1" required value={form.height} onChange={update('height')} /><span>cm</span></div>
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
                {submitting ? 'Receiving…' : 'Receive item'}
              </button>
            </form>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Recent inbound</h2>
            <span className="hint">{rows.length} item{rows.length === 1 ? '' : 's'}</span>
          </div>
          <div className="panel-body flush">
            {rows.length === 0 ? (
              <div className="empty-state">No items received yet.</div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Item ID</th>
                      <th>Received</th>
                      <th>Weight</th>
                      <th>Dimensions (L×W×H)</th>
                      <th>Operator</th>
                      <th>Bin</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td className="mono">{r.item_code}</td>
                        <td className="mono">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="num">{r.weight} kg</td>
                        <td className="num">{r.length}×{r.width}×{r.height} cm</td>
                        <td className="mono">{r.created_by}</td>
                        <td className="mono">{r.bin_code || '—'}</td>
                        <td><StatusBadge status={r.status} /></td>
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
