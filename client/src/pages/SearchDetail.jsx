import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, Users, UserCheck, AlertCircle } from 'lucide-react';
import AdSlot from '../components/AdSlot.jsx';
import GoogleAd from '../components/GoogleAd.jsx';
import ExportButtons from '../components/ExportButtons.jsx';
import LeadsTable from '../components/LeadsTable.jsx';
import SaveToGroup from '../components/SaveToGroup.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import VideoAdGate from '../components/VideoAdGate.jsx';
import { api, daysLeft, downloadExport, errMsg, SOURCE_LABELS } from '../lib/api.js';

const STAGES = ['planning', 'discovering', 'resolving websites', 'enriching companies', 'crawling websites', 'qualifying', 'finding contacts', 'ai summary', 'done'];

export default function SearchDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [leads, setLeads] = useState([]);
  const [matchFilter, setMatchFilter] = useState('all');
  const [error, setError] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [unlockTick, setUnlockTick] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());

  const toggle = (leadId) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });

  const toggleAll = (rows, on) =>
    setSelected((prev) => {
      const next = new Set(prev);
      rows.forEach((l) => (on ? next.add(l._id) : next.delete(l._id)));
      return next;
    });

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      if (selected.size > 0) {
        await downloadExport({ ids: [...selected].join(','), format: 'xlsx', count: 'all' });
      } else {
        await downloadExport({ jobId: id, format: 'xlsx', count: 'all' });
      }
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setIsExporting(false);
    }
  };

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

  const verifiedCount = leads.filter((l) => l.verification === 'verified').length;
  const likelyCount = leads.filter((l) => l.verification === 'likely').length;
  const filteredLeads = leads.filter((l) => {
    if (matchFilter === 'verified') return l.verification === 'verified';
    if (matchFilter === 'likely') return l.verification === 'likely';
    return true;
  });

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
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/90 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-[#008762]">
                <Users size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  {selected.size > 0 ? `${selected.size} of ${leads.length} Leads Selected` : `Search Leads (${leads.length})`}
                </h2>
                <p className="text-[11px] text-slate-500">Perfect 100% matches listed first, followed by ~50% partial matches for "{job.query}"</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-slate-500 hover:text-slate-800 underline mr-1 cursor-pointer"
                >
                  Clear selection
                </button>
              )}
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={!leads.length || isExporting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#008762] hover:bg-[#006e50] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:shadow hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Download size={14} className={isExporting ? "animate-bounce" : ""} />
                {isExporting ? 'Exporting...' : selected.size > 0 ? `Export (${selected.size}) to Excel` : 'Export to Excel (.xlsx)'}
              </button>
            </div>
          </div>
          {leads.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/50 px-5 py-2.5 text-xs">
              <span className="font-semibold text-slate-500 mr-1">Match Filter:</span>
              <button
                type="button"
                onClick={() => setMatchFilter('all')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
                  matchFilter === 'all'
                    ? 'bg-[#008762] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Leads ({leads.length})
              </button>
              <button
                type="button"
                onClick={() => setMatchFilter('verified')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
                  matchFilter === 'verified'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <UserCheck size={13} className={matchFilter === 'verified' ? 'text-white' : 'text-emerald-700'} />
                100% Perfect Matches ({verifiedCount})
              </button>
              <button
                type="button"
                onClick={() => setMatchFilter('likely')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
                  matchFilter === 'likely'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <AlertCircle size={13} className={matchFilter === 'likely' ? 'text-white' : 'text-amber-600'} />
                ~50% Partial Matches ({likelyCount})
              </button>
            </div>
          )}
          <LeadsTable 
            leads={filteredLeads} 
            showRank={true} 
            selected={selected} 
            onToggle={toggle} 
            onToggleAll={toggleAll} 
          />
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
