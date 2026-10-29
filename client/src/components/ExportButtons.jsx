import { useState } from 'react';
import { downloadExport, errMsg } from '../lib/api.js';
import { Download } from 'lucide-react';

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
      <div className="flex items-center gap-1.5">
        <select 
          aria-label="Export format" 
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-[#008762] focus:ring-1 focus:ring-[#008762] disabled:opacity-50 transition-colors cursor-pointer shadow-sm" 
          value={format} 
          onChange={(e) => setFormat(e.target.value)} 
          disabled={disabled || busy !== null}
        >
          <option value="xlsx">Excel (.xlsx)</option>
          <option value="csv">CSV (.csv)</option>
        </select>
      </div>
      
      <div className="flex items-center gap-1">
        {['20', '50', 'all'].map((c) => (
          <button 
            key={c} 
            type="button" 
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:text-[#008762] hover:border-[#008762]/40 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm" 
            disabled={disabled || busy !== null} 
            onClick={() => run(c)}
          >
            {c === 'all' && <Download size={12} />}
            {busy === c ? 'Preparing…' : c === 'all' ? 'Export All' : `Top ${c}`}
          </button>
        ))}
      </div>
      {error && <span className="text-xs text-red-600 font-medium ml-1">{error}</span>}
    </div>
  );
}
