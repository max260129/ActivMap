import App from './App.svelte';
import 'leaflet/dist/leaflet.css';

import * as L from 'leaflet';
// Rendez L disponible globalement si nécessaire
window.L = L;

const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

export default app;