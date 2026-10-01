const styles = {
  queued: 'bg-slate-100 text-slate-700',
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  sending: 'bg-blue-100 text-blue-700',
  paused: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-slate-200 text-slate-600',
  pending: 'bg-slate-100 text-slate-600',
  sent: 'bg-green-100 text-green-700',
  simulated: 'bg-indigo-100 text-indigo-700',
  skipped: 'bg-slate-200 text-slate-600',
};

const labels = { simulated: 'test run', dry_run: 'test run' };

export default function StatusBadge({ status }) {
  return <span className={`badge ${styles[status] || styles.queued}`}>{labels[status] || status}</span>;
}

const emailStyles = {
  hr: 'bg-green-100 text-green-800',
  sales: 'bg-purple-100 text-purple-800',
  support: 'bg-cyan-100 text-cyan-800',
  generic: 'bg-slate-100 text-slate-700',
  personal: 'bg-amber-100 text-amber-800',
  other: 'bg-slate-100 text-slate-500',
};

export function EmailTypeBadge({ type }) {
  if (!type) return null;
  return <span className={`badge ${emailStyles[type] || emailStyles.other}`}>{type.toUpperCase()}</span>;
}
