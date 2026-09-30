import axios from 'axios';

export const TOKEN_KEY = 'leadgen_token';

export const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ''}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.assign('/login');
    }
    return Promise.reject(err);
  },
);

export function errMsg(err) {
  return err?.response?.data?.error || err?.message || 'Something went wrong';
}

export async function downloadExport(params) {
  let res;
  try {
    res = await api.get('/leads/export', { params, responseType: 'blob' });
  } catch (err) {
    const body = err.response?.data;
    if (body instanceof Blob) {
      try {
        err.response.data = JSON.parse(await body.text());
      } catch {
        /* keep original error */
      }
    }
    throw err;
  }
  const disposition = res.headers['content-disposition'] || '';
  const name = disposition.match(/filename="([^"]+)"/)?.[1] || `leads-${params.count}.xlsx`;
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const SOURCE_LABELS = { google_maps: 'Google Maps', linkedin: 'LinkedIn', instagram: 'Instagram' };

export async function uploadGroupExcel(groupId, file) {
  const { data } = await api.post(`/groups/${groupId}/import`, file, {
    params: { fileName: file.name },
    headers: { 'Content-Type': 'application/octet-stream' },
  });
  return data;
}

export const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');
