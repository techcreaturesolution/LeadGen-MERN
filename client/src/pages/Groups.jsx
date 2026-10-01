import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, errMsg, fmtDate } from '../lib/api.js';

export default function Groups() {
  const [items, setItems] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/groups')
      .then((r) => setItems(r.data.items))
      .catch((e) => setError(errMsg(e)));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/groups', { name, description });
      navigate(`/groups/${data.group._id}`);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Lead groups</h1>
        <p className="text-sm text-slate-500">
          Save leads from a search, from All leads, or upload an Excel report. Then send an email template to the whole group from your Gmail.
        </p>
      </div>
      <form onSubmit={create} className="card grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <input className="input" placeholder="Group name, e.g. GIDC Gandhinagar" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Description (optional)" value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} />
        <button className="btn-primary" disabled={!name.trim()}>
          Create group
        </button>
      </form>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="card p-0">
        {!items ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : !items.length ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No groups yet. Open a search and click <b>Save to group</b>, or create a group above and upload an Excel file.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Group</th>
                <th className="th">Contacts</th>
                <th className="th">Campaigns</th>
                <th className="th">Emails sent</th>
                <th className="th">Last campaign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((g) => (
                <tr key={g._id} className="hover:bg-slate-50">
                  <td className="td">
                    <Link to={`/groups/${g._id}`} className="font-medium text-blue-700 hover:underline">
                      {g.name}
                    </Link>
                    {g.description && <div className="text-xs text-slate-500">{g.description}</div>}
                  </td>
                  <td className="td">{g.memberCount}</td>
                  <td className="td">{g.campaigns}</td>
                  <td className="td">{g.sent}</td>
                  <td className="td text-xs text-slate-500">{fmtDate(g.lastCampaignAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
