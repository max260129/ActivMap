import { fetchWithAuth } from './auth.js';

const BASE = '/settings';

export async function getSettings() {
  const res = await fetchWithAuth(BASE);
  if (!res.ok) throw new Error('Erreur récupération paramètres');
  return await res.json();
}

export async function updateSettings(payload) {
  const res = await fetchWithAuth(BASE, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur mise à jour paramètres');
  return await res.json();
}

export async function changePassword(oldPassword, newPassword) {
  const res = await fetchWithAuth('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
  });
  if (!res.ok) throw new Error('Erreur changement mot de passe');
  return await res.json();
} 