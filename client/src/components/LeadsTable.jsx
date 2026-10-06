import { SOURCE_LABELS } from '../lib/api.js';
import { EmailTypeBadge } from './StatusBadge.jsx';
import { 
  Building2, MapPin, Users, Briefcase, Calendar, MessageSquare, 
  ExternalLink, Link, Camera, Map, Phone, Mail, Star,
  UserCheck, AlertCircle
} from 'lucide-react';

const short = (u) => u?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

/* Score color based on value */
const scoreColor = (score) => {
  if (score >= 75) return { bar: 'bg-[#008762]', text: 'text-[#008762]', bg: 'bg-emerald-50' };
  if (score >= 50) return { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' };
  return { bar: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-50' };
};

export default function LeadsTable({ leads, showRank = true, selected, onToggle, onToggleAll }) {
  const selectable = Boolean(selected);
  const withEmail = leads.filter((l) => l.primaryEmail);
  const allOn = selectable && withEmail.length > 0 && withEmail.every((l) => selected.has(l._id));

  if (!leads.length)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 mb-4">
          <Users size={28} className="text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-500">No leads found</p>
        <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or start a new search</p>
      </div>
    );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        {/* ─── Table Header ─── */}
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {selectable && (
              <th className="w-12 px-4 py-3.5">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    aria-label="Select all on page"
                    checked={allOn}
                    disabled={!withEmail.length}
                    onChange={() => onToggleAll(withEmail, !allOn)}
                    className="h-4 w-4 rounded border-slate-300 text-[#008762] focus:ring-[#008762] cursor-pointer"
                  />
                </div>
              </th>
            )}
            {showRank && <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">#</th>}
            <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Business</th>
            <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Contact Info</th>
            <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Phone</th>
            <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Links</th>
            <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Source</th>
            <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Score</th>
          </tr>
        </thead>

        {/* ─── Table Body ─── */}
        <tbody>
          {leads.map((l, idx) => {
            const isSelected = selectable && selected.has(l._id);
            const sc = scoreColor(l.score);
            return (
              <tr
                key={l._id}
                className={`
                  group border-b border-slate-100 transition-colors duration-150
                  ${isSelected ? 'bg-emerald-50/60' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}
                  hover:bg-emerald-50/40
                `}
              >
                {/* Checkbox */}
                {selectable && (
                  <td className="px-4 py-3.5 align-top">
                    <div className="flex items-center justify-center pt-1">
                      <input
                        type="checkbox"
                        aria-label={`Select ${l.name}`}
                        disabled={!l.primaryEmail}
                        title={l.primaryEmail ? '' : 'No email: cannot be emailed'}
                        checked={isSelected}
                        onChange={() => onToggle(l._id)}
                        className="h-4 w-4 rounded border-slate-300 text-[#008762] focus:ring-[#008762] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    </div>
                  </td>
                )}

                {/* Rank */}
                {showRank && (
                  <td className="px-4 py-3.5 align-top">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">{l.rank}</span>
                  </td>
                )}

                {/* Business Info */}
                <td className="px-4 py-3.5 align-top max-w-xs">
                  <div className="space-y-1.5">
                    {/* Name + Verification */}
                    <div className="flex items-start gap-2">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-[#008762] mt-0.5">
                        <Building2 size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 leading-snug group-hover:text-[#008762] transition-colors">
                          {l.name}
                          {l.verification && (
                            <span
                              title={l.matchReason}
                              className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold align-middle ${
                                l.verification === 'verified'
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-100 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {l.verification === 'verified' ? <UserCheck size={10} /> : <AlertCircle size={10} />}
                              {l.verification === 'verified' ? 'Verified' : 'Likely'}
                              {l.aiVerified ? ' · AI' : ''}
                            </span>
                          )}
                        </div>
                        {(l.category || l.address || l.city) && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <MapPin size={10} className="text-slate-400 shrink-0" />
                            {[l.category, l.address || l.city].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Company details */}
                    {(l.companyType || l.employeeCount || l.foundedYear) && (
                      <div className="flex flex-wrap gap-2 ml-11">
                        {l.companyType && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            <Briefcase size={9} /> {l.companyType}
                          </span>
                        )}
                        {l.employeeCount && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            <Users size={9} /> {l.employeeCount}
                          </span>
                        )}
                        {l.foundedYear && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            <Calendar size={9} /> {l.foundedYear}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {l.description && (
                      <p className="ml-11 line-clamp-2 text-xs text-slate-500 leading-relaxed" title={l.description}>
                        {l.description}
                      </p>
                    )}

                    {/* Contacts */}
                    {l.contacts?.length > 0 && (
                      <div className="ml-11 space-y-1 rounded-lg bg-slate-50 border border-slate-100 p-2">
                        {l.contacts.slice(0, 3).map((c, i) => (
                          <div key={c.email || `${c.name}-${i}`} className="flex items-center gap-1.5 text-xs">
                            <div className="h-5 w-5 shrink-0 rounded-full bg-emerald-100 grid place-items-center text-[#008762]">
                              <UserCheck size={9} />
                            </div>
                            <span className="font-medium text-slate-700">{c.name || 'Contact'}</span>
                            {c.title && <span className="text-slate-400">· {c.title}</span>}
                            {c.email && (
                              <a className="text-[#008762] hover:underline ml-auto truncate" href={`mailto:${c.email}`}>
                                {c.email}
                              </a>
                            )}
                          </div>
                        ))}
                        {l.contacts.length > 3 && (
                          <div className="text-[10px] text-slate-400 pl-7">+{l.contacts.length - 3} more contacts</div>
                        )}
                      </div>
                    )}

                    {/* AI Note */}
                    {l.aiNote && (
                      <div className="ml-11 flex items-start gap-1.5 rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 text-xs text-[#008762]">
                        <MessageSquare size={11} className="shrink-0 mt-0.5" />
                        <span className="italic">{l.aiNote}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Email */}
                <td className="px-4 py-3.5 align-top">
                  {l.primaryEmail ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="grid h-6 w-6 place-items-center rounded-md bg-emerald-50 text-[#008762] shrink-0">
                          <Mail size={12} />
                        </div>
                        <a
                          className="text-sm font-medium text-[#008762] hover:underline underline-offset-2 truncate max-w-[180px]"
                          href={`mailto:${l.primaryEmail}`}
                          title={l.primaryEmail}
                        >
                          {l.primaryEmail}
                        </a>
                      </div>
                      <div className="ml-8">
                        <EmailTypeBadge type={l.primaryEmailCategory} />
                      </div>
                      {l.emails?.length > 1 && (
                        <div className="ml-8 text-[11px] text-slate-400 leading-relaxed" title={l.emails.map((e) => e.email).join(', ')}>
                          +{l.emails.length - 1} more: {l.emails.slice(1, 3).map((e) => e.email).join(', ')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="grid h-6 w-6 place-items-center rounded-md bg-slate-100">
                        <Mail size={12} className="text-slate-300" />
                      </div>
                      Not found
                    </div>
                  )}
                </td>

                {/* Phone */}
                <td className="px-4 py-3.5 align-top whitespace-nowrap">
                  {l.phone ? (
                    <div className="flex items-center gap-2">
                      <div className="grid h-6 w-6 place-items-center rounded-md bg-blue-50 text-blue-600 shrink-0">
                        <Phone size={12} />
                      </div>
                      <span className="text-sm text-slate-700">{l.phone}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>

                {/* Links */}
                <td className="px-4 py-3.5 align-top">
                  <div className="flex flex-wrap gap-1.5">
                    {l.website && (
                      <a
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:border-[#008762] hover:text-[#008762] transition-colors shadow-sm"
                        href={l.website}
                        target="_blank"
                        rel="noreferrer"
                        title={l.website}
                      >
                        <ExternalLink size={10} /> Web
                      </a>
                    )}
                    {l.linkedinUrl && (
                      <a
                        className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-700 hover:bg-sky-100 transition-colors shadow-sm"
                        href={l.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Link size={10} /> In
                      </a>
                    )}
                    {l.instagramUrl && (
                      <a
                        className="inline-flex items-center gap-1 rounded-lg border border-pink-200 bg-pink-50 px-2 py-1 text-[11px] font-medium text-pink-600 hover:bg-pink-100 transition-colors shadow-sm"
                        href={l.instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Camera size={10} /> IG
                      </a>
                    )}
                    {l.mapsUrl && (
                      <a
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
                        href={l.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Map size={10} /> Map
                      </a>
                    )}
                    {!l.website && !l.linkedinUrl && !l.instagramUrl && !l.mapsUrl && (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                </td>

                {/* Source */}
                <td className="px-4 py-3.5 align-top">
                  <div className="space-y-1">
                    {(l.sources || []).map((s) => (
                      <span
                        key={s}
                        className="block w-fit rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wide"
                      >
                        {SOURCE_LABELS[s] || s}
                      </span>
                    ))}
                    {l.enrichedBy?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {l.enrichedBy.map((e) => (
                          <span
                            key={e}
                            className="rounded-md bg-violet-50 border border-violet-100 px-1.5 py-0.5 text-[9px] font-semibold text-violet-600"
                          >
                            + {e === 'apollo' ? 'Apollo' : 'Hunter'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>

                {/* Score */}
                <td className="px-4 py-3.5 align-top">
                  <div className="flex items-center gap-2.5">
                    <div className="w-16">
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${sc.bar} transition-all duration-500`}
                          style={{ width: `${l.score}%` }}
                        />
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold ${sc.text} ${sc.bg}`}>
                      <Star size={10} />
                      {l.score}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
