import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg } from '../lib/api.js';

export default function SaveToGroup({ payload, label = 'Save to group', disabled, defaultName = '', className }) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState('new');
  const [name, setName] = useState(defaultName);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    api
      .get('/groups')
      .then((r) => setGroups(r.data.items))
      .catch((e) => setError(errMsg(e)));
  }, [open]);

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      let id = groupId;
      if (id === 'new') id = (await api.post('/groups', { name: name.trim() })).data.group._id;
      const { data } = await api.post(`/groups/${id}/members`, payload);
      setResult({ ...data, id });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setOpen(false);
    setResult(null);
    setError('');
  };

  return (
    <>
      <button type="button" className={className || "btn-primary px-3 py-1.5"} disabled={disabled} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
          <div className="card w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Save leads to a group</h2>
            {result ? (
              <div className="space-y-3 text-sm">
                <p>
                  Added <b>{result.added}</b> leads with email. {result.duplicates ? `${result.duplicates} were already in the group. ` : ''}
                  {result.withoutEmail ? `${result.withoutEmail} skipped (no email). ` : ''}The group now has <b>{result.total}</b> contacts.
                </p>
                <div className="flex justify-end gap-2">
                  <button type="button" className="btn-secondary" onClick={close}>
                    Close
                  </button>
                  <Link className="btn-primary" to={`/groups/${result.id}`}>
                    Open group
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Group</span>
                  <select className="input" value={groupId} onChange={(e) => setGroupId(e.target.value)} aria-label="Group">
                    <option value="new">+ New group…</option>
                    {groups.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name} ({g.memberCount})
                      </option>
                    ))}
                  </select>
                </label>
                {groupId === 'new' && (
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-700">New group name</span>
                    <input className="input" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="e.g. GIDC Gandhinagar – manufacturers" />
                  </label>
                )}
                <p className="text-xs text-slate-500">Only leads with an email address are added. Duplicate emails are added once.</p>
                {error && <div className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</div>}
                <div className="flex justify-end gap-2">
                  <button type="button" className="btn-secondary" onClick={close}>
                    Cancel
                  </button>
                  <button type="button" className="btn-primary" disabled={busy || (groupId === 'new' && !name.trim())} onClick={save}>
                    {busy ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
