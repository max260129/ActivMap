import { writable } from 'svelte/store';
import { io } from 'socket.io-client';
import { getToken } from './auth.js';

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