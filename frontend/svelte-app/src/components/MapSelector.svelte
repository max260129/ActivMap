<script>
  import { onMount } from 'svelte';
  import * as L from 'leaflet';
  import 'leaflet/dist/leaflet.css';

  // Props reçues du parent
  export let lat = 49.4448;
  export let lon = 1.0939;
  export let radius = 200; // en mètres

  let mapContainer;  // bind:this du div
  let map;
  let circle;

  // Réactive : met à jour le cercle et recentre la carte
  $: if (map && circle) {
    circle.setLatLng([lat, lon]).setRadius(radius);
    map.panTo([lat, lon], { animate: false });
  }

  onMount(() => {
    // Initialisation de la carte
    map = L.map(mapContainer).setView([lat, lon], 16);

    // Tiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Cercle initial
    circle = L.circle([lat, lon], {
      radius,
      color: 'red',
      weight: 2,
      fillOpacity: 0.2
    }).addTo(map);

    // 1. Clic sur la carte → met à jour lat/lon
    map.on('click', (e) => {
      lat = Number(e.latlng.lat.toFixed(6));
      lon = Number(e.latlng.lng.toFixed(6));
    });

    // 2. Molette (wheel) sur la carte avec Ctrl pour redimensionner
    map.getContainer().addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        // Ajuste le radius, positive deltaY = scroll down = augmenter
        radius = Math.max(50, radius + e.deltaY * 1);
      }
    });
  });
</script>

<style>
  /* Assure-toi qu'il y a une hauteur pour afficher la carte */
  .map-container {
    width: 100%;
    height: 380px;
  }
</style>

<div bind:this={mapContainer} class="map-container"></div>