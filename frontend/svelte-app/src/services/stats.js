import { fetchWithAuth } from './auth.js';

const BASE = '/stats';

export async function getStats() {
  const res = await fetchWithAuth(BASE);
  if (!res.ok) throw new Error('Erreur récupération statistiques');
  return await res.json();
} 