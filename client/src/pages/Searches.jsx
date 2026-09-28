import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge.jsx';
import { api, errMsg, SOURCE_LABELS } from '../lib/api.js';

export default function Searches() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 20 });
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const load = (p) =>
    api
      .get('/searches', { params: { page: p, limit: 20 } })
      .then((r) => setData(r.data))
      .catch((e) => setError(errMsg(e)));

  useEffect(() => {
    load(page);
  }, [page]);

  const remove = async (id) => {
    if (!window.confirm('Delete this search and its leads?')) return;
    try {
      await api.delete(`/searches/${id}`);
      load(page);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const pages = Math.max(1, Math.ceil(data.total / data.limit));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Searches</h1>
        <Link to="/" className="btn-primary">
          New search
        </Link>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Query</th>
              <th className="th">Sources</th>
              <th className="th">Target</th>
              <th className="th">Leads</th>
              <th className="th">Status</th>
              <th className="th">Created</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((j) => (
              <tr key={j._id} className="hover:bg-slate-50">
                <td className="td">
                  <Link to={`/searches/${j._id}`} className="font-medium text-blue-700 hover:underline">
                    {j.query}
                  </Link>
                </td>
                <td className="td text-xs">{j.sources.map((s) => SOURCE_LABELS[s]).join(', ')}</td>
                <td className="td">{j.targetCount}</td>
                <td className="td">
                  {j.leadCount} <span className="text-xs text-slate-400">({j.progress?.withEmail || 0} with email)</span>
                </td>
                <td className="td">
                  <StatusBadge status={j.status} />
                </td>
                <td className="td whitespace-nowrap text-xs text-slate-500">{new Date(j.createdAt).toLocaleString()}</td>
                <td className="td text-right">
                  {j.status !== 'running' && (
                    <button type="button" onClick={() => remove(j._id)} className="text-xs text-red-600 hover:underline">
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!data.items.length && (
              <tr>
                <td className="td py-8 text-center text-slate-500" colSpan={7}>
                  No searches yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
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
  );
}
