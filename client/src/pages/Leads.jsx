import { useEffect, useState } from 'react';
import ExportButtons from '../components/ExportButtons.jsx';
import LeadsTable from '../components/LeadsTable.jsx';
import SaveToGroup from '../components/SaveToGroup.jsx';
import { api, errMsg, SOURCE_LABELS, downloadExport } from '../lib/api.js';
import GoogleAd from '../components/GoogleAd.jsx';
import { Users, Search, Filter, ChevronLeft, ChevronRight, Database, Mail, Globe, SlidersHorizontal, Download } from 'lucide-react';

export default function Leads() {
  const [filters, setFilters] = useState({ search: '', emailType: '', source: '', hasEmail: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, limit: 25 });
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = (rows, on) =>
    setSelected((prev) => {
      const next = new Set(prev);
      rows.forEach((l) => (on ? next.add(l._id) : next.delete(l._id)));
      return next;
    });

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const key = JSON.stringify(params);

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get('/leads', { params: { ...JSON.parse(key), page, limit: 25 } })
        .then((r) => setData(r.data))
        .catch((e) => setError(errMsg(e)));
    }, 250);
    return () => clearTimeout(t);
  }, [key, page]);

  const set = (k) => (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: e.target.value }));
  };
  const pages = Math.max(1, Math.ceil(data.total / data.limit));

  const activeFilters = Object.values(filters).filter(Boolean).length;

  /* pagination helper: show max 5 page numbers */
  const getPageNumbers = () => {
    const nums = [];
    let start = Math.max(1, page - 2);
    let end = Math.min(pages, start + 4);
    start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      {/* <div className="rounded-2xl bg-[#008762] p-6 md:p-8 text-white shadow-sm flex flex-col gap-5"> */}
        
        {/* Title Section */}
        {/* <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner text-white">
            <Users size={28} strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">All Leads</h1>
            <p className="text-emerald-100 text-sm mt-0.5">Browse, filter & manage your entire lead database</p>
          </div>
        </div> */}

        {/* Action Bar */}
        {/* <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-black/10 border border-white/10 mt-1">
          <div className="flex items-center gap-3">
            {selected.size > 0 ? (
              <>
                <SaveToGroup payload={{ leadIds: [...selected] }} label={`Save ${selected.size} selected`} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#008762] transition-colors hover:bg-emerald-50 disabled:opacity-50" />
                <button type="button" className="text-sm font-medium text-emerald-100 hover:text-white transition-colors underline underline-offset-2" onClick={() => setSelected(new Set())}>
                  Clear selection
                </button>
              </>
            ) : (
              <SaveToGroup payload={{ filters: params }} label="Save filtered to group" disabled={!data.total} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#008762] transition-colors hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed" />
            )}
          </div>
          
          <div className="h-8 w-px bg-white/20 mx-2 hidden md:block"></div>
          
          <ExportButtons params={params} disabled={!data.total} />
        </div> */}

        {/* Quick Stats Row */}
        {/* <div className="mt-5 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2">
            <Database size={16} />
            <span className="text-sm font-semibold text-white">{data.total.toLocaleString()}</span>
            <span className="text-xs text-emerald-100">Total Leads</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2">
            <Mail size={16} />
            <span className="text-sm font-semibold text-white">{data.items.filter(l => l.primaryEmail).length}</span>
            <span className="text-xs text-emerald-100">With Email</span>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-white/25 backdrop-blur-sm px-4 py-2 animate-pulse">
              <span className="text-sm font-semibold text-white">{selected.size}</span>
              <span className="text-xs text-emerald-100">Selected</span>
            </div>
          )}
        </div>
      </div> */}

      {/* ── Filters Card ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-[#008762]">
            <SlidersHorizontal size={16} />
          </div>
          <span className="text-sm font-semibold text-slate-700">Filters</span>
          {activeFilters > 0 && (
            <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#008762] text-[10px] font-bold text-white">
              {activeFilters}
            </span>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#008762] focus:bg-white focus:ring-2 focus:ring-[#008762]/20 transition-all"
              placeholder="Search name, email, website, city…"
              value={filters.search}
              onChange={set('search')}
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-8 text-sm outline-none focus:border-[#008762] focus:bg-white focus:ring-2 focus:ring-[#008762]/20 transition-all cursor-pointer"
              value={filters.emailType}
              onChange={set('emailType')}
            >
              <option value="">Any email type</option>
              {['hr', 'sales', 'support', 'generic', 'personal', 'other'].map((t) => (
                <option key={t} value={t}>{t.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-8 text-sm outline-none focus:border-[#008762] focus:bg-white focus:ring-2 focus:ring-[#008762]/20 transition-all cursor-pointer"
              value={filters.source}
              onChange={set('source')}
            >
              <option value="">Any source</option>
              {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-8 text-sm outline-none focus:border-[#008762] focus:bg-white focus:ring-2 focus:ring-[#008762]/20 transition-all cursor-pointer"
              value={filters.hasEmail}
              onChange={set('hasEmail')}
            >
              <option value="">With or without email</option>
              <option value="true">Only with email</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-100">
            <span className="text-red-500 text-lg">!</span>
          </div>
          {error}
        </div>
      )}

      <GoogleAd slot="banner" />

      {/* ── Table Card ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-800">
            {selected.size > 0 ? `${selected.size} Leads Selected` : 'Current Page Leads'}
          </h2>
          <button 
            type="button" 
            onClick={async () => {
              try {
                const ids = selected.size > 0 ? [...selected].join(',') : data.items.map(l => l._id).join(',');
                if (!ids) return;
                setIsExporting(true);
                await downloadExport({ ids, format: 'xlsx', count: 'all' });
              } catch (e) {
                setError(errMsg(e));
              } finally {
                setIsExporting(false);
              }
            }}
            disabled={!data.items.length || isExporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-[#008762] hover:border-[#008762]/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} className={isExporting ? "animate-bounce" : ""} />
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
        <LeadsTable leads={data.items} showRank={false} selected={selected} onToggle={toggle} onToggleAll={toggleAll} />
      </div>

      {/* ── Pagination ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Database size={14} className="text-slate-400" />
          Showing <span className="font-semibold text-slate-700">{((page - 1) * data.limit) + 1}–{Math.min(page * data.limit, data.total)}</span> of <span className="font-semibold text-slate-700">{data.total.toLocaleString()}</span> leads
        </div>
        {pages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            {getPageNumbers().map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  n === page
                    ? 'bg-[#008762] text-white shadow-sm shadow-emerald-200'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
