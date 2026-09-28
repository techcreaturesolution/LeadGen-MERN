import { useState } from 'react';
import { downloadExport, errMsg } from '../lib/api.js';

export default function ExportButtons({ params = {}, disabled }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const run = async (count) => {
    setBusy(count);
    setError('');
    try {
      await downloadExport({ ...params, count });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-500">Excel report:</span>
      {['20', '40', '60', 'all'].map((c) => (
        <button key={c} type="button" className="btn-secondary px-3 py-1.5" disabled={disabled || busy !== null} onClick={() => run(c)}>
          {busy === c ? 'Preparing…' : c === 'all' ? 'All' : `Top ${c}`}
        </button>
      ))}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
