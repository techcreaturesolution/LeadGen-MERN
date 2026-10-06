import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import GmailConnect from '../components/GmailConnect.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { api, errMsg, fmtDate } from '../lib/api.js';
import { useGmailStatus } from '../lib/gmail.js';

export default function Campaigns() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, reloadStatus] = useGmailStatus();
  const [groups, setGroups] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ groupId: params.get('groupId') || '', templateId: '', mode: 'dry_run', skipAlreadyEmailed: true, name: '' });
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const gmailBanner = params.get('gmail');

  useEffect(() => {
    Promise.all([api.get('/groups'), api.get('/templates'), api.get('/campaigns')])
      .then(([g, t, c]) => {
        setGroups(g.data.items);
        setTemplates(t.data.items);
        setItems(c.data.items);
      })
      .catch((e) => setError(errMsg(e)));
  }, []);

  const canGmail = status?.connected && status.configured && !status.forceDryRun;
  const mode = canGmail ? form.mode : 'dry_run';
  const template = templates.find((t) => t._id === form.templateId);
  const group = groups.find((g) => g._id === form.groupId);

  useEffect(() => {
    if (!template) return;
    api
      .post('/templates/preview', { subject: template.subject, body: template.body, groupId: form.groupId || undefined })
      .then((r) => setPreview(r.data))
      .catch(() => {});
  }, [template, form.groupId]);

  const start = async () => {
    if (mode === 'gmail' && !window.confirm(`Send "${template.name}" to ${group.memberCount} contacts from ${status.email}?`)) return;
    setBusy('start');
    setError('');
    try {
      const { data } = await api.post('/campaigns', { ...form, mode, name: form.name || undefined });
      navigate(`/campaigns/${data.campaign._id}`);
    } catch (e) {
      setError(errMsg(e));
      setBusy('');
    }
  };

  const testToSelf = async () => {
    setBusy('test');
    setError('');
    setNotice('');
    try {
      const { data } = await api.post('/campaigns/test', { templateId: form.templateId, groupId: form.groupId || undefined });
      setNotice(`Test email sent to ${data.to}. Check your Gmail inbox.`);
      reloadStatus();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Email campaigns</h1>
      {gmailBanner === 'connected' && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Gmail connected. Campaigns will be sent from your Gmail.</div>}
      {gmailBanner === 'error' && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Gmail was not connected: {params.get('reason') || 'unknown error'}
          <button type="button" className="ml-2 underline" onClick={() => setParams({})}>
            dismiss
          </button>
        </div>
      )}
      <GmailConnect status={status} onChange={reloadStatus} />

      <div className="card space-y-4">
        <h2 className="font-semibold">New campaign</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Lead group</span>
            <select className="input" value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })} aria-label="Lead group">
              <option value="">Choose a group…</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name} ({g.memberCount} contacts)
                </option>
              ))}
            </select>
            {!groups.length && (
              <span className="text-xs text-slate-500">
                No groups yet. <Link to="/groups" className="text-[#008762]">Create one</Link>.
              </span>
            )}
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Template</span>
            <select className="input" value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })} aria-label="Template">
              <option value="">Choose a template…</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
            {!templates.length && (
              <span className="text-xs text-slate-500">
                No templates yet. <Link to="/templates" className="text-[#008762]">Create one</Link>.
              </span>
            )}
          </label>
          <input className="input" placeholder="Campaign name (optional)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === 'gmail'} disabled={!canGmail} onChange={() => setForm({ ...form, mode: 'gmail' })} />
              Send from my Gmail{status?.email ? ` (${status.email})` : ''}
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === 'dry_run'} onChange={() => setForm({ ...form, mode: 'dry_run' })} />
              Test run (no emails sent)
            </label>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.skipAlreadyEmailed} onChange={(e) => setForm({ ...form, skipAlreadyEmailed: e.target.checked })} />
          Skip contacts who already received this template from my Gmail
        </label>

        {preview && (
          <div className="rounded-lg border border-slate-200 p-4" data-testid="campaign-preview">
            <div className="text-xs text-slate-500">
              Preview for {preview.recipient.business || preview.recipient.email} · From: {preview.from.name} &lt;{preview.from.email}&gt;
            </div>
            <div className="mt-1 font-semibold">{preview.subject}</div>
            <div className="mt-2" dangerouslySetInnerHTML={{ __html: preview.html }} />
          </div>
        )}

        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</div>}
        <div className="flex flex-wrap gap-2">
          <button 
            type="button" 
            className="btn-primary" 
            disabled={busy === 'start'} 
            onClick={() => {
              if (!group) return setError('Please select a Lead group first.');
              if (!template) return setError('Please select a Template first.');
              if (!group.memberCount) return setError('The selected group has 0 contacts. Add some leads to the group first.');
              start();
            }}
          >
            {busy === 'start' ? 'Starting…' : mode === 'gmail' ? `Send to ${group?.memberCount || 0} contacts` : 'Start test run'}
          </button>
          {canGmail && (
            <button 
              type="button" 
              className="btn-secondary" 
              disabled={busy === 'test'} 
              onClick={() => {
                if (!template) return setError('Please select a Template to send a test email.');
                testToSelf();
              }}
            >
              {busy === 'test' ? 'Sending…' : 'Send a test to myself'}
            </button>
          )}
        </div>
      </div>

      <div className="card p-0">
        <div className="px-4 py-3 font-semibold">History</div>
        {!items.length ? (
          <div className="p-8 text-center text-sm text-slate-500">No campaigns yet.</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Date</th>
                <th className="th">Campaign</th>
                <th className="th">Group</th>
                <th className="th">Mode</th>
                <th className="th">Status</th>
                <th className="th">Sent / Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50">
                  <td className="td whitespace-nowrap text-xs">{fmtDate(c.createdAt)}</td>
                  <td className="td">
                    <Link to={`/campaigns/${c._id}`} className="font-medium text-[#008762] hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="td">{c.group ? <Link to={`/groups/${c.group}`}>{c.groupName}</Link> : c.groupName}</td>
                  <td className="td text-xs">{c.mode === 'gmail' ? 'Gmail' : 'Test run'}</td>
                  <td className="td">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="td">
                    {c.counts.sent} / {c.counts.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
