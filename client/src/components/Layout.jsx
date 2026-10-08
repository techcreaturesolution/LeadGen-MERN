import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import AdSlot from './AdSlot.jsx';
import GoogleAd from './GoogleAd.jsx';
import { 
  LayoutDashboard, Search, Users, Folder, Mail, Megaphone, Shield, 
  BadgeCheck, Component, Bell, ChevronDown, Coins, LogOut, Menu, X
} from 'lucide-react';

const linkCls = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-[#008762] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const showAds = !pathname.startsWith('/admin');
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const dropdownRef = useRef(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ───── Sidebar content (shared between desktop & mobile) ───── */
  const sidebarContent = (
    <>
      {/* LOGO */}
      <div className="mb-8 flex items-center gap-3 px-2 mt-2">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#008762] text-white shadow-sm">
          <Component size={22} strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-[17px] font-bold text-slate-900 leading-tight">LeadGen AI</div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 whitespace-nowrap">Maps · LinkedIn · Instagram</div>
        </div>
      </div>
      
      {/* NAV */}
      <nav className="flex-1 space-y-1">
        <NavLink to="/" end className={linkCls}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/searches" className={linkCls}>
          <Search size={18} />
          <span>Searches</span>
        </NavLink>
        <NavLink to="/leads" className={linkCls}>
          <Users size={18} />
          <span>All leads</span>
        </NavLink>

        <div className="px-3 pt-6 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Email outreach</div>
        <NavLink to="/groups" className={linkCls}>
          <Folder size={18} />
          <span>Lead groups</span>
        </NavLink>
        <NavLink to="/templates" className={linkCls}>
          <Mail size={18} />
          <span>Email templates</span>
        </NavLink>
        <NavLink to="/campaigns" className={linkCls}>
          <Megaphone size={18} />
          <span>Campaigns</span>
        </NavLink>

        <div className="px-3 pt-6 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">System</div>
        {user?.role === 'admin' && (
          <NavLink to="/admin" className={linkCls}>
            <Shield size={18} />
            <span>Master Admin</span>
          </NavLink>
        )}
      </nav>

      {showAds && (
        <div key={pathname} className="my-6 space-y-4">
          <AdSlot placement="sidebar" />
        </div>
      )}

      {/* PARTNER OFFER */}
      <div className="mt-auto pt-4">
        <div className="rounded-xl border border-emerald-100 bg-[#f0fdf4] p-4 relative overflow-hidden">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Partner Offer</span>
              <BadgeCheck size={16} className="text-[#008762]" />
           </div>
           <div className="font-bold text-[13px] text-slate-900 mb-1 leading-tight">Scale Multi-Channel Reach</div>
           <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">Get verified direct dials and warm leads instantly.</p>
           <button className="w-full rounded-lg border border-[#008762] bg-transparent py-2 text-[12px] font-semibold text-[#008762] transition-colors hover:bg-emerald-50">
              Upgrade Capacity
           </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ══════ Mobile Sidebar Overlay ══════ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════ Sidebar ══════ */}
      {/* Mobile: slides in/out as an overlay */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[260px] flex-col border-r border-slate-200 bg-[#fcfcfc] p-4
          transition-transform duration-300 ease-in-out
          md:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ display: 'flex' }}
      >
        {sidebarContent}
      </aside>

      {/* Desktop: collapses with smooth width transition */}
      <aside
        className="hidden md:flex shrink-0 flex-col border-r border-slate-200 bg-[#fcfcfc] overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          width: sidebarOpen ? '260px' : '0px',
          padding: sidebarOpen ? '16px' : '0px',
          borderRightWidth: sidebarOpen ? '1px' : '0px',
        }}
      >
        <div className="w-[228px] min-w-[228px] flex flex-col flex-1" style={{ opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s ease' }}>
          {sidebarContent}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-sm px-6">
          {/* Hamburger toggle + Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Mobile logo (only when sidebar is closed) */}
            {!sidebarOpen && (
              <div className="flex items-center gap-2 md:hidden">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#008762] text-white">
                  <Component size={18} />
                </div>
                <span className="font-bold text-slate-900">LeadGen AI</span>
              </div>
            )}
          </div>
          
          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl ml-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search leads, campaigns, or domains..." 
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#008762] focus:bg-white focus:ring-1 focus:ring-[#008762] transition-all"
              />
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-5 ml-auto">
             <div className="hidden md:flex items-center gap-2 text-slate-700">
               <Coins size={18} className="text-[#008762]" />
               <div className="text-sm font-bold">
                 850 <span className="text-xs font-medium text-slate-500">Credits</span>
               </div>
             </div>
             
             <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
               <Bell size={20} />
               <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white"></span>
             </button>

             <div className="relative flex items-center gap-2 border-l border-slate-200 pl-4" ref={dropdownRef}>
                <button 
                  type="button" 
                  onClick={() => setDropdownOpen(!dropdownOpen)} 
                  className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-50 transition-colors focus:outline-none"
                >
                  {user?.picture ? (
                    <img src={user.picture} alt="" className="h-8 w-8 rounded-full border border-slate-200 object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-[#008762] text-sm font-bold text-white">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <ChevronDown size={14} className="text-slate-500 mr-1" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-48 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User Profile'}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <button 
                        type="button" 
                        onClick={logout}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </header>

        {/* Mobile Navigation Links */}
        <nav className="flex flex-wrap gap-2 border-b border-slate-200 bg-white p-3 text-sm md:hidden">
          <NavLink to="/" className="px-2 py-1">Home</NavLink>
          <NavLink to="/searches" className="px-2 py-1">Searches</NavLink>
          <NavLink to="/leads" className="px-2 py-1">Leads</NavLink>
          <NavLink to="/groups" className="px-2 py-1">Groups</NavLink>
          <NavLink to="/campaigns" className="px-2 py-1">Mail</NavLink>
          {user?.role === 'admin' && <NavLink to="/admin" className="px-2 py-1">Admin</NavLink>}
          <button type="button" onClick={logout} className="px-2 py-1 text-red-600">Logout</button>
        </nav>

        {/* Main Content Area */}
        <div className="mx-auto flex w-full max-w-[1600px] flex-1 gap-6 p-4 md:p-8">
          <main className="min-w-0 flex-1 space-y-6">
            {showAds && <GoogleAd key={`top-${pathname}`} slot="banner" />}
            <Outlet />
          </main>
          {showAds && (
            <aside key={`rail-${pathname}`} className="hidden w-[300px] shrink-0 xl:block">
              <div className="sticky top-8 space-y-6">
                <GoogleAd slot="inline" />
                <GoogleAd slot="rail" />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
