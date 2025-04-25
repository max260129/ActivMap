import App from './App.svelte';
import 'leaflet/dist/leaflet.css';

// const map = L.map('carte').setView([latitude, longitude], zoom);

const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

export default app;