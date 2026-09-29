import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdSlot from '../components/AdSlot.jsx';
import GoogleAd from '../components/GoogleAd.jsx';
import ExportButtons from '../components/ExportButtons.jsx';
import LeadsTable from '../components/LeadsTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { api, errMsg, SOURCE_LABELS } from '../lib/api.js';

const STAGES = ['planning', 'discovering', 'resolving websites', 'crawling websites', 'qualifying', 'ai summary', 'done'];

export default function SearchDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState('');
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    let timer;
    let alive = true;
    const tick = async () => {
      try {
        const { data } = await api.get(`/searches/${id}`);
        if (!alive) return;
        setJob(data.job);
        if (data.job.status === 'completed') {
          const r = await api.get('/leads', { params: { jobId: id, limit: 100 } });
          if (alive) setLeads(r.data.items);
        } else if (data.job.status !== 'failed') {
          timer = setTimeout(tick, 2500);
        }
      } catch (e) {
        if (alive) setError(errMsg(e));
      }
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [id]);

  if (error) return <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>;
  if (!job) return <div className="text-slate-500">Loading…</div>;

  const p = job.progress || {};
  const stageIdx = Math.max(0, STAGES.indexOf(p.stage));
  const pct = job.status === 'completed' ? 100 : Math.round((stageIdx / (STAGES.length - 1)) * 100);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/searches" className="text-sm text-blue-700">
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
                {job.plan.location ? ` in ${job.plan.location}` : ''} → {job.plan.targetRole?.toUpperCase()} ({job.plan.planner})
              </span>
            )}
          </div>
        </div>
        <ExportButtons params={{ jobId: id }} disabled={job.status !== 'completed' || !leads.length} />
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
            <div className={`h-2 rounded transition-all ${job.status === 'failed' ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${pct}%` }} />
          </div>
          {job.error && <div className="text-sm text-red-700">{job.error}</div>}
        </div>
      )}

      {job.status === 'completed' && (
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

      {job.summary && <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><b>AI summary:</b> {job.summary}</div>}

      <AdSlot placement="dashboard_banner" />

      {job.status === 'completed' && (
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
