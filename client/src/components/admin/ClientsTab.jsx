import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, downloadExport, errMsg, fmtDate } from '../../lib/api.js';
import { updateClient } from '../../lib/admin.js';
import Pager from './Pager.jsx';

export default function ClientsTab() {
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, limit: 25 });
  const [version, setVersion] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const key = JSON.stringify(params);

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get('/admin/users', { params: { ...JSON.parse(key), page, limit: 25 } })
        .then((r) => setData(r.data))
        .catch((e) => setError(errMsg(e)));
    }, 250);
    return () => clearTimeout(t);
  }, [key, page, version]);

  const set = (k) => (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: e.target.value }));
  };

  const act = async (id, body) => {
    setError('');
    try {
      await updateClient(id, body);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const exportClients = async (format) => {
    setBusy(format);
    setError('');
    try {
      await downloadExport({ ...params, format }, '/admin/users/export');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="card grid gap-3 md:grid-cols-5">
        <input className="input md:col-span-2" placeholder="Search client name or email…" value={filters.search} onChange={set('search')} />
        <select className="input" value={filters.role} onChange={set('role')}>
          <option value="">Any role</option>
          <option value="user">Clients</option>
          <option value="admin">Admins</option>
        </select>
        <select className="input" value={filters.status} onChange={set('status')}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1 px-2" disabled={Boolean(busy)} onClick={() => exportClients('xlsx')}>
            {busy === 'xlsx' ? '…' : 'Excel'}
          </button>
          <button type="button" className="btn-secondary flex-1 px-2" disabled={Boolean(busy)} onClick={() => exportClients('csv')}>
            {busy === 'csv' ? '…' : 'CSV'}
          </button>
        </div>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="text-sm text-slate-500">{data.total} accounts</div>
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Client</th>
              <th className="th">Role / status</th>
              <th className="th">Gmail</th>
              <th className="th">Searches</th>
              <th className="th">Leads</th>
              <th className="th">Groups</th>
              <th className="th">Campaigns</th>
              <th className="th">Emails sent</th>
              <th className="th">Last login</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((u) => (
              <tr key={u._id} className="hover:bg-slate-50">
                <td className="td">
                  <Link to={`/admin/clients/${u._id}`} className="font-medium text-blue-700 hover:underline">
                    {u.name || u.email}
                  </Link>
                  <div className="text-xs text-slate-500">{u.email}</div>
                  <div className="text-xs text-slate-400">joined {fmtDate(u.createdAt)}</div>
                </td>
                <td className="td text-xs">
                  <div className="capitalize">{u.role}</div>
                  <span className={`badge ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.active ? 'active' : 'disabled'}</span>
                </td>
                <td className="td text-xs">{u.gmail ? u.gmail.email : <span className="text-slate-400">not connected</span>}</td>
                <td className="td">{u.searches}</td>
                <td className="td">
                  {u.leads} <span className="text-xs text-slate-400">({u.leadsWithEmail} email)</span>
                </td>
                <td className="td">{u.groups}</td>
                <td className="td">{u.campaigns}</td>
                <td className="td">
                  {u.emailsSent}
                  {u.testEmails ? <span className="text-xs text-slate-400"> (+{u.testEmails} test)</span> : null}
                </td>
                <td className="td whitespace-nowrap text-xs">{fmtDate(u.lastLoginAt)}</td>
                <td className="td whitespace-nowrap text-right text-xs">
                  <Link to={`/admin/clients/${u._id}`} className="mr-3 text-blue-700">
                    View data
                  </Link>
                  <button type="button" className="mr-3 text-blue-700" onClick={() => act(u._id, { role: u.role === 'admin' ? 'user' : 'admin' })}>
                    Make {u.role === 'admin' ? 'user' : 'admin'}
                  </button>
                  <button type="button" className={u.active ? 'text-red-600' : 'text-green-700'} onClick={() => act(u._id, { active: !u.active })}>
                    {u.active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
            {!data.items.length && (
              <tr>
                <td className="td py-8 text-center text-slate-500" colSpan={10}>
                  No accounts match.
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
