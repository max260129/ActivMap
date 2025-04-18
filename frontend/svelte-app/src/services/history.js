import { fetchWithAuth } from './auth.js';

const BASE = '/history';

export async function getHistory(page = 1, limit = 20) {
  const res = await fetchWithAuth(`${BASE}?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error('Erreur récupération historique');
  return await res.json();
}

export async function deleteHistory(id) {
  const res = await fetchWithAuth(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur suppression');
  return await res.json();
}

export async function regenerateHistory(id) {
  const res = await fetchWithAuth(`${BASE}/${id}/regenerate`, { method: 'POST' });
  if (!res.ok) throw new Error('Erreur regénération');
  return await res.json();
}

// Télécharge le SVG protégé et renvoie une URL Blob locale
export async function fetchFile(id) {
  const res = await fetchWithAuth(`${BASE}/${id}/file`);
  if (!res.ok) throw new Error('Erreur téléchargement carte');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
} 