import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg } from '../lib/api.js';

const MERGE_TAGS = [
  { tag: '{{business}}', label: 'Company name' },
  { tag: '{{city}}', label: 'City' },
  { tag: '{{website}}', label: 'Website' },
  { tag: '{{email}}', label: 'Email' },
  { tag: '{{category}}', label: 'Category' },
  { tag: '{{my_name}}', label: 'Your name' },
  { tag: '{{my_email}}', label: 'Your email' },
];

export default function GenerateTemplateModal({ search, initialDraft, onClose, onTemplateSaved }) {
  const [draft, setDraft] = useState(initialDraft || { name: '', subject: '', body: '', researchSummary: '', keywords: [] });
  const [step, setStep] = useState('review'); // 'review' | 'saved'
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedTemplate, setSavedTemplate] = useState(null);
  const [sampleLead, setSampleLead] = useState(null);

  const bodyRef = useRef(null);

  useEffect(() => {
    if (!search?._id) return;
    let alive = true;
    api
      .get('/leads', { params: { jobId: search._id, limit: 1 } })
      .then((r) => {
        if (alive && r.data.items?.[0]) {
          setSampleLead(r.data.items[0]);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [search?._id]);

  const handleSave = async () => {
    if (!draft?.name?.trim() || !draft?.subject?.trim() || !draft?.body?.trim()) {
      setError('Template name, subject, and body cannot be empty.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await api.post('/templates', {
        name: draft.name.trim(),
        subject: draft.subject.trim(),
        body: draft.body.trim(),
      });
      setSavedTemplate(res.data.template);
      setStep('saved');
      if (onTemplateSaved) onTemplateSaved(res.data.template);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const insertTag = (tag) => {
    if (!bodyRef.current || !draft) return;
    const el = bodyRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newBody = draft.body.slice(0, start) + tag + draft.body.slice(end);
    setDraft((prev) => ({ ...prev, body: newBody }));
  };

  const sampleBusinessName = sampleLead?.name || 'ABC Realty';
  const sampleCity = sampleLead?.city || 'Surat';

  const previewSubject = (draft?.subject || '')
    .replace(/\{\{\s*business(\s*\|[^}]*)?\}\}/gi, sampleBusinessName)
    .replace(/\{\{\s*city(\s*\|[^}]*)?\}\}/gi, sampleCity);

  const previewBody = (draft?.body || '')
    .replace(/\{\{\s*business(\s*\|[^}]*)?\}\}/gi, sampleBusinessName)
    .replace(/\{\{\s*city(\s*\|[^}]*)?\}\}/gi, sampleCity)
    .replace(/\{\{\s*website(\s*\|[^}]*)?\}\}/gi, sampleLead?.website || 'https://example.com')
    .replace(/\{\{\s*my_name\}\}/gi, 'Your Name')
    .replace(/\{\{\s*my_email\}\}/gi, 'you@example.com');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Generated AI Email Template</h2>
            <p className="text-xs text-slate-500">
              For search: <span className="font-medium text-[#008762]">"{search?.query}"</span> ({search?.leadCount || 0} leads)
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1" aria-label="Close">
            ✕
          </button>
        </div>

        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {/* Step: Review & Edit Draft */}
        {step === 'review' && draft && (
          <div className="space-y-4">
            {/* Research & Context Summary */}
            {draft.researchSummary && (
              <div className="rounded-lg bg-emerald-50/70 border border-emerald-200/60 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#006e50]">
                    AI Audience & Research Summary
                  </span>
                  <span className="text-xs text-slate-500">{search?.leadCount || 0} leads analyzed</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{draft.researchSummary}</p>
                {draft.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {draft.keywords.map((k) => (
                      <span key={k} className="badge bg-white/80 border border-emerald-200 text-[#006e50]">
                        #{k}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dynamic personalization notice */}
            <div className="rounded-lg bg-blue-50/70 border border-blue-200/60 p-2.5 text-xs text-blue-800">
              <b>Dynamic Personalization:</b> The variable <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">{'{{business}}'}</code> will be automatically replaced with each recipient's actual company name when sending.
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Template Name</label>
                <input
                  type="text"
                  className="input"
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  maxLength={120}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Subject Line</label>
                <input
                  type="text"
                  className="input"
                  value={draft.subject}
                  onChange={(e) => setDraft((prev) => ({ ...prev, subject: e.target.value }))}
                  maxLength={250}
                  disabled={saving}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700">Email Body</label>
                  <span className="text-xs text-slate-400">Click merge tags below to insert</span>
                </div>
                <textarea
                  ref={bodyRef}
                  className="input min-h-[160px] font-mono text-xs leading-relaxed"
                  value={draft.body}
                  onChange={(e) => setDraft((prev) => ({ ...prev, body: e.target.value }))}
                  disabled={saving}
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {MERGE_TAGS.map(({ tag, label }) => (
                    <button
                      key={tag}
                      type="button"
                      title={label}
                      className="badge bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-[#008762] cursor-pointer"
                      onClick={() => insertTag(tag)}
                      disabled={saving}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Recipient Preview */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Sample Lead Preview (e.g. {sampleBusinessName})
              </div>
              <div className="text-xs font-semibold text-slate-800">
                Subject: <span className="font-normal">{previewSubject}</span>
              </div>
              <div className="text-xs text-slate-700 whitespace-pre-line border-t border-slate-200/80 pt-2 font-sans leading-relaxed">
                {previewBody}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" className="btn-secondary text-xs" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary text-xs"
                onClick={handleSave}
                disabled={saving || !draft.name.trim() || !draft.subject.trim() || !draft.body.trim()}
              >
                {saving ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent mr-1" />
                    Saving…
                  </>
                ) : (
                  'Save Template'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step: Saved successfully */}
        {step === 'saved' && savedTemplate && (
          <div className="space-y-4 py-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xl font-bold">
              ✓
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">Template Saved Successfully!</h3>
              <p className="text-xs text-slate-500 mt-1">
                "{savedTemplate.name}" is now available in your Email Templates and ready to use in cold outreach campaigns.
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-left space-y-1">
              <div className="text-xs font-medium text-slate-700">Subject: {savedTemplate.subject}</div>
              <div className="text-xs text-slate-500">
                Personalization: Reusable for all {search?.leadCount || 0} leads with dynamic {'{{business}}'} replacement.
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Close
              </button>
              <Link to="/templates" className="btn-secondary">
                View in Templates
              </Link>
              <Link to="/campaigns" className="btn-primary">
                Create Campaign
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
