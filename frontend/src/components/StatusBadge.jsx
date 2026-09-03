const MAP = {
  inbound: { cls: 'badge-blue', label: 'Inbound' },
  stored: { cls: 'badge-green', label: 'Stored' },
  outbound_requested: { cls: 'badge-amber', label: 'Outbound requested' },
  shipped: { cls: 'badge-gray', label: 'Shipped' },
  empty: { cls: 'badge-green', label: 'Empty' },
  occupied: { cls: 'badge-amber', label: 'Occupied' },
  pending: { cls: 'badge-amber', label: 'Pending' },
  completed: { cls: 'badge-green', label: 'Completed' },
  cancelled: { cls: 'badge-red', label: 'Cancelled' },
};

export default function StatusBadge({ status }) {
  const entry = MAP[status] || { cls: 'badge-gray', label: status };
  return <span className={`badge ${entry.cls}`}>{entry.label}</span>;
}
