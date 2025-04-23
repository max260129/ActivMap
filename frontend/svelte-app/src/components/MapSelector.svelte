<script>
  import { onMount } from 'svelte';
  import L from 'leaflet';

  // props envoyées par le parent (Login /  page d’extraction)
  export let lat = 49.4448;
  export let lon = 1.0939;
  export let radius = 200;   // en mètres

  let map;            // référence à la carte
  let circle;         // référence au cercle

  // --- met à jour le cercle quand les props changent --------------
  $: if (map) {
        circle.setLatLng([lat, lon]).setRadius(radius);
        map.panTo([lat, lon], { animate: false });
     }

  onMount(() => {
    map = L.map('osm-map').setView([lat, lon], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    circle = L.circle([lat, lon], {
      radius,
      color: 'red',
      weight: 2,
      fillOpacity: 0.2
    }).addTo(map);

    // 1. clic sur la carte → met à jour lat/lon (binding réactif)
    map.on('click', e => {
      lat = e.latlng.lat.toFixed(6);
      lon = e.latlng.lng.toFixed(6);
    });

    // 2. molette ou ctrl-drag sur le cercle → redimensionner
    circle.on('mousewheel', e => {
      e.originalEvent.preventDefault();
      const delta = e.originalEvent.deltaY;
      radius = Math.max(50, Number(radius) + delta * 2);   // zoom in/out
    });
  });
</script>

<style>
  #osm-map { height: 380px; }
</style>

<div id="osm-map"></div>
