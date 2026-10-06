import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge.jsx';
import { api, errMsg, fmtDate, uploadGroupExcel } from '../lib/api.js';

const ORIGIN = { search: 'Search', leads: 'All leads', excel: 'Excel' };

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [history, setHistory] = useState(null);
  const [tab, setTab] = useState('members');
  const [filter, setFilter] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [manualForm, setManualForm] = useState({ email: '', business: '', city: '', phone: '', website: '' });
  const [manualBusy, setManualBusy] = useState(false);

  const [version, setVersion] = useState(0);
  const load = useCallback(() => setVersion((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    Promise.all([api.get(`/groups/${id}`), api.get(`/groups/${id}/history`)])
      .then(([g, h]) => {
        if (!alive) return;
        setGroup(g.data.group);
        setHistory(h.data);
      })
      .catch((e) => alive && setError(errMsg(e)));
    return () => {
      alive = false;
    };
  }, [id, version]);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    setNotice('');
    try {
      const r = await uploadGroupExcel(id, file);
      setNotice(
        `Imported "${file.name}" (sheet ${r.sheet}): ${r.added} added, ${r.duplicates} already in group, ${r.withoutEmail} rows without a valid email.`,
      );
      load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setUploading(false);
    }
  };

  const addManualContact = async () => {
    setManualBusy(true);
    setError('');
    setNotice('');
    try {
      const { data } = await api.post(`/groups/${id}/members/manual`, manualForm);
      if (data.duplicates) {
        setNotice('Contact already exists in this group.');
        setAddModal(false);
      } else if (data.withoutEmail) {
        setError('Invalid email address.');
      } else {
        setNotice('Contact added successfully.');
        setAddModal(false);
        setManualForm({ email: '', business: '', city: '', phone: '', website: '' });
        load();
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setManualBusy(false);
    }
  };
  const remove = async (m) => {
    await api.delete(`/groups/${id}/members/${m._id}`).catch((e) => setError(errMsg(e)));
    load();
  };

  const del = async () => {
    if (!window.confirm(`Delete group "${group.name}"? Campaign history is kept.`)) return;
    try {
      await api.delete(`/groups/${id}`);
      navigate('/groups');
    } catch (e) {
      setError(errMsg(e));
    }
  };

  if (!group) return <div className="text-slate-500">{error || 'Loading…'}</div>;
  const q = filter.toLowerCase();
  const members = group.members.filter((m) => !q || [m.email, m.business, m.city].some((v) => v?.toLowerCase().includes(q)));
  const s = history?.summary;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/groups" className="text-sm text-[#008762]">
            ← Lead groups
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{group.name}</h1>
          {group.description && <p className="text-sm text-slate-500">{group.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => setAddModal(true)}>
            Add Contact
          </button>
          <label className={`btn-secondary cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
            {uploading ? 'Importing…' : 'Upload Excel'}
            <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={upload} disabled={uploading} />
          </label>
          <Link to={`/campaigns?groupId=${id}`} className={`btn-primary ${group.members.length ? '' : 'pointer-events-none opacity-50'}`}>
            Send email to this group
          </Link>
          <button type="button" className="btn-secondary text-red-600" onClick={del}>
            Delete
          </button>
        </div>
      </div>

      {notice && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</div>}
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {s && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ['Contacts', s.members],
            ['Campaigns', s.campaigns],
            ['Emailed', s.contacted],
            ['Not emailed yet', s.notContacted],
          ].map(([k, v]) => (
            <div key={k} className="card">
              <div className="text-sm text-slate-500">{k}</div>
              <div className="text-2xl font-bold">{v}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200">
        {[
          ['members', `Contacts (${group.members.length})`],
          ['history', `Mail history (${history?.campaigns.length || 0})`],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === k ? 'border-[#008762] text-[#008762]' : 'border-transparent text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'members' ? (
        <div className="card space-y-3 p-0">
          <div className="p-3 pb-0">
            <input className="input max-w-sm" placeholder="Filter by email, business, city" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          {!group.members.length ? (
            <div className="p-10 text-center text-sm text-slate-500">
              This group is empty. Use <b>Save to group</b> on a search or All leads, or upload an Excel report (a sheet with an Email column).
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">Business</th>
                    <th className="th">Email</th>
                    <th className="th">City</th>
                    <th className="th">Added from</th>
                    <th className="th">Last emailed</th>
                    <th className="th" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m._id}>
                      <td className="td">
                        <div className="font-medium">{m.business || '—'}</div>
                        {m.website && <div className="text-xs text-slate-500">{m.website.replace(/^https?:\/\/(www\.)?/, '')}</div>}
                      </td>
                      <td className="td">{m.email}</td>
                      <td className="td">{m.city || '—'}</td>
                      <td className="td text-xs">{ORIGIN[m.origin] || '—'}</td>
                      <td className="td text-xs">
                        {m.lastEmailedAt ? (
                          <>
                            {fmtDate(m.lastEmailedAt)}
                            <div className="text-slate-500">
                              {m.lastTemplateName} · {m.emailsSent} total
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400">never</span>
                        )}
                      </td>
                      <td className="td text-right">
                        <button type="button" className="text-xs text-slate-400 hover:text-red-600" onClick={() => remove(m)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-0" data-testid="group-history">
          {!history?.campaigns.length ? (
            <div className="p-10 text-center text-sm text-slate-500">No emails have been sent to this group yet.</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Date</th>
                  <th className="th">Campaign</th>
                  <th className="th">Template</th>
                  <th className="th">Mode</th>
                  <th className="th">Status</th>
                  <th className="th">Sent</th>
                  <th className="th">Failed</th>
                  <th className="th">Skipped</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.campaigns.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="td whitespace-nowrap text-xs">{fmtDate(c.createdAt)}</td>
                    <td className="td">
                      <Link to={`/campaigns/${c._id}`} className="font-medium text-[#008762] hover:underline">
                        {c.name}
                      </Link>
                      <div className="text-xs text-slate-500">from {c.from?.email}</div>
                    </td>
                    <td className="td text-sm">
                      {c.templateName}
                      <div className="text-xs text-slate-500">{c.subject}</div>
                    </td>
                    <td className="td text-xs">{c.mode === 'gmail' ? 'Gmail' : 'Test run'}</td>
                    <td className="td">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="td">{c.counts.sent}</td>
                    <td className="td">{c.counts.failed}</td>
                    <td className="td">{c.counts.skipped}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {addModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4" role="dialog">
          <div className="card w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Add Contact Manually</h2>
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Email *</span>
                <input type="email" className="input" placeholder="name@company.com" value={manualForm.email} onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Business Name</span>
                <input type="text" className="input" placeholder="e.g. Acme Corp" value={manualForm.business} onChange={(e) => setManualForm({ ...manualForm, business: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">City</span>
                <input type="text" className="input" placeholder="e.g. New York" value={manualForm.city} onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Phone</span>
                <input type="text" className="input" placeholder="+1 234 567 8900" value={manualForm.phone} onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Website</span>
                <input type="text" className="input" placeholder="https://..." value={manualForm.website} onChange={(e) => setManualForm({ ...manualForm, website: e.target.value })} />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setAddModal(false)}>Cancel</button>
              <button type="button" className="btn-primary" disabled={!manualForm.email || manualBusy} onClick={addManualContact}>
                {manualBusy ? 'Adding...' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
