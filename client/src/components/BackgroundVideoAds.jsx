import { useEffect, useRef, useState } from 'react';
import { openAd } from '../lib/ads.js';
import { api } from '../lib/api.js';

export default function BackgroundVideoAds({ active }) {
  const videoRef = useRef(null);
  const [ad, setAd] = useState(null);
  const [enabled, setEnabled] = useState(true);
  const [muted, setMuted] = useState(true);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!active) return;
    let alive = true;
    api
      .get('/ads/video/next', { params: { exclude: ad?._id || undefined } })
      .then(({ data }) => {
        if (!alive) return;
        setEnabled(data.enabled);
        setAd(data.ad);
      })
      .catch(() => alive && setEnabled(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, round]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !ad) return;
    v.muted = muted;
    v.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad]);

  if (!active || !enabled || !ad) return null;

  const ended = () => {
    if (ad._id) api.post(`/ads/${ad._id}/video-complete`).catch(() => {});
    setRound((n) => n + 1);
  };

  return (
    <div className="card overflow-hidden p-0" data-testid="campaign-video-ad">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Sponsored video · {ad.advertiser}</div>
          <div className="truncate text-sm font-semibold text-slate-900">{ad.title}</div>
        </div>
        <span className="shrink-0 text-xs text-slate-500">Your emails keep sending while this plays</span>
      </div>
      <div className="relative aspect-video max-h-[360px] w-full bg-black">
        <video
          ref={videoRef}
          key={`${ad._id || 'demo'}-${round}`}
          src={ad.videoUrl}
          className="h-full w-full"
          autoPlay
          playsInline
          muted={muted}
          preload="auto"
          disablePictureInPicture
          controlsList="nodownload noplaybackrate noremoteplayback"
          onEnded={ended}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
        <span className="truncate text-slate-600">{ad.description}</span>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="btn-secondary px-3 py-1"
            onClick={() => {
              setMuted(!muted);
              if (videoRef.current) videoRef.current.muted = !muted;
            }}
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
          {ad._id && ad.targetUrl && (
            <button type="button" className="btn-primary px-3 py-1" onClick={() => openAd(ad)}>
              {ad.ctaText || 'Learn more'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
