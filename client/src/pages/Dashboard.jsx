import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdSlot from '../components/AdSlot.jsx';
import GoogleAd from '../components/GoogleAd.jsx';
import NewSearchForm from '../components/NewSearchForm.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-[#008762] to-[#006e50] p-5 shadow-md text-white relative overflow-hidden">
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white opacity-10 blur-xl"></div>
      <div className="text-[11px] font-bold text-emerald-100 uppercase tracking-widest relative z-10">{label}</div>
      <div className="mt-1.5 text-3xl font-black tracking-tight relative z-10 drop-shadow-sm">{value ?? '—'}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    api.get('/leads/stats').then((r) => setStats(r.data)).catch(() => {});
    api.get('/searches', { params: { limit: 5 } }).then((r) => setJobs(r.data.items)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name?.split(' ')[0] || 'there'}</h1>
        <p className="text-sm text-slate-500">Generate targeted B2B leads and export them to Excel.</p>
      </div>
      <AdSlot placement="dashboard_banner" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Searches" value={stats?.searches} />
        <Stat label="Total leads" value={stats?.totalLeads} />
        <Stat label="Leads with email" value={stats?.withEmail} />
        <Stat label="HR emails" value={stats?.hr} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NewSearchForm />
        </div>
        <div className="space-y-4">
          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Recent searches</h2>
              <Link to="/searches" className="text-sm font-semibold text-[#008762] hover:text-[#006e50]">
                View all
              </Link>
            </div>
            {!jobs.length && <div className="text-sm text-slate-500">No searches yet.</div>}
            <ul className="divide-y divide-slate-100">
              {jobs.map((j) => (
                <li key={j._id} className="py-2">
                  <Link to={`/searches/${j._id}`} className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-slate-800">{j.query}</span>
                    <StatusBadge status={j.status} />
                  </Link>
                  <div className="text-xs text-slate-500">
                    {j.leadCount} leads · {new Date(j.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <AdSlot placement="inline" limit={2} />
          <GoogleAd slot="inline" className="xl:hidden" />
        </div>
      </div>
    </div>
  );
}
