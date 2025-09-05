// script.js

// Initialize Leaflet map centered at ABU Zaria
const map = L.map('map').setView([11.111, 7.722], 13);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

// Reference Firebase database
const vehiclesRef = db.ref("vehicles");

// Listen for updates
vehiclesRef.on("value", (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  // Clear old markers before redrawing
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  // Add markers for each vehicle
  Object.keys(data).forEach(vehicleId => {
    const v = data[vehicleId];
    if (v.lat && v.lng) {
      L.marker([v.lat, v.lng]).addTo(map)
        .bindPopup(`${vehicleId}<br>Speed: ${v.speed || 0} km/h`);
    }
  });
});
