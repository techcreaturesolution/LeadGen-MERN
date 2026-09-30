import { useEffect, useRef, useState } from 'react';
import { api, errMsg } from '../lib/api.js';

const EMPTY = { _id: null, name: '', subject: '', body: '' };

export default function Templates() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ fields: {}, presets: [], ai: false });
  const [form, setForm] = useState(EMPTY);
  const [preview, setPreview] = useState(null);
  const [offer, setOffer] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const bodyRef = useRef(null);

  const load = () => api.get('/templates').then((r) => setItems(r.data.items));
  useEffect(() => {
    Promise.all([load(), api.get('/templates/meta').then((r) => setMeta(r.data))]).catch((e) => setError(errMsg(e)));
  }, []);

  useEffect(() => {
    if (!form.subject && !form.body) return;
    const t = setTimeout(() => {
      api
        .post('/templates/preview', { subject: form.subject, body: form.body })
        .then((r) => setPreview(r.data))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [form.subject, form.body]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const insertField = (key) => {
    const el = bodyRef.current;
    const tag = `{{${key}}}`;
    const pos = el ? el.selectionStart : form.body.length;
    setForm((f) => ({ ...f, body: f.body.slice(0, pos) + tag + f.body.slice(pos) }));
  };

  const save = async () => {
    setBusy('save');
    setError('');
    setNotice('');
    try {
      const body = { name: form.name, subject: form.subject, body: form.body };
      const { data } = form._id ? await api.put(`/templates/${form._id}`, body) : await api.post('/templates', body);
      setForm(data.template);
      setNotice('Template saved.');
      await load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy('');
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    await api.delete(`/templates/${t._id}`).catch((e) => setError(errMsg(e)));
    if (form._id === t._id) setForm(EMPTY);
    load();
  };

  const draft = async () => {
    setBusy('draft');
    setError('');
    try {
      const { data } = await api.post('/templates/draft', { offer });
      setForm({ ...EMPTY, ...data.draft });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Email templates</h1>
        <p className="text-sm text-slate-500">Write your offer once. Fields like {'{{business}}'} and {'{{city}}'} are filled in for every lead when the mail is sent.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <div className="space-y-4">
          <div className="card space-y-2 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">My templates</span>
              <button type="button" className="text-xs text-blue-700" onClick={() => setForm(EMPTY)}>
                + New
              </button>
            </div>
            {!items.length && <div className="text-xs text-slate-500">No templates yet. Start from a ready-made one below.</div>}
            {items.map((t) => (
              <div key={t._id} className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm ${form._id === t._id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                <button type="button" className="min-w-0 truncate text-left" onClick={() => setForm(t)}>
                  {t.name}
                </button>
                <button type="button" className="text-xs text-slate-400 hover:text-red-600" onClick={() => remove(t)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="card space-y-2 p-3">
            <span className="text-sm font-semibold">Ready-made</span>
            {meta.presets.map((p) => (
              <button key={p.key} type="button" className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50" onClick={() => setForm({ ...EMPTY, ...p })}>
                {p.name}
              </button>
            ))}
          </div>
          {meta.ai && (
            <div className="card space-y-2 p-3">
              <span className="text-sm font-semibold">Draft with AI</span>
              <input className="input" placeholder="e.g. ERP software for manufacturers" value={offer} onChange={(e) => setOffer(e.target.value)} />
              <button type="button" className="btn-secondary w-full" disabled={offer.trim().length < 3 || busy === 'draft'} onClick={draft}>
                {busy === 'draft' ? 'Writing…' : 'Write a draft'}
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="card space-y-3">
            <input className="input" placeholder="Template name, e.g. Website development offer" value={form.name} onChange={set('name')} aria-label="Template name" />
            <input className="input" placeholder="Subject" value={form.subject} onChange={set('subject')} aria-label="Subject" />
            <textarea ref={bodyRef} className="input min-h-[280px] font-mono text-[13px]" placeholder="Email body" value={form.body} onChange={set('body')} aria-label="Body" />
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(meta.fields).map(([k, label]) => (
                <button key={k} type="button" title={label} className="badge bg-slate-100 text-slate-700 hover:bg-blue-100" onClick={() => insertField(k)}>
                  {`{{${k}}}`}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Tip: {'{{city|your city}}'} uses “your city” when a lead has no city. An unsubscribe link is added at the bottom of every email automatically.
            </p>
            {preview?.unknown?.length > 0 && <div className="text-sm text-red-600">Unknown fields: {preview.unknown.map((f) => `{{${f}}}`).join(', ')}</div>}
            {error && <div className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</div>}
            {notice && <div className="rounded-lg bg-green-50 p-2 text-sm text-green-800">{notice}</div>}
            <button type="button" className="btn-primary" disabled={!form.name.trim() || !form.subject.trim() || !form.body.trim() || busy === 'save'} onClick={save}>
              {busy === 'save' ? 'Saving…' : form._id ? 'Save changes' : 'Save template'}
            </button>
          </div>
          <div className="card space-y-2" data-testid="template-preview">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview for a sample lead</div>
            {preview ? (
              <>
                <div className="text-xs text-slate-500">
                  From: {preview.from.name} &lt;{preview.from.email}&gt; · To: {preview.recipient.email}
                </div>
                <div className="font-semibold">{preview.subject}</div>
                <div className="rounded-lg border border-slate-100 p-3" dangerouslySetInnerHTML={{ __html: preview.html }} />
              </>
            ) : (
              <div className="text-sm text-slate-400">Start typing or pick a ready-made template.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
