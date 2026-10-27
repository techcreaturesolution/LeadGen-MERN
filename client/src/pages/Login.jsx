import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import GoogleAd from '../components/GoogleAd.jsx';
import { api, errMsg } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');
  
  // Auth Form State
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get('/auth/config')
      .then((r) => setConfig(r.data))
      .catch((e) => setError(errMsg(e)));
  }, []);

  if (user) return <Navigate to="/" replace />;

  const finish = (data) => {
    login(data.token, data.user);
    navigate('/', { replace: true });
  };

  const onGoogle = async ({ credential }) => {
    setError('');
    try {
      const { data } = await api.post('/auth/google', { credential });
      finish(data);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const onEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        const { data } = await api.post('/auth/signup', { email, password, name, phone });
        finish(data);
      } else {
        const { data } = await api.post('/auth/login', { email, password });
        finish(data);
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="relative flex min-h-screen flex-col items-center justify-center p-4 font-sans overflow-hidden" 
      style={{ 
        backgroundColor: '#d8e1eb', 
        backgroundImage: `
          linear-gradient(to right, rgba(71, 85, 105, 0.16) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(71, 85, 105, 0.16) 1px, transparent 1px),
          radial-gradient(rgba(51, 65, 85, 0.35) 1.2px, transparent 1.2px)
        `, 
        backgroundSize: '36px 36px, 36px 36px, 18px 18px' 
      }}
    >
      {/* Ambient background glows & vignette for depth and visual richness */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-gradient-to-b from-[#009b71]/25 via-[#009b71]/12 to-transparent blur-3xl opacity-80" />
        <div className="absolute top-[35%] -left-[10%] w-[550px] h-[550px] rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[600px] h-[600px] rounded-full bg-teal-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(71,85,105,0.22)_100%)]" />
      </div>
      
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 px-10 z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#009b71] text-lg font-bold text-white shadow-md shadow-[#009b71]/30">L</div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">LeadGen <span className="text-[#009b71]">AI</span></span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm text-slate-700 font-medium bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-300 shadow-sm">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#009b71]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            SOC2 Type II Certified
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#009b71] animate-pulse"></div>
            Lead Index Live
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[960px] rounded-[24px] bg-white border border-slate-300 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.2),0_10px_20px_-5px_rgba(15,23,42,0.08),0_0_0_1px_rgba(15,23,42,0.04)] flex flex-col md:flex-row overflow-hidden z-10 mt-12 md:mt-16">
        
        {/* Left Side (Features) */}
        <div className="flex-1 px-8 pb-6 pt-4 md:px-12 md:pb-8 md:pt-5 flex flex-col justify-center">
          <h1 className="text-[28px] leading-tight font-extrabold text-gray-900 tracking-tight">LeadGen AI</h1>
          <p className="mt-2 text-[16px] font-medium text-gray-500">B2B leads from Google Maps, LinkedIn & Instagram</p>
          
          <div className="mt-8 space-y-3">
            {/* Item 1 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:bg-white hover:border-emerald-300/80 hover:shadow-sm">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100/60 text-[#009b71]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div className="pt-2">
                  <div className="text-[14px] font-medium text-gray-700 leading-snug">Ask in plain English:</div>
                  <div className="mt-2.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] font-mono text-gray-600 shadow-sm inline-block">
                    "HR email of IT companies in Ahmedabad"
                  </div>
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:bg-white hover:border-emerald-300/80 hover:shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100/60 text-[#009b71]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="text-[14px] font-medium text-gray-700 leading-snug pr-4">AI agent discovers businesses and crawls their sites for emails</div>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:bg-white hover:border-emerald-300/80 hover:shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100/60 text-[#009b71]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-[14px] font-medium text-gray-700 leading-snug">Download Excel or CSV reports of <span className="font-bold text-gray-900">20, 40 or 60 leads</span></div>
            </div>
          </div>
        </div>

        {/* Right Side (Login) */}
        <div className="w-full md:w-[420px] bg-white px-8 py-6 md:px-12 md:py-8 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col justify-center">
          <div className="w-full max-w-[320px] mx-auto">
            <div className="text-center">
              <h2 className="text-[22px] font-extrabold text-gray-900">{isSignup ? 'Create an Account' : 'Welcome Back'}</h2>
              <p className="mt-1.5 text-[14px] font-medium text-gray-500">
                {isSignup ? 'Sign up to get started free.' : 'Log in to your account.'}
              </p>
            </div>

            <form onSubmit={onEmailSubmit} className="mt-8 space-y-4">
              {isSignup && (
                <>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#009b71] focus:ring-2 focus:ring-[#009b71]/20 shadow-xs"
                      required={isSignup}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="+91 9876543210" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#009b71] focus:ring-2 focus:ring-[#009b71]/20 shadow-xs"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Work Email</label>
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#009b71] focus:ring-2 focus:ring-[#009b71]/20 shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#009b71] focus:ring-2 focus:ring-[#009b71]/20 shadow-xs"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="mt-2 w-full rounded-xl bg-[#009b71] px-4 py-3 text-[14px] font-bold text-white shadow-md shadow-[#009b71]/25 transition-all hover:bg-[#008762] hover:shadow-lg hover:shadow-[#009b71]/35 active:scale-[0.99] disabled:opacity-70">
                {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Log In')}
              </button>
            </form>

            <div className="mt-4 text-center text-[13px] font-medium text-slate-500">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button 
                type="button" 
                onClick={() => { setIsSignup(!isSignup); setError(''); }} 
                className="text-[#009b71] hover:underline font-bold"
              >
                {isSignup ? 'Log in here' : 'Sign up here'}
              </button>
            </div>

            <div className="my-6 flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <div className="h-px flex-1 bg-slate-200"></div>
              OR
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            {config?.googleClientId ? (
              <GoogleOAuthProvider clientId={config.googleClientId}>
                <div className="flex justify-center w-full">
                  <div className="w-full flex justify-center [&>div]:w-full [&_iframe]:w-full [&_iframe]:!max-w-full">
                    <GoogleLogin 
                      onSuccess={onGoogle} 
                      onError={() => setError('Google sign-in was cancelled or failed')} 
                      text="continue_with" 
                      shape="rectangular" 
                      size="large"
                      width="320"
                    />
                  </div>
                </div>
              </GoogleOAuthProvider>
            ) : (
              config && (
                <div className="rounded-xl bg-amber-50 p-3 text-center text-sm font-medium text-amber-800 border border-amber-200">
                  Google sign-in is not configured.
                </div>
              )
            )}

            {!config && !error && <div className="text-center text-sm font-medium text-slate-500 py-3">Loading…</div>}
            
            {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 text-center border border-red-100">{error}</div>}

            <div className="mt-8 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-gray-500">
              <svg className="h-4 w-4 text-[#009b71]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              256-bit Enterprise Encryption
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 z-10 w-full max-w-[960px]">
        <GoogleAd slot="banner" className="w-full rounded-2xl bg-white/80 backdrop-blur-md p-2 shadow-sm border border-slate-200/80" />
      </div>
    </div>
  );
}
