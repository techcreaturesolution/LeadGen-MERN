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
  const [devEmail, setDevEmail] = useState('');

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

  const onDev = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/dev', { email: devEmail });
      finish(data);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 font-sans" style={{ backgroundColor: '#fafafa', backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#009b71] text-lg font-bold text-white shadow-sm">L</div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">LeadGen <span className="text-[#009b71]">AI</span></span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#009b71]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            SOC2 Type II Certified
          </div>
          <div className="h-4 w-px bg-gray-200"></div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#009b71]"></div>
            Lead Index Live
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[960px] rounded-[24px] bg-white border border-gray-100 flex flex-col md:flex-row overflow-hidden z-10 mt-12 md:mt-16">
        
        {/* Left Side (Features) */}
        <div className="flex-1 px-8 pb-6 pt-4 md:px-12 md:pb-8 md:pt-5 flex flex-col justify-center">
          <h1 className="text-[28px] leading-tight font-extrabold text-gray-900 tracking-tight">LeadGen AI</h1>
          <p className="mt-2 text-[16px] font-medium text-gray-500">B2B leads from Google Maps, LinkedIn & Instagram</p>
          
          <div className="mt-8 space-y-3">
            {/* Item 1 */}
            <div className="rounded-2xl border border-gray-100/80 bg-gray-50/50 p-4 transition-colors hover:bg-gray-50">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100/50 text-[#009b71]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div className="pt-2">
                  <div className="text-[14px] font-medium text-gray-700 leading-snug">Ask in plain English:</div>
                  <div className="mt-2.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-[13px] font-mono text-gray-600 shadow-sm inline-block">
                    "HR email of IT companies in Ahmedabad"
                  </div>
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-4 rounded-2xl border border-gray-100/80 bg-gray-50/50 p-4 transition-colors hover:bg-gray-50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100/50 text-[#009b71]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="text-[14px] font-medium text-gray-700 leading-snug pr-4">AI agent discovers businesses and crawls their sites for emails</div>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-4 rounded-2xl border border-gray-100/80 bg-gray-50/50 p-4 transition-colors hover:bg-gray-50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100/50 text-[#009b71]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-[14px] font-medium text-gray-700 leading-snug">Download Excel or CSV reports of <span className="font-bold text-gray-900">20, 40 or 60 leads</span></div>
            </div>
          </div>
        </div>

        {/* Right Side (Login) */}
        <div className="w-full md:w-[420px] bg-[#fdfdfd] px-8 py-6 md:px-12 md:py-8 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col justify-center">
          <div className="w-full max-w-[320px] mx-auto">
            <div className="text-center">
              <h2 className="text-[22px] font-extrabold text-gray-900">Get Started Free</h2>
              <p className="mt-1.5 text-[14px] font-medium text-gray-500">No credit card or setup required.</p>
            </div>

            <form onSubmit={onDev} className="mt-8">
              <label className="block text-[13px] font-bold text-gray-700 mb-2">Work Email</label>
              <input 
                type="email" 
                placeholder="name@company.com" 
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] outline-none transition-all placeholder:text-gray-400 focus:border-[#009b71] focus:ring-1 focus:ring-[#009b71]"
                required
              />
              <button type="submit" className="mt-3 w-full rounded-xl bg-[#009b71] px-4 py-3 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-[#008762]">
                Continue with Email
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              <div className="h-px flex-1 bg-gray-100"></div>
              OR
              <div className="h-px flex-1 bg-gray-100"></div>
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
        <GoogleAd slot="banner" className="w-full rounded-2xl bg-white/60 backdrop-blur-sm p-2 shadow-sm border border-gray-100/50" />
      </div>
    </div>
  );
}
