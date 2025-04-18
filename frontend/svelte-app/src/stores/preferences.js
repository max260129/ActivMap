import { writable } from 'svelte/store';

export const preferences = writable({
  map_style: 'dark',
  default_distance: 150,
  max_points: 5000,
  language: 'fr',
  notifications_enabled: true,
  username: '',
  email: ''
}); 