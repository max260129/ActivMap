import { fetchWithAuth } from './auth.js';

export async function fetchThread(threadId){
  const res = await fetchWithAuth(`/report/thread/${threadId}`, { method:'GET'});
  return res.json();
}

export async function sendMessage(threadId, body){
  const res = await fetchWithAuth(`/report/thread/${threadId}/messages`, {
    method:'POST',
    body: JSON.stringify({ body })
  });
  return res.json();
}

export async function deleteThread(threadId){
  const res = await fetchWithAuth(`/report/thread/${threadId}`, { method:'DELETE' });
  return res.json();
} 