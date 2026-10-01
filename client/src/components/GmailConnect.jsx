import { useState } from 'react';
import { api, errMsg } from '../lib/api.js';

export default function GmailConnect({ status, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!status) return null;

  const connect = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/gmail/connect');
      window.location.assign(data.url);
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };
  const disconnect = async () => {
    setBusy(true);
    try {
      await api.post('/gmail/disconnect');
      onChange?.();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card flex flex-wrap items-center justify-between gap-3" data-testid="gmail-card">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900">Send from your Gmail</div>
        {status.connected ? (
          <div className="text-sm text-slate-600">
            Connected as <b>{status.email}</b> · sent {status.sentLast24h}/{status.dailyLimit} in the last 24 h · one email every {status.sendIntervalSeconds}s
            {status.lastError && <div className="text-xs text-red-600">Last Gmail error: {status.lastError}</div>}
          </div>
        ) : status.configured && !status.forceDryRun ? (
          <div className="text-sm text-slate-600">Connect your Gmail so campaigns are sent from your own address. We only ask for permission to send.</div>
        ) : (
          <div className="text-sm text-amber-700">
            Gmail sending is not set up on this server yet. You can still run campaigns in <b>test run</b> mode to see exactly what each lead would receive.
          </div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
      {status.connected ? (
        <button type="button" className="btn-secondary" disabled={busy} onClick={disconnect}>
          Disconnect Gmail
        </button>
      ) : (
        status.configured &&
        !status.forceDryRun && (
          <button type="button" className="btn-primary" disabled={busy} onClick={connect}>
            {busy ? 'Opening Google…' : 'Connect Gmail'}
          </button>
        )
      )}
    </div>
  );
}
