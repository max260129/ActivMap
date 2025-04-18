<script>
    import { onMount } from 'svelte';
    import L from 'leaflet';
    import 'leaflet-draw';
  
    /* variables liées à App.svelte */
    export let lat;      // ex. 49.444838
    export let lon;      // ex. 1.094214
    export let radius;   // ex. 150  (m)
  
    let mapEl, map, circle;
    let internal = false;      // évite la boucle infinie
  
    onMount(() => {
      map = L.map(mapEl).setView([lat, lon], zoomFor(radius));
  
      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '© OpenStreetMap' }
      ).addTo(map);
  
      circle = L.circle([lat, lon], { radius, color: '#cc5200' }).addTo(map);
  
      /* — centre par simple clic — */
      map.on('click', e => {
        internal = true;
        lat = +e.latlng.lat.toFixed(6);
        lon = +e.latlng.lng.toFixed(6);
        circle.setLatLng(e.latlng);
        internal = false;
      });
  
      /* — déplacement / redimension via Leaflet‑Draw — */
      const ctl = new L.Control.Draw({
        edit: { featureGroup: L.featureGroup([circle]), edit: true, remove: false },
        draw: false
      });
      map.addControl(ctl);
  
      const sync = e => {
        internal = true;
        const c = e.layer || e.target;           // selon l’événement
        radius = Math.round(c.getRadius());
        ({ lat, lng: lon } = c.getLatLng());
        internal = false;
      };
  
      map.on('draw:editmove',   sync);   // drag du centre
      map.on('draw:editresize', sync);   // poignée de rayon
    });
  
    /* — inputs → carte — */
    $: if (!internal && circle) {
      circle.setLatLng([lat, lon]);
      circle.setRadius(+radius);
    }
  
    /* zoom de départ très simple */
    const zoomFor = r =>
      r > 5000 ? 11 :
      r > 2000 ? 12 :
      r > 1000 ? 13 :
      r >  500 ? 14 : 15;
  </script>
  
  <style>
    .map {
      width: 100%;
      height: 400px;
      border: 2px solid #cc5200;
      border-radius: 8px;
    }
  </style>
  
  <div bind:this={mapEl} class="map"></div>
  