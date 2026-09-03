const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // no body
  }
  if (!res.ok) {
    throw new Error((body && body.error) || `Request failed (${res.status})`);
  }
  return body;
}

export const api = {
  // storage
  getTree: () => request('/storage/tree'),
  getZones: () => request('/storage/zones'),
  createZone: (data) => request('/storage/zones', { method: 'POST', body: JSON.stringify(data) }),
  deleteZone: (id) => request(`/storage/zones/${id}`, { method: 'DELETE' }),
  createAisle: (data) => request('/storage/aisles', { method: 'POST', body: JSON.stringify(data) }),
  deleteAisle: (id) => request(`/storage/aisles/${id}`, { method: 'DELETE' }),
  createRack: (data) => request('/storage/racks', { method: 'POST', body: JSON.stringify(data) }),
  deleteRack: (id) => request(`/storage/racks/${id}`, { method: 'DELETE' }),
  createShelf: (data) => request('/storage/shelves', { method: 'POST', body: JSON.stringify(data) }),
  deleteShelf: (id) => request(`/storage/shelves/${id}`, { method: 'DELETE' }),
  createBin: (data) => request('/storage/bins', { method: 'POST', body: JSON.stringify(data) }),
  deleteBin: (id) => request(`/storage/bins/${id}`, { method: 'DELETE' }),
  getBins: (params = {}) => request(`/storage/bins?${new URLSearchParams(params)}`),

  // inbound
  getInbound: () => request('/inbound'),
  receiveItem: (data) => request('/inbound', { method: 'POST', body: JSON.stringify(data) }),

  // items
  getItems: (params = {}) => request(`/items?${new URLSearchParams(params)}`),

  // outbound
  getOutboundRequests: (params = {}) => request(`/outbound/requests?${new URLSearchParams(params)}`),
  createOutboundRequest: (data) => request('/outbound/requests', { method: 'POST', body: JSON.stringify(data) }),
  completeOutbound: (id, data) => request(`/outbound/requests/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),
  cancelOutbound: (id, data) => request(`/outbound/requests/${id}/cancel`, { method: 'POST', body: JSON.stringify(data) }),

  // reports
  getLogs: (params = {}) => request(`/reports/logs?${new URLSearchParams(params)}`),
  getItemReport: (idOrCode) => request(`/reports/item/${idOrCode}`),
  getSummary: () => request('/reports/summary'),
};
