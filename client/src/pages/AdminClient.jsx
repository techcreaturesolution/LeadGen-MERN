import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLeadsTable from '../components/admin/AdminLeadsTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { updateClient } from '../lib/admin.js';
import { api, daysLeft, errMsg, fmtDate, SOURCE_LABELS } from '../lib/api.js';

const TABS = { searches: 'Searches', leads: 'Leads', groups: 'Lead groups', campaigns: 'Campaigns', templates: 'Templates' };

export default function AdminClient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('searches');
  const [version, setVersion] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .get(`/admin/users/${id}`)
      .then((r) => alive && setData(r.data))
      .catch((e) => alive && setError(errMsg(e)));
    return () => {
      alive = false;
    };
  }, [id, version]);

  const act = async (body) => {
    setError('');
    try {
      await updateClient(id, body);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const removeClient = async () => {
    if (!window.confirm(`Delete ${data.client.email} and ALL of their searches, leads, groups, templates and campaigns? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      navigate('/admin?tab=clients');
    } catch (e) {
      setError(errMsg(e));
    }
  };

  if (error && !data) return <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>;
  if (!data) return <div className="text-slate-500">Loading…</div>;
  const c = data.client;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/admin?tab=clients" className="text-sm text-[#008762]">
            ← Clients
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{c.name || c.email}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{c.email}</span>
            <span className="badge bg-slate-100 capitalize text-slate-700">{c.role}</span>
            <span className={`badge ${c.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.active ? 'active' : 'disabled'}</span>
            <span>· {c.googleLinked ? 'Google sign-in' : 'email sign-in'}</span>
            <span>· Gmail sending: {c.gmail ? c.gmail.email : 'not connected'}</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Joined {fmtDate(c.createdAt)} · last login {fmtDate(c.lastLoginAt)} · last search {fmtDate(c.lastSearchAt)} · {data.suppressions} unsubscribed contacts
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => act({ role: c.role === 'admin' ? 'user' : 'admin' })}>
            Make {c.role === 'admin' ? 'user' : 'admin'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => act({ active: !c.active })}>
            {c.active ? 'Disable account' : 'Enable account'}
          </button>
          <button type="button" className="btn-secondary text-red-600" onClick={removeClient}>
            Delete client &amp; data
          </button>
        </div>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        {[
          ['Searches', c.searches],
          ['Leads', c.leads],
          ['Leads with email', c.leadsWithEmail],
          ['Lead groups', c.groups],
          ['Campaigns', c.campaigns],
          ['Emails sent', c.emailsSent],
        ].map(([l, v]) => (
          <div key={l} className="card">
            <div className="text-xs text-slate-500">{l}</div>
            <div className="text-xl font-bold">{v}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
        {Object.entries(TABS).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${tab === k ? 'border-[#008762] text-[#008762]' : 'border-transparent text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'searches' && (
        <div className="card overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Query</th>
                <th className="th">Sources</th>
                <th className="th">Leads</th>
                <th className="th">Shared</th>
                <th className="th">Video ad</th>
                <th className="th">Status</th>
                <th className="th">Created</th>
                <th className="th">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.searches.map((j) => (
                <tr key={j._id}>
                  <td className="td font-medium">{j.query}</td>
                  <td className="td text-xs">{j.sources.map((s) => SOURCE_LABELS[s]).join(', ')}</td>
                  <td className="td">
                    {j.leadCount} <span className="text-xs text-slate-400">({j.progress?.withEmail || 0} email)</span>
                  </td>
                  <td className="td text-xs">{j.cache?.reused ? `${j.cache.reused} reused` : '—'}</td>
                  <td className="td text-xs">{!j.adGate?.required ? 'not required' : j.adGate.completedAt ? 'watched' : 'not watched'}</td>
                  <td className="td">
                    <StatusBadge status={j.status} />
                  </td>
                  <td className="td whitespace-nowrap text-xs">{fmtDate(j.createdAt)}</td>
                  <td className="td whitespace-nowrap text-xs">in {daysLeft(j.expiresAt)} d</td>
                </tr>
              ))}
              {!data.searches.length && (
                <tr>
                  <td className="td py-8 text-center text-slate-500" colSpan={8}>
                    No searches in the last retention window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'leads' && <AdminLeadsTable owner={id} showOwner={false} />}

      {tab === 'groups' && (
        <div className="card overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Group</th>
                <th className="th">Members</th>
                <th className="th">Created</th>
                <th className="th">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.groups.map((g) => (
                <tr key={g._id}>
                  <td className="td">
                    <div className="font-medium">{g.name}</div>
                    {g.description && <div className="text-xs text-slate-500">{g.description}</div>}
                  </td>
                  <td className="td">{g.memberCount}</td>
                  <td className="td text-xs">{fmtDate(g.createdAt)}</td>
                  <td className="td text-xs">{fmtDate(g.updatedAt)}</td>
                </tr>
              ))}
              {!data.groups.length && (
                <tr>
                  <td className="td py-8 text-center text-slate-500" colSpan={4}>
                    No lead groups.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'campaigns' && (
        <div className="card overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Campaign</th>
                <th className="th">Group / template</th>
                <th className="th">Mode</th>
                <th className="th">Status</th>
                <th className="th">Sent</th>
                <th className="th">Failed</th>
                <th className="th">Skipped</th>
                <th className="th">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.campaigns.map((cp) => (
                <tr key={cp._id}>
                  <td className="td font-medium">{cp.name}</td>
                  <td className="td text-xs">
                    {cp.groupName} · {cp.templateName}
                  </td>
                  <td className="td text-xs">
                    <StatusBadge status={cp.mode} />
                  </td>
                  <td className="td">
                    <StatusBadge status={cp.status} />
                  </td>
                  <td className="td">{cp.counts?.sent || 0}</td>
                  <td className="td">{cp.counts?.failed || 0}</td>
                  <td className="td">{cp.counts?.skipped || 0}</td>
                  <td className="td whitespace-nowrap text-xs">{fmtDate(cp.createdAt)}</td>
                </tr>
              ))}
              {!data.campaigns.length && (
                <tr>
                  <td className="td py-8 text-center text-slate-500" colSpan={8}>
                    No campaigns.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'templates' && (
        <div className="card overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Template</th>
                <th className="th">Subject</th>
                <th className="th">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.templates.map((t) => (
                <tr key={t._id}>
                  <td className="td font-medium">{t.name}</td>
                  <td className="td text-xs">{t.subject}</td>
                  <td className="td text-xs">{fmtDate(t.updatedAt)}</td>
                </tr>
              ))}
              {!data.templates.length && (
                <tr>
                  <td className="td py-8 text-center text-slate-500" colSpan={3}>
                    No templates.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
