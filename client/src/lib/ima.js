const IMA_SRC = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
let imaPromise;

export function loadIma() {
  if (window.google?.ima) return Promise.resolve(window.google.ima);
  if (!imaPromise) {
    imaPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = IMA_SRC;
      s.async = true;
      s.onload = () => (window.google?.ima ? resolve(window.google.ima) : reject(new Error('IMA SDK unavailable')));
      s.onerror = () => {
        imaPromise = null;
        reject(new Error('IMA SDK blocked'));
      };
      document.head.appendChild(s);
    });
  }
  return imaPromise;
}

export async function playImaAd({ adTagUrl, container, video, width, height, onEnd }) {
  const ima = await loadIma();
  const display = new ima.AdDisplayContainer(container, video);
  display.initialize();
  const loader = new ima.AdsLoader(display);
  let manager;
  let ended = false;
  const finish = (reason) => {
    if (ended) return;
    ended = true;
    onEnd(reason);
  };
  loader.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, () => finish('error'));
  loader.addEventListener(ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, (e) => {
    manager = e.getAdsManager(video);
    manager.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, () => finish('error'));
    manager.addEventListener(ima.AdEvent.Type.ALL_ADS_COMPLETED, () => finish('complete'));
    try {
      manager.init(width, height, ima.ViewMode.NORMAL);
      manager.setVolume(0);
      manager.start();
    } catch {
      finish('error');
    }
  });
  const req = new ima.AdsRequest();
  req.adTagUrl = adTagUrl;
  req.linearAdSlotWidth = width;
  req.linearAdSlotHeight = height;
  req.nonLinearAdSlotWidth = width;
  req.nonLinearAdSlotHeight = Math.round(height / 3);
  req.setAdWillAutoPlay(true);
  req.setAdWillPlayMuted(true);
  loader.requestAds(req);
  return () => {
    ended = true;
    manager?.destroy();
    loader.destroy();
    display.destroy();
  };
}
