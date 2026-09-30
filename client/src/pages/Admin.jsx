import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLeadsTable from '../components/admin/AdminLeadsTable.jsx';
import ClientsTab from '../components/admin/ClientsTab.jsx';
import SearchesTab from '../components/admin/SearchesTab.jsx';
import { api, errMsg } from '../lib/api.js';
import { getAdsenseConfig } from '../lib/adsense.js';

const EMPTY = {
  advertiser: '',
  title: '',
  description: '',
  imageUrl: '',
  videoUrl: '',
  targetUrl: '',
  ctaText: 'Learn more',
  placement: 'dashboard_banner',
  priority: 0,
  active: true,
  startDate: '',
  endDate: '',
};

const PLACEMENTS = { dashboard_banner: 'Dashboard banner', sidebar: 'Sidebar', inline: 'Inline card', video: 'Video (before search results)' };
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
    for (const k of ['impressions', 'clicks', 'completedViews', 'createdAt', 'updatedAt', 'createdBy', '__v']) delete body[k];
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
      {form.placement === 'video' && (
        <label className="text-sm md:col-span-2">
          Video URL (MP4/WebM, ideally 30s; it loops until the required watch time is reached)
          <input className="input mt-1" type="url" placeholder="https://cdn.example.com/ad.mp4" value={form.videoUrl || ''} onChange={set('videoUrl')} required />
        </label>
      )}
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

function AdsenseStatus() {
  const [config, setConfig] = useState(null);
  useEffect(() => {
    getAdsenseConfig().then(setConfig);
  }, []);
  if (!config) return null;
  const slots = Object.entries(config.slots || {});
  return (
    <div className="card text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold">Google AdSense</div>
        <span className={`badge ${config.client ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
          {config.client ? `Live · ${config.client}${config.testMode ? ' (test mode)' : ''}` : 'Not configured · demo ads shown'}
        </span>
      </div>
      <p className="mt-1 text-slate-500">
        AdSense runs on user pages (dashboard, searches, leads, login) and never on Admin. Set <code>ADSENSE_CLIENT_ID</code> and the{' '}
        <code>ADSENSE_SLOT_*</code> ad unit IDs in <code>server/.env</code>.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {slots.map(([name, id]) => (
          <span key={name} className="badge bg-slate-100 text-slate-700">
            {name}: {config.client && id ? id : 'demo'}
          </span>
        ))}
      </div>
    </div>
  );
}

const TABS = { clients: 'Clients', leads: 'All leads', searches: 'Searches', ads: 'Advertisements' };

export default function Admin() {
  const [params, setParams] = useSearchParams();
  const tab = TABS[params.get('tab')] ? params.get('tab') : 'clients';
  const setTab = (t) => setParams({ tab: t }, { replace: true });
  const [stats, setStats] = useState(null);
  const [ads, setAds] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch((e) => setError(errMsg(e)));
    api.get('/admin/ads').then((r) => setAds(r.data.items)).catch((e) => setError(errMsg(e)));
  };
  useEffect(load, []);

  const removeAd = async (id) => {
    if (!window.confirm('Delete this ad?')) return;
    await api.delete(`/admin/ads/${id}`).catch((e) => setError(errMsg(e)));
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Master Admin</h1>
        {stats && (
          <p className="text-sm text-slate-500">
            Searches and leads are kept for {stats.retentionDays} days, then deleted for everyone. Search video ads last {stats.videoAdSeconds}s.
          </p>
        )}
      </div>
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          {[
            ['Clients', stats.users],
            ['Searches', stats.searches],
            ['Shared-result searches', stats.sharedSearches],
            ['Leads', stats.leads],
            ['Lead groups', stats.groups],
            ['Campaigns', stats.campaigns],
            ['Emails sent', stats.emailsSent],
            ['Active ads', stats.activeAds],
            ['Ad impressions', stats.impressions],
            ['Ad clicks', stats.clicks],
            ['Video ad views', stats.videoViews],
          ].map(([l, v]) => (
            <div key={l} className="card">
              <div className="text-xs text-slate-500">{l}</div>
              <div className="text-xl font-bold">{v}</div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
        {Object.entries(TABS).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${tab === t ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'clients' && <ClientsTab />}
      {tab === 'leads' && <AdminLeadsTable />}
      {tab === 'searches' && <SearchesTab />}
      {tab === 'ads' && (
        <div className="space-y-4">
          <AdsenseStatus />
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
                    <td className="td text-xs">
                      {PLACEMENTS[a.placement]}
                      {a.placement === 'video' && <div className="text-slate-500">{a.completedViews || 0} full views</div>}
                    </td>
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
    </div>
  );
}
