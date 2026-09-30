import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, daysLeft, errMsg, fmtDate, SOURCE_LABELS } from '../../lib/api.js';
import StatusBadge from '../StatusBadge.jsx';
import Pager from './Pager.jsx';

export default function SearchesTab() {
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, limit: 25 });
  const [version, setVersion] = useState(0);
  const [error, setError] = useState('');

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const key = JSON.stringify(params);

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get('/admin/searches', { params: { ...JSON.parse(key), page, limit: 25 } })
        .then((r) => setData(r.data))
        .catch((e) => setError(errMsg(e)));
    }, 250);
    return () => clearTimeout(t);
  }, [key, page, version]);

  const set = (k) => (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: e.target.value }));
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this search and its leads for the client?')) return;
    try {
      await api.delete(`/admin/searches/${id}`);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <div className="space-y-3">
      <div className="card grid gap-3 md:grid-cols-3">
        <input className="input md:col-span-2" placeholder="Search query text…" value={filters.search} onChange={set('search')} />
        <select className="input" value={filters.status} onChange={set('status')}>
          <option value="">Any status</option>
          {['queued', 'running', 'completed', 'failed'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="text-sm text-slate-500">
        {data.total} searches · every search is deleted automatically {data.retentionDays || 7} days after it was run
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Query</th>
              <th className="th">Client</th>
              <th className="th">Sources</th>
              <th className="th">Leads</th>
              <th className="th">Shared</th>
              <th className="th">Status</th>
              <th className="th">Created</th>
              <th className="th">Expires</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((j) => (
              <tr key={j._id} className="hover:bg-slate-50">
                <td className="td font-medium">{j.query}</td>
                <td className="td text-xs">
                  {j.owner ? (
                    <Link to={`/admin/clients/${j.owner._id}`} className="text-blue-700">
                      {j.owner.email}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="td text-xs">{j.sources.map((s) => SOURCE_LABELS[s]).join(', ')}</td>
                <td className="td">
                  {j.leadCount} <span className="text-xs text-slate-400">/ {j.targetCount}</span>
                </td>
                <td className="td text-xs">{j.cache?.reused ? `${j.cache.reused} reused` : '—'}</td>
                <td className="td">
                  <StatusBadge status={j.status} />
                </td>
                <td className="td whitespace-nowrap text-xs">{fmtDate(j.createdAt)}</td>
                <td className="td whitespace-nowrap text-xs">in {daysLeft(j.expiresAt)} d</td>
                <td className="td text-right text-xs">
                  {j.status !== 'running' && (
                    <button type="button" className="text-red-600" onClick={() => remove(j._id)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!data.items.length && (
              <tr>
                <td className="td py-8 text-center text-slate-500" colSpan={9}>
                  No searches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pager page={page} total={data.total} limit={data.limit} onPage={setPage} />
    </div>
  );
}
