import { writable, get } from 'svelte/store';
import { io } from 'socket.io-client';
import { getToken } from './auth.js';
import { currentThread } from '../components/socketStore.js';

// Store Svelte exposant l'instance socket ou null si non connecté
export const socket = writable(null);

export function initSocket() {
  const token = getToken();
  if (!token) {
    console.warn('initSocket : pas de token, connexion WS ignorée');
    return;
  }

  const s = io('http://localhost:5000', {
    transports: ['websocket'],
    auth: {
      token
    }
  });

  // Gestion d'erreur basique
  s.on('connect_error', (err) => {
    console.error('Erreur connexion WS', err.message);
  });

  socket.set(s);
}

export function joinThread(threadId){
  const s = get(socket);
  if(s){ s.emit('join_thread', { thread_id: threadId }); }
}

// Events temps réel pour la messagerie
socket.subscribe(s=>{
  if(!s) return;
  s.on('report_message', msg=>{
    currentThread.update(t=>{
      if(t && t.id===msg.thread_id){
        return {...t, messages:[...t.messages,msg]};
      }
      return t;
    });
  });
  s.on('thread_deleted', d=>{
    currentThread.update(t=> t && t.id===d.thread_id ? null : t);
  });
}); 