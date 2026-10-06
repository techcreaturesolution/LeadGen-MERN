import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg, fmtDate, SOURCE_LABELS } from '../../lib/api.js';
import ExportButtons from '../ExportButtons.jsx';
import { EmailTypeBadge } from '../StatusBadge.jsx';
import Pager from './Pager.jsx';

const short = (u) => u?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

export default function AdminLeadsTable({ owner, showOwner = true }) {
  const [filters, setFilters] = useState({ search: '', emailType: '', source: '', hasEmail: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, limit: 25 });
  const [version, setVersion] = useState(0);
  const [error, setError] = useState('');

  const params = Object.fromEntries(Object.entries({ ...filters, owner }).filter(([, v]) => v));
  const key = JSON.stringify(params);

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get('/admin/leads', { params: { ...JSON.parse(key), page, limit: 25 } })
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
    if (!window.confirm('Delete this lead for its owner?')) return;
    try {
      await api.delete(`/admin/leads/${id}`);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <div className="space-y-3">
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-slate-500">{data.total} leads</div>
        <ExportButtons params={params} path="/admin/leads/export" disabled={!data.total} />
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Business</th>
              <th className="th">Email</th>
              <th className="th">Phone / website</th>
              {showOwner && <th className="th">Client</th>}
              <th className="th">Search</th>
              <th className="th">Added</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((l) => (
              <tr key={l._id} className="hover:bg-slate-50">
                <td className="td max-w-xs">
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-slate-500">{[l.category, l.city].filter(Boolean).join(' · ')}</div>
                  {l.reusedFrom && <span className="badge bg-emerald-50 text-emerald-700">shared</span>}
                </td>
                <td className="td text-xs">
                  {l.primaryEmail ? (
                    <>
                      <div>{l.primaryEmail}</div>
                      <EmailTypeBadge type={l.primaryEmailCategory} />
                    </>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="td text-xs">
                  <div>{l.phone || '—'}</div>
                  {l.website && (
                    <a href={l.website} target="_blank" rel="noreferrer" className="text-[#008762]">
                      {short(l.website)}
                    </a>
                  )}
                </td>
                {showOwner && (
                  <td className="td text-xs">
                    {l.owner ? (
                      <Link to={`/admin/clients/${l.owner._id}`} className="text-[#008762]">
                        {l.owner.email}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                )}
                <td className="td max-w-[14rem] truncate text-xs" title={l.job?.query}>
                  {l.job?.query || '—'}
                </td>
                <td className="td whitespace-nowrap text-xs">{fmtDate(l.createdAt)}</td>
                <td className="td text-right text-xs">
                  <button type="button" className="text-red-600" onClick={() => remove(l._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!data.items.length && (
              <tr>
                <td className="td py-8 text-center text-slate-500" colSpan={7}>
                  No leads.
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
