import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GoogleAd from '../components/GoogleAd.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import GenerateTemplateModal from '../components/GenerateTemplateModal.jsx';
import { api, daysLeft, errMsg, SOURCE_LABELS } from '../lib/api.js';
import { assembleSinglePageHtmlTemplate, detectIndustryKey, INDUSTRY_THEMES, INDUSTRY_VISUAL_ASSETS } from '../lib/industryTemplates.js';

export default function Searches() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 20 });
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [generatingId, setGeneratingId] = useState(null);
  const [templateModalData, setTemplateModalData] = useState(null);

  const load = (p) =>
    api
      .get('/searches', { params: { page: p, limit: 20 } })
      .then((r) => setData(r.data))
      .catch((e) => setError(errMsg(e)));

  useEffect(() => {
    load(page);
  }, [page]);

  const handleGenerateTemplate = async (search) => {
    if (generatingId) return;
    setGeneratingId(search._id);
    setError('');
    try {
      let draft;
      try {
        const res = await api.post(`/searches/${search._id}/generate-template`, {});
        draft = res.data.draft;
      } catch (err) {
        // If the backend on Render hasn't deployed the new route yet (404), fall back seamlessly to existing deployed endpoints
        if (err.response?.status === 404) {
          const leadsRes = await api.get('/leads', { params: { jobId: search._id, limit: 20 } }).catch(() => ({ data: { items: [] } }));
          const leads = leadsRes.data?.items || [];
          const queryClean = (search.query || 'business leads').replace(/\s+/g, ' ').trim();
          const audience = queryClean;
          const offer = `Professional B2B services and collaboration for ${queryClean}`.slice(0, 290);

          const draftRes = await api.post('/templates/draft', {
            offer,
            audience,
            tone: 'professional',
          });

          const rawDraft = draftRes.data.draft || {};
          const keywords = [
            ...new Set(
              queryClean
                .toLowerCase()
                .split(/\s+/)
                .filter((w) => w.length > 2 && !/^(of|in|for|and|to|the|at|contacts?|emails?|list|all|with)$/i.test(w)),
            ),
          ].slice(0, 5);

          const indKey = detectIndustryKey(`${queryClean} ${leads.map((l) => l.category || '').join(' ')}`);
          const theme = INDUSTRY_THEMES[indKey] || INDUSTRY_THEMES.general_professional;

          let rawBody = rawDraft.body || '';
          rawBody = rawBody.replace(/\{\{\s*company_name(\s*\|[^}]*)?\}\}/gi, (_m, fallback) => `{{business${fallback || ''}}}`);
          const parts = rawBody.split(/\n{2,}/).filter(Boolean);
          const isBakery = indKey === 'bakery_food';
          const mainMessage = parts.slice(0, 2).join(' ') || (
            isBakery
              ? `I came across {{business}} while exploring popular bakeries and food shops in ${search.plan?.location || 'your area'}.`
              : `I came across {{business}} while looking at companies in ${search.plan?.location || 'your area'}.`
          );
          const calloutMessage = parts[2] || (
            isBakery
              ? 'Would you be open to a brief conversation this week about customer reach and orders?'
              : 'Would you be open to a quick 15-minute call this week?'
          );
          const ctaText = isBakery ? 'Connect With Us' : 'Explore Collaboration';
          const heading = isBakery ? `Connecting with {{business}}` : `Strategic Solutions for {{business}}`;
          const asset = INDUSTRY_VISUAL_ASSETS[indKey] || INDUSTRY_VISUAL_ASSETS.general_professional;

          const singlePageHtml = assembleSinglePageHtmlTemplate({
            theme,
            colors: theme.colors,
            heading,
            mainMessage,
            highlights: isBakery
              ? ['Tailored for local bakery orders', 'Custom reach for {{city|your area}}']
              : [`Specialized solutions for ${theme.name}`, `Custom services for {{city|your area}}`],
            featureCards: asset?.defaultCards,
            calloutMessage,
            ctaText,
            includeHeroSvg: true,
          });

          draft = {
            name: rawDraft.name || `${queryClean} Outreach`,
            subject: (rawDraft.subject || (isBakery ? `Connecting with {{business}} in ${search.plan?.location || 'Gandhinagar'}` : `Business Solutions for {{business}}`)).replace(/\{\{\s*company_name(\s*\|[^}]*)?\}\}/gi, (_m, fallback) => `{{business${fallback || ''}}}`),
            body: singlePageHtml,
            industry: theme.key,
            industryName: theme.name,
            audience: theme.audience,
            location: search.plan?.location || '',
            designStyle: theme.designStyle,
            colors: theme.colors,
            visualObjects: asset?.visualObjects || [],
            featureCards: asset?.defaultCards || [],
            researchSummary: `Target audience of ${leads.length || search.leadCount || 0} companies derived from "${queryClean}".`,
            keywords,
          };
        } else {
          throw err;
        }
      }

      setTemplateModalData({ search, draft });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setGeneratingId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this search and its leads?')) return;
    try {
      await api.delete(`/searches/${id}`);
      load(page);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const pages = Math.max(1, Math.ceil(data.total / data.limit));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Searches</h1>
        <Link to="/" className="btn-primary">
          New search
        </Link>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Query</th>
              <th className="th">Sources</th>
              <th className="th">Target</th>
              <th className="th">Leads</th>
              <th className="th">Status</th>
              <th className="th">Created</th>
              <th className="th">Expires</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((j) => (
              <tr key={j._id} className="hover:bg-slate-50">
                <td className="td">
                  <Link to={`/searches/${j._id}`} className="font-medium text-[#008762] hover:underline">
                    {j.query}
                  </Link>
                </td>
                <td className="td text-xs">{j.sources.map((s) => SOURCE_LABELS[s]).join(', ')}</td>
                <td className="td">{j.targetCount}</td>
                <td className="td">
                  <Link to={`/searches/${j._id}`} className="font-semibold text-[#008762] hover:underline flex items-center gap-1.5">
                    <span>{j.leadCount}</span>
                    <span className="text-xs font-normal text-slate-400">({j.progress?.withEmail || 0} with email)</span>
                  </Link>
                </td>
                <td className="td">
                  <StatusBadge status={j.status} />
                </td>
                <td className="td whitespace-nowrap text-xs text-slate-500">{new Date(j.createdAt).toLocaleString()}</td>
                <td className="td whitespace-nowrap text-xs text-slate-500" title={j.expiresAt && new Date(j.expiresAt).toLocaleString()}>
                  {j.expiresAt ? `in ${daysLeft(j.expiresAt)} d` : '—'}
                </td>
                <td className="td text-right whitespace-nowrap space-x-3">
                  {j.status === 'completed' && (
                    <button
                      type="button"
                      disabled={generatingId === j._id}
                      onClick={() => handleGenerateTemplate(j)}
                      className="text-xs font-medium text-[#008762] hover:underline disabled:opacity-60 disabled:cursor-wait"
                    >
                      {generatingId === j._id ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-[#008762] border-t-transparent" />
                          Generating…
                        </span>
                      ) : (
                        'Generate AI Template'
                      )}
                    </button>
                  )}
                  {j.status !== 'running' && (
                    <button type="button" onClick={() => remove(j._id)} className="text-xs text-red-600 hover:underline">
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!data.items.length && (
              <tr>
                <td className="td py-8 text-center text-slate-500" colSpan={8}>
                  No searches yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <GoogleAd slot="banner" />
      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Prev
          </button>
          <span>
            {page} / {pages}
          </span>
          <button type="button" className="btn-secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
      {templateModalData && (
        <GenerateTemplateModal
          search={templateModalData.search}
          initialDraft={templateModalData.draft}
          onClose={() => setTemplateModalData(null)}
        />
      )}
    </div>
  );
}
