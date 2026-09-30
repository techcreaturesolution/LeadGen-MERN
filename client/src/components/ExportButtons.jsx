import { useState } from 'react';
import { downloadExport, errMsg } from '../lib/api.js';

export default function ExportButtons({ params = {}, disabled, path }) {
  const [busy, setBusy] = useState(null);
  const [format, setFormat] = useState('xlsx');
  const [error, setError] = useState('');
  const run = async (count) => {
    setBusy(count);
    setError('');
    try {
      await downloadExport({ ...params, count, format }, path);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1 text-sm text-slate-500">
        Export
        <select aria-label="Export format" className="input w-auto py-1.5" value={format} onChange={(e) => setFormat(e.target.value)} disabled={disabled || busy !== null}>
          <option value="xlsx">Excel (.xlsx)</option>
          <option value="csv">CSV (.csv)</option>
        </select>
      </label>
      {['20', '40', '60', 'all'].map((c) => (
        <button key={c} type="button" className="btn-secondary px-3 py-1.5" disabled={disabled || busy !== null} onClick={() => run(c)}>
          {busy === c ? 'Preparing…' : c === 'all' ? 'All' : `Top ${c}`}
        </button>
      ))}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
