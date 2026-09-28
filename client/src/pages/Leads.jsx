import { useEffect, useState } from 'react';
import ExportButtons from '../components/ExportButtons.jsx';
import LeadsTable from '../components/LeadsTable.jsx';
import { api, errMsg, SOURCE_LABELS } from '../lib/api.js';

export default function Leads() {
  const [filters, setFilters] = useState({ search: '', emailType: '', source: '', hasEmail: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, limit: 25 });
  const [error, setError] = useState('');

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const key = JSON.stringify(params);

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get('/leads', { params: { ...JSON.parse(key), page, limit: 25 } })
        .then((r) => setData(r.data))
        .catch((e) => setError(errMsg(e)));
    }, 250);
    return () => clearTimeout(t);
  }, [key, page]);

  const set = (k) => (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: e.target.value }));
  };
  const pages = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">All leads</h1>
        <ExportButtons params={params} disabled={!data.total} />
      </div>
      <div className="card grid gap-3 md:grid-cols-4">
        <input className="input" placeholder="Search name, email, website, city…" value={filters.search} onChange={set('search')} />
        <select className="input" value={filters.emailType} onChange={set('emailType')}>
          <option value="">Any email type</option>
          {['hr', 'sales', 'support', 'generic', 'personal', 'other'].map((t) => (
            <option key={t} value={t}>
              {t.toUpperCase()}
            </option>
          ))}
        </select>
        <select className="input" value={filters.source} onChange={set('source')}>
          <option value="">Any source</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select className="input" value={filters.hasEmail} onChange={set('hasEmail')}>
          <option value="">With or without email</option>
          <option value="true">Only with email</option>
        </select>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="card p-0">
        <LeadsTable leads={data.items} showRank={false} />
      </div>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{data.total} leads</span>
        {pages > 1 && (
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Prev
            </button>
            <span>
              {page} / {pages}
            </span>
            <button type="button" className="btn-secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
