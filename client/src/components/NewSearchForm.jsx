import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errMsg, SOURCE_LABELS } from '../lib/api.js';

const EXAMPLES = [
  'HR email of IT companies in Ahmedabad',
  'Sales contacts of real estate builders in Surat',
  'CEO email of pharma companies in Vadodara',
  'Contact email of digital marketing agencies in Pune',
];

const providerLabel = {
  google_places: 'Google Places API',
  serpapi_google_maps: 'SerpAPI Google Maps',
  openstreetmap: 'OpenStreetMap (free fallback)',
  serpapi: 'SerpAPI',
  google_cse: 'Google Programmable Search',
  bing_html: 'Bing (experimental)',
};

export default function NewSearchForm() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [sources, setSources] = useState(['google_maps', 'linkedin', 'instagram']);
  const [targetCount, setTargetCount] = useState(20);
  const [caps, setCaps] = useState(null);
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/searches/capabilities').then((r) => setCaps(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (query.trim().length < 5) return undefined;
    const t = setTimeout(() => {
      api
        .post('/searches/preview-plan', { query })
        .then((r) => setPlan(r.data.plan))
        .catch(() => setPlan(null));
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const toggle = (s) => setSources((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/searches', { query, sources, targetCount });
      navigate(`/searches/${data.job._id}`);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const socialDisabled = caps && !caps.webSearch;

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">New lead search</h2>
        <p className="text-sm text-slate-500">Describe who you want in plain English. The AI agent plans the search, scans sources and crawls websites for emails.</p>
      </div>
      <div>
        <input
          className="input text-base"
          placeholder="e.g. HR email of IT companies in Ahmedabad"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length < 5) setPlan(null);
          }}
          required
          minLength={3}
          maxLength={200}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200" onClick={() => setQuery(ex)}>
              {ex}
            </button>
          ))}
        </div>
      </div>
      {plan && (
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
          <span className="font-semibold">Agent plan:</span> find <b>{plan.businessType}</b>
          {plan.location && (
            <>
              {' '}
              in <b>{plan.location}</b>
            </>
          )}{' '}
          · target mailbox <b>{plan.targetRole.toUpperCase()}</b> ({plan.emailPrefixes.slice(0, 4).join('@, ')}@…)
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-medium text-slate-700">Sources</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SOURCE_LABELS).map(([k, label]) => {
              const off = k !== 'google_maps' && socialDisabled;
              return (
                <label
                  key={k}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${sources.includes(k) ? 'border-blue-600 bg-blue-50' : 'border-slate-300'} ${off ? 'opacity-50' : ''}`}
                  title={off ? 'Needs SERPAPI_KEY or GOOGLE_CSE_KEY on the server' : ''}
                >
                  <input type="checkbox" checked={sources.includes(k)} onChange={() => toggle(k)} />
                  {label}
                </label>
              );
            })}
          </div>
          {caps && (
            <div className="mt-2 text-xs text-slate-500">
              Maps: {providerLabel[caps.maps]} · Social: {caps.webSearch ? providerLabel[caps.webSearch] : 'not configured'} · AI: {caps.ai === 'openai' ? 'OpenAI' : 'rule-based'}
            </div>
          )}
        </div>
        <div>
          <div className="mb-2 text-sm font-medium text-slate-700">How many leads?</div>
          <div className="flex gap-2">
            {[20, 40, 60].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTargetCount(n)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold ${targetCount === n ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="flex justify-end">
        <button className="btn-primary px-6" disabled={busy || !sources.length || query.trim().length < 3}>
          {busy ? 'Starting…' : 'Generate leads'}
        </button>
      </div>
    </form>
  );
}
