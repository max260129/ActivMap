import { writable } from 'svelte/store';
import { socket } from '../services/socket.js';

export const preferences = writable({
  map_style: 'dark',
  default_distance: 150,
  max_points: 5000,
  language: 'fr',
  notifications_enabled: true,
  username: '',
  email: ''
});

// Sync temps réel via WebSocket
autoSubscribeSocket();

function autoSubscribeSocket() {
  socket.subscribe((s) => {
    if (!s) return;
    s.on('settings_changed', (payload) => {
      preferences.set(payload);
    });
  });
} 