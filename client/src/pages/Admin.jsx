import { useEffect, useState } from 'react';
import { api, errMsg } from '../lib/api.js';

const EMPTY = {
  advertiser: '',
  title: '',
  description: '',
  imageUrl: '',
  targetUrl: '',
  ctaText: 'Learn more',
  placement: 'dashboard_banner',
  priority: 0,
  active: true,
  startDate: '',
  endDate: '',
};

const PLACEMENTS = { dashboard_banner: 'Dashboard banner', sidebar: 'Sidebar', inline: 'Inline card' };
const toDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

function AdForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = { ...form, priority: Number(form.priority) };
    delete body._id;
    for (const k of ['impressions', 'clicks', 'createdAt', 'updatedAt', 'createdBy', '__v']) delete body[k];
    try {
      if (initial._id) await api.put(`/admin/ads/${initial._id}`, body);
      else await api.post('/admin/ads', body);
      onSaved();
    } catch (err) {
      const d = err.response?.data?.details;
      setError(d ? d.map((x) => `${x.path?.join('.')}: ${x.message}`).join('; ') : errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card grid gap-3 md:grid-cols-2">
      <h3 className="font-semibold md:col-span-2">{initial._id ? 'Edit ad' : 'New ad'}</h3>
      <label className="text-sm">
        Advertiser company
        <input className="input mt-1" value={form.advertiser} onChange={set('advertiser')} required />
      </label>
      <label className="text-sm">
        Title
        <input className="input mt-1" value={form.title} onChange={set('title')} required />
      </label>
      <label className="text-sm md:col-span-2">
        Description
        <input className="input mt-1" value={form.description} onChange={set('description')} />
      </label>
      <label className="text-sm">
        Target URL
        <input className="input mt-1" type="url" placeholder="https://" value={form.targetUrl} onChange={set('targetUrl')} required />
      </label>
      <label className="text-sm">
        Image URL (optional)
        <input className="input mt-1" type="url" placeholder="https://" value={form.imageUrl} onChange={set('imageUrl')} />
      </label>
      <label className="text-sm">
        Placement
        <select className="input mt-1" value={form.placement} onChange={set('placement')}>
          {Object.entries(PLACEMENTS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          CTA text
          <input className="input mt-1" value={form.ctaText} onChange={set('ctaText')} />
        </label>
        <label className="text-sm">
          Priority (0-100)
          <input className="input mt-1" type="number" min={0} max={100} value={form.priority} onChange={set('priority')} />
        </label>
      </div>
      <label className="text-sm">
        Start date
        <input className="input mt-1" type="date" value={toDate(form.startDate)} onChange={set('startDate')} />
      </label>
      <label className="text-sm">
        End date
        <input className="input mt-1" type="date" value={toDate(form.endDate)} onChange={set('endDate')} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.active} onChange={set('active')} /> Active
      </label>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 md:col-span-2">{error}</div>}
      <div className="flex justify-end gap-2 md:col-span-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save ad'}
        </button>
      </div>
    </form>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('ads');
  const [stats, setStats] = useState(null);
  const [ads, setAds] = useState([]);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch((e) => setError(errMsg(e)));
    api.get('/admin/ads').then((r) => setAds(r.data.items)).catch((e) => setError(errMsg(e)));
    api.get('/admin/users').then((r) => setUsers(r.data.items)).catch((e) => setError(errMsg(e)));
  };
  useEffect(load, []);

  const removeAd = async (id) => {
    if (!window.confirm('Delete this ad?')) return;
    await api.delete(`/admin/ads/${id}`).catch((e) => setError(errMsg(e)));
    load();
  };

  const updateUser = async (id, body) => {
    try {
      await api.patch(`/admin/users/${id}`, body);
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Admin</h1>
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          {[
            ['Users', stats.users],
            ['Searches', stats.searches],
            ['Leads', stats.leads],
            ['Active ads', stats.activeAds],
            ['Ad impressions', stats.impressions],
            ['Ad clicks', stats.clicks],
          ].map(([l, v]) => (
            <div key={l} className="card">
              <div className="text-xs text-slate-500">{l}</div>
              <div className="text-xl font-bold">{v}</div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="flex gap-2 border-b border-slate-200">
        {['ads', 'users'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize ${tab === t ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500'}`}
          >
            {t === 'ads' ? 'Advertisements' : 'Users'}
          </button>
        ))}
      </div>

      {tab === 'ads' && (
        <div className="space-y-4">
          {editing ? (
            <AdForm
              key={editing._id || 'new'}
              initial={editing}
              onCancel={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                load();
              }}
            />
          ) : (
            <button type="button" className="btn-primary" onClick={() => setEditing(EMPTY)}>
              + New ad
            </button>
          )}
          <div className="card overflow-x-auto p-0">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Ad</th>
                  <th className="th">Placement</th>
                  <th className="th">Schedule</th>
                  <th className="th">Impr.</th>
                  <th className="th">Clicks</th>
                  <th className="th">CTR</th>
                  <th className="th">Status</th>
                  <th className="th" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ads.map((a) => (
                  <tr key={a._id}>
                    <td className="td">
                      <div className="font-medium">{a.title}</div>
                      <div className="text-xs text-slate-500">
                        {a.advertiser} ·{' '}
                        <a href={a.targetUrl} target="_blank" rel="noreferrer" className="text-blue-700">
                          {a.targetUrl}
                        </a>
                      </div>
                    </td>
                    <td className="td text-xs">{PLACEMENTS[a.placement]}</td>
                    <td className="td text-xs">
                      {toDate(a.startDate) || 'now'} → {toDate(a.endDate) || '∞'}
                    </td>
                    <td className="td">{a.impressions}</td>
                    <td className="td">{a.clicks}</td>
                    <td className="td">{a.impressions ? `${((a.clicks / a.impressions) * 100).toFixed(1)}%` : '—'}</td>
                    <td className="td">
                      <span className={`badge ${a.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{a.active ? 'active' : 'paused'}</span>
                    </td>
                    <td className="td whitespace-nowrap text-right text-xs">
                      <button type="button" className="mr-3 text-blue-700" onClick={() => setEditing({ ...EMPTY, ...a })}>
                        Edit
                      </button>
                      <button type="button" className="text-red-600" onClick={() => removeAd(a._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!ads.length && (
                  <tr>
                    <td className="td py-8 text-center text-slate-500" colSpan={8}>
                      No ads yet. Create one to show sponsored content on user dashboards.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">User</th>
                <th className="th">Role</th>
                <th className="th">Searches</th>
                <th className="th">Leads</th>
                <th className="th">Last login</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="td">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="td">{u.role}</td>
                  <td className="td">{u.searches}</td>
                  <td className="td">{u.leads}</td>
                  <td className="td text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}</td>
                  <td className="td whitespace-nowrap text-right text-xs">
                    <button type="button" className="mr-3 text-blue-700" onClick={() => updateUser(u._id, { role: u.role === 'admin' ? 'user' : 'admin' })}>
                      Make {u.role === 'admin' ? 'user' : 'admin'}
                    </button>
                    <button type="button" className={u.active ? 'text-red-600' : 'text-green-700'} onClick={() => updateUser(u._id, { active: !u.active })}>
                      {u.active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
