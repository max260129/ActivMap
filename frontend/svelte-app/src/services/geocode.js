// services/geocode.js
export async function geocode(query) {
    if (!query.trim()) return [];
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'ActivMap/1.0 (+https://example.com)' } });
    if (!r.ok) return [];
    return await r.json();          // [{display_name, lat, lon, type, ...}, …]
  }


// export async function reverseGeocode(lat, lon) {
//     try {
//       const r = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
//       );
//       if (!r.ok) return '';
//       const data = await r.json();
//       return data.display_name || '';
//     } catch {
//       return '';
//     }
// }
