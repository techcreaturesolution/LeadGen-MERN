import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

export function useGmailStatus() {
  const [status, setStatus] = useState(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((n) => n + 1), []);
  useEffect(() => {
    let alive = true;
    api
      .get('/gmail/status')
      .then((r) => alive && setStatus(r.data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [version]);
  return [status, reload];
}
