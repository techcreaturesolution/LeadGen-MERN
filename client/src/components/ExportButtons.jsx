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
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-emerald-100">Export as:</span>
        <select 
          aria-label="Export format" 
          className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white focus:ring-1 focus:ring-white disabled:opacity-50 transition-colors hover:bg-white/20 cursor-pointer [&>option]:bg-slate-800" 
          value={format} 
          onChange={(e) => setFormat(e.target.value)} 
          disabled={disabled || busy !== null}
        >
          <option value="xlsx">Excel (.xlsx)</option>
          <option value="csv">CSV (.csv)</option>
        </select>
      </div>
      
      <div className="flex items-center gap-1.5 ml-1">
        {['20', '40', '60', 'all'].map((c) => (
          <button 
            key={c} 
            type="button" 
            className="rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-medium text-white transition-all hover:bg-white/20 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={disabled || busy !== null} 
            onClick={() => run(c)}
          >
            {busy === c ? 'Preparing…' : c === 'all' ? 'All' : `Top ${c}`}
          </button>
        ))}
      </div>
      {error && <span className="text-sm text-red-300 font-medium ml-2">{error}</span>}
    </div>
  );
}
