import { SOURCE_LABELS } from '../lib/api.js';
import { EmailTypeBadge } from './StatusBadge.jsx';

const short = (u) => u?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

export default function LeadsTable({ leads, showRank = true }) {
  if (!leads.length) return <div className="py-10 text-center text-sm text-slate-500">No leads yet.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {showRank && <th className="th">#</th>}
            <th className="th">Business</th>
            <th className="th">Email</th>
            <th className="th">Phone</th>
            <th className="th">Links</th>
            <th className="th">Source</th>
            <th className="th">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.map((l) => (
            <tr key={l._id} className="hover:bg-slate-50">
              {showRank && <td className="td text-slate-400">{l.rank}</td>}
              <td className="td max-w-xs">
                <div className="font-medium text-slate-900">{l.name}</div>
                <div className="text-xs text-slate-500">{[l.category, l.address || l.city].filter(Boolean).join(' · ')}</div>
                {l.aiNote && <div className="mt-1 text-xs italic text-blue-700">AI: {l.aiNote}</div>}
              </td>
              <td className="td">
                {l.primaryEmail ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <a className="font-medium text-blue-700 hover:underline" href={`mailto:${l.primaryEmail}`}>
                        {l.primaryEmail}
                      </a>
                      <EmailTypeBadge type={l.primaryEmailCategory} />
                    </div>
                    {l.emails?.length > 1 && (
                      <div className="text-xs text-slate-500" title={l.emails.map((e) => e.email).join(', ')}>
                        +{l.emails.length - 1} more: {l.emails.slice(1, 3).map((e) => e.email).join(', ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">not found</span>
                )}
              </td>
              <td className="td whitespace-nowrap">{l.phone || '—'}</td>
              <td className="td space-y-0.5 text-xs">
                {l.website && (
                  <a className="block text-blue-700 hover:underline" href={l.website} target="_blank" rel="noreferrer">
                    {short(l.website)}
                  </a>
                )}
                {l.linkedinUrl && (
                  <a className="block text-sky-700 hover:underline" href={l.linkedinUrl} target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                )}
                {l.instagramUrl && (
                  <a className="block text-pink-600 hover:underline" href={l.instagramUrl} target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                )}
              </td>
              <td className="td text-xs">{(l.sources || []).map((s) => SOURCE_LABELS[s] || s).join(', ')}</td>
              <td className="td">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-12 rounded bg-slate-200">
                    <div className="h-1.5 rounded bg-blue-600" style={{ width: `${l.score}%` }} />
                  </div>
                  <span className="text-xs text-slate-500">{l.score}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
