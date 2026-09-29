import { useEffect, useRef, useState } from 'react';
import { openAd } from '../lib/ads.js';
import { getAdsenseConfig } from '../lib/adsense.js';
import { api } from '../lib/api.js';
import { playImaAd } from '../lib/ima.js';

const DEMO_SPOTS = [
  { brand: 'SkillForge Academy', headline: 'Crack your first IT job', body: 'Full-stack, data & cloud courses with placement support.', cta: 'Explore courses', color: 'from-fuchsia-500 via-pink-500 to-rose-500' },
  { brand: 'ResumeCraft', headline: 'ATS-ready resume in 5 minutes', body: 'Templates loved by Indian recruiters. Free download.', cta: 'Build resume', color: 'from-sky-500 via-blue-600 to-indigo-700' },
  { brand: 'SpeakEasy English', headline: 'Speak confidently in interviews', body: 'Live spoken-English classes in Hindi, Gujarati & Tamil.', cta: 'Book free class', color: 'from-emerald-500 via-teal-500 to-cyan-600' },
  { brand: 'QuickRide Partners', headline: 'Earn up to ₹35,000 / month', body: 'Join as a delivery partner. Weekly payouts, flexible hours.', cta: 'Join now', color: 'from-orange-500 via-amber-500 to-yellow-500' },
];

function DemoVideo({ elapsed }) {
  const spot = DEMO_SPOTS[Math.floor(elapsed / 15) % DEMO_SPOTS.length];
  const t = elapsed % 15;
  return (
    <div key={spot.brand} className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br ${spot.color} p-8 text-center text-white`}>
      <div className="absolute -left-10 -top-10 h-48 w-48 animate-pulse rounded-full bg-white/10" />
      <div className="absolute -bottom-16 -right-8 h-64 w-64 animate-pulse rounded-full bg-white/10" />
      <div className="text-sm font-semibold uppercase tracking-widest opacity-80">{spot.brand}</div>
      <div className="mt-3 text-3xl font-extrabold drop-shadow md:text-4xl" style={{ transform: `scale(${1 + Math.min(t, 5) * 0.02})` }}>
        {spot.headline}
      </div>
      <div className="mt-3 max-w-md text-base opacity-90">{spot.body}</div>
      <span className="mt-6 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow">{spot.cta}</span>
      <span className="absolute bottom-2 left-2 rounded bg-black/30 px-1.5 text-[10px] uppercase">Demo video ad</span>
    </div>
  );
}

export default function VideoAdGate({ ready, resultCount, error, onClose }) {
  const [config, setConfig] = useState(null);
  const [houseAd, setHouseAd] = useState(undefined);
  const [imaState, setImaState] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const boxRef = useRef(null);
  const imaRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    let alive = true;
    getAdsenseConfig().then((c) => alive && setConfig(c));
    api
      .get('/ads', { params: { placement: 'video_preroll', limit: 1 } })
      .then((r) => alive && setHouseAd(r.data.items[0] || null))
      .catch(() => alive && setHouseAd(null));
    return () => {
      alive = false;
    };
  }, []);

  const seconds = config?.video?.seconds || 60;
  const done = elapsed >= seconds;

  useEffect(() => {
    if (done) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    const adTagUrl = config?.video?.adTagUrl;
    if (!adTagUrl || !imaRef.current || !videoRef.current) return undefined;
    let cleanup;
    let alive = true;
    setImaState('playing');
    const { width, height } = boxRef.current.getBoundingClientRect();
    playImaAd({
      adTagUrl,
      container: imaRef.current,
      video: videoRef.current,
      width: Math.round(width),
      height: Math.round(height),
      onEnd: () => alive && setImaState('ended'),
    })
      .then((c) => {
        cleanup = c;
        if (!alive) c();
      })
      .catch(() => alive && setImaState('ended'));
    return () => {
      alive = false;
      cleanup?.();
    };
  }, [config]);

  useEffect(() => {
    if (done && ready && !error) onClose();
  }, [done, ready, error, onClose]);

  const showIma = imaState === 'playing';
  const pct = Math.min(100, (elapsed / seconds) * 100);
  const remaining = Math.max(0, seconds - elapsed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4" role="dialog" aria-modal="true" aria-label="Video advertisement">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-slate-500">Advertisement</span>
          <span className="text-slate-500">Your jobs will appear after this {seconds}-second ad</span>
        </div>
        <div ref={boxRef} className="relative aspect-video w-full bg-black">
          <video ref={videoRef} className={`absolute inset-0 h-full w-full ${showIma ? '' : 'hidden'}`} playsInline muted />
          <div ref={imaRef} className={`absolute inset-0 ${showIma ? '' : 'hidden'}`} />
          {!showIma &&
            (houseAd?.videoUrl ? (
              <>
                <video src={houseAd.videoUrl} className="h-full w-full object-contain" autoPlay muted loop playsInline />
                <button type="button" onClick={() => openAd(houseAd)} className="absolute bottom-3 right-3 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-900 shadow">
                  {houseAd.ctaText || 'Learn more'} · {houseAd.advertiser}
                </button>
                <span className="absolute left-2 top-2 rounded bg-amber-400 px-1.5 text-[10px] font-bold uppercase text-white">Sponsored</span>
              </>
            ) : (
              houseAd !== undefined && <DemoVideo elapsed={elapsed} />
            ))}
        </div>
        <div className="h-1.5 w-full bg-slate-100">
          <div className="h-full bg-amber-400 transition-all duration-1000 ease-linear" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
          <div className="text-slate-600">
            {error ? (
              <span className="text-red-600">{error}</span>
            ) : ready ? (
              <span className="text-green-700">✓ Found {resultCount} jobs — ready when the ad ends</span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Searching Google Jobs, company websites, Naukri, Indeed, LinkedIn, Apna, WorkIndia &amp; more…
              </span>
            )}
          </div>
          {error ? (
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
          ) : (
            <button type="button" className="btn-primary" disabled={!done || !ready} onClick={onClose}>
              {done ? (ready ? 'Show results' : 'Almost there…') : `Results in ${remaining}s`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
