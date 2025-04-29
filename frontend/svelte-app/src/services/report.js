import { fetchWithAuth } from './auth.js';

// Envoie un signalement (texte + fichiers) au backend
export async function sendReport({ description, files }) {
  const fd = new FormData();
  fd.append('description', description);
  files.forEach(file => fd.append('attachments', file));
  const response = await fetchWithAuth('/report', {
    method: 'POST',
    body: fd
  });
  return response.json();
}

// Récupère la liste des signalements (admin uniquement)
export async function fetchReports() {
  const response = await fetchWithAuth('/report', {
    method: 'GET'
  });
  return response.json();
} 