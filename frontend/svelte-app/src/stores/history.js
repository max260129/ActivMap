import { writable } from 'svelte/store';
import { socket } from '../services/socket.js';

export const historyItems = writable([]);

// Abonnement à la socket lorsqu'elle est disponible
socket.subscribe((s) => {
  if (!s) return;

  s.on('map_generated', (payload) => {
    historyItems.update((list) => [payload, ...list]);
  });

  s.on('map_deleted', ({ id }) => {
    historyItems.update((list) => list.filter((it) => it.id !== id));
  });
}); 