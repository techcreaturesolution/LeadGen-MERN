import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BackgroundVideoAds from '../components/BackgroundVideoAds.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { api, errMsg, fmtDate } from '../lib/api.js';

const ACTIVE = ['queued', 'sending'];

export default function CampaignDetail() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let timer;
    let alive = true;
    const load = async () => {
      try {
        const { data } = await api.get(`/campaigns/${id}`);
        if (!alive) return;
        setC(data.campaign);
        if (ACTIVE.includes(data.campaign.status)) timer = setTimeout(load, 2500);
      } catch (e) {
        if (alive) setError(errMsg(e));
      }
    };
    load();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [id, tick]);

  const act = useCallback(
    async (action) => {
      setError('');
      try {
        await api.post(`/campaigns/${id}/${action}`);
        setTick((n) => n + 1);
      } catch (e) {
        setError(errMsg(e));
      }
    },
    [id],
  );

  if (!c) return <div className="text-slate-500">{error || 'Loading…'}</div>;
  const active = ACTIVE.includes(c.status);
  const done = c.counts.total - c.counts.pending;
  const pct = c.counts.total ? Math.round((done / c.counts.total) * 100) : 0;
  const rows = filter ? c.recipients.filter((r) => r.status === filter) : c.recipients;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/campaigns" className="text-sm text-[#008762]">
            ← Campaigns
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{c.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <StatusBadge status={c.status} />
            <span>{c.mode === 'gmail' ? `Sending from ${c.from.email} via Gmail` : 'Test run: nothing is actually emailed'}</span>
            <span>
              · group <Link to={`/groups/${c.group}`} className="text-[#008762]">{c.groupName}</Link> · template {c.templateName}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {active && (
            <button type="button" className="btn-secondary" onClick={() => act('pause')}>
              Pause
            </button>
          )}
          {c.status === 'paused' && (
            <button type="button" className="btn-primary" onClick={() => act('resume')}>
              Resume
            </button>
          )}
          {(active || c.status === 'paused') && (
            <button type="button" className="btn-secondary text-red-600" onClick={() => act('cancel')}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {c.lastError && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{c.lastError}</div>}

      <div className="card space-y-3">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <span className="font-medium">
            {done} of {c.counts.total} processed
          </span>
          <span className="text-slate-500">
            {c.mode === 'gmail' ? 'sent' : 'test-run'} {c.counts.sent} · failed {c.counts.failed} · skipped {c.counts.skipped} · pending {c.counts.pending}
          </span>
        </div>
        <div className="h-2 rounded bg-slate-200">
          <div className="h-2 rounded bg-[#008762] transition-all" style={{ width: `${pct}%` }} />
        </div>
        {active && <div className="text-xs text-slate-500">Emails go out one by one in the background. You can leave this page; sending continues.</div>}
      </div>

      <BackgroundVideoAds active={active} />

      <div className="card p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <span className="font-semibold">Recipients</span>
          <select className="input max-w-[200px]" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter recipients">
            <option value="">All ({c.recipients.length})</option>
            {['pending', 'sent', 'simulated', 'failed', 'skipped'].map((s) => (
              <option key={s} value={s}>
                {s === 'simulated' ? 'test run' : s} ({c.recipients.filter((r) => r.status === s).length})
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Business</th>
                <th className="th">Email</th>
                <th className="th">Status</th>
                <th className="th">Time</th>
                <th className="th">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r._id}>
                  <td className="td">{r.business || '—'}</td>
                  <td className="td">{r.email}</td>
                  <td className="td">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="td whitespace-nowrap text-xs">{fmtDate(r.sentAt)}</td>
                  <td className="td text-xs text-slate-500">{r.error || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
