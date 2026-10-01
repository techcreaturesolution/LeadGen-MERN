import { api } from './api.js';

export async function updateClient(id, body) {
  await api.patch(`/admin/users/${id}`, body);
}
