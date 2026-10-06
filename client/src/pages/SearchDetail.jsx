import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdSlot from '../components/AdSlot.jsx';
import GoogleAd from '../components/GoogleAd.jsx';
import ExportButtons from '../components/ExportButtons.jsx';
import LeadsTable from '../components/LeadsTable.jsx';
import SaveToGroup from '../components/SaveToGroup.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import VideoAdGate from '../components/VideoAdGate.jsx';
import { api, daysLeft, errMsg, SOURCE_LABELS } from '../lib/api.js';

const STAGES = ['planning', 'discovering', 'resolving websites', 'enriching companies', 'crawling websites', 'qualifying', 'finding contacts', 'ai summary', 'done'];

export default function SearchDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [unlockTick, setUnlockTick] = useState(0);
  const onUnlocked = useCallback(() => setUnlockTick((n) => n + 1), []);

  useEffect(() => {
    let timer;
    let alive = true;
    const tick = async () => {
      try {
        const { data } = await api.get(`/searches/${id}`);
        if (!alive) return;
        setJob(data.job);
        if (!['completed', 'failed'].includes(data.job.status)) timer = setTimeout(tick, 2500);
      } catch (e) {
        if (alive) setError(errMsg(e));
      }
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [id, unlockTick]);

  const done = job?.status === 'completed';
  const locked = Boolean(job?.locked);

  useEffect(() => {
    if (!done || locked) return;
    let alive = true;
    api
      .get('/leads', { params: { jobId: id, limit: 100 } })
      .then((r) => alive && setLeads(r.data.items))
      .catch((e) => alive && setError(errMsg(e)));
    return () => {
      alive = false;
    };
  }, [id, done, locked]);

  if (error) return <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>;
  if (!job) return <div className="text-slate-500">Loading…</div>;

  const p = job.progress || {};
  const stageIdx = Math.max(0, STAGES.indexOf(p.stage));
  const pct = job.status === 'completed' ? 100 : Math.round((stageIdx / (STAGES.length - 1)) * 100);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/searches" className="text-sm text-[#008762]">
            ← Searches
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{job.query}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <StatusBadge status={job.status} />
            <span>{job.sources.map((s) => SOURCE_LABELS[s]).join(' · ')}</span>
            <span>· target {job.targetCount}</span>
            {job.plan?.businessType && (
              <span>
                · plan: {job.plan.businessType}
                {job.plan.locations?.length ? ` in ${job.plan.locations.join(' + ')}` : job.plan.location ? ` in ${job.plan.location}` : ''} → {job.plan.targetRole?.toUpperCase()} ({job.plan.planner})
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaveToGroup payload={{ jobId: id }} defaultName={job.query.slice(0, 120)} disabled={!done || locked || !leads.length} />
          <ExportButtons params={{ jobId: id }} disabled={!done || locked || !leads.length} />
        </div>
      </div>

      {job.status !== 'completed' && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium capitalize">{job.status === 'failed' ? 'Failed' : p.stage}</span>
            <span className="text-slate-500">
              discovered {p.discovered || 0} · crawled {p.crawled || 0}
            </span>
          </div>
          <div className="h-2 rounded bg-slate-200">
            <div className={`h-2 rounded transition-all ${job.status === 'failed' ? 'bg-red-500' : 'bg-[#008762]'}`} style={{ width: `${pct}%` }} />
          </div>
          {job.error && <div className="text-sm text-red-700">{job.error}</div>}
        </div>
      )}

      {locked && job.status !== 'failed' && <VideoAdGate jobId={id} onUnlocked={onUnlocked} />}

      {done && locked && (
        <div className="card text-sm text-slate-600">Results are ready and unlock as soon as the video ad finishes.</div>
      )}

      {done && !locked && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="card">
            <div className="text-sm text-slate-500">Leads</div>
            <div className="text-2xl font-bold">{job.leadCount}</div>
          </div>
          <div className="card">
            <div className="text-sm text-slate-500">With email</div>
            <div className="text-2xl font-bold">{p.withEmail}</div>
          </div>
          <div className="card">
            <div className="text-sm text-slate-500">{job.plan?.targetRole?.toUpperCase()} mailbox</div>
            <div className="text-2xl font-bold text-green-700">{p.withRoleEmail}</div>
          </div>
          <div className="card">
            <div className="text-sm text-slate-500">Businesses scanned</div>
            <div className="text-2xl font-bold">{p.discovered}</div>
          </div>
        </div>
      )}

      {done && !locked && job.cache?.reused > 0 && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
          <b>Shared results:</b> {job.cache.reused} of {job.leadCount} leads came from matching searches in the last few days
          {job.cache.fresh ? `, ${job.cache.fresh} were found fresh` : ''}.
        </div>
      )}

      {job.expiresAt && (
        <div className="text-xs text-slate-500">
          This search and its leads are deleted automatically in {daysLeft(job.expiresAt)} day(s) ({new Date(job.expiresAt).toLocaleDateString()}). Export or save them to a group to keep them.
        </div>
      )}

      {done && !locked && job.quality?.rawResults != null && job.quality.rawResults > 0 && (
        <div className="text-xs text-slate-500">
          Data quality: {job.quality.rawResults} raw results → {job.quality.duplicatesRemoved} duplicates merged, {job.quality.rejected} off-target removed,{' '}
          {job.quality.emailsRemoved} invalid/shared emails removed · AI verification {job.quality.aiChecked ? 'on' : 'off (rule checks only)'}
        </div>
      )}

      {job.summary && <div className="rounded-lg border border-blue-100 bg-[#008762]/10 p-4 text-sm text-[#006e50]"><b>AI summary:</b> {job.summary}</div>}

      <AdSlot placement="dashboard_banner" />

      {done && !locked && (
        <div className="card p-0">
          <LeadsTable leads={leads} />
        </div>
      )}

      <GoogleAd slot="banner" />

      <div>
        <button type="button" className="text-sm text-slate-500 hover:text-slate-800" onClick={() => setShowLogs((v) => !v)}>
          {showLogs ? 'Hide' : 'Show'} agent log ({job.logs?.length || 0})
        </button>
        {showLogs && (
          <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
            {(job.logs || []).map((l) => `${new Date(l.at).toLocaleTimeString()} [${l.level}] ${l.message}`).join('\n')}
          </pre>
        )}
      </div>
    </div>
  );
}
