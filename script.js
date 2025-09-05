// script.js (Firebase v9 compatible)

import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-database.js";

const db = window.db; // from index.html firebase setup
const vehiclesRef = ref(db, "vehicles");
const controlRef = ref(db, "control");

// Initialize Leaflet map centered at ABU Zaria
const map = L.map('map').setView([11.111, 7.722], 13);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

// Keep markers and trails
const vehicleMarkers = {};
const vehicleTrails = {};
const vehiclePaths = {}; // store coordinates

// Geofence center (ABU Zaria admin center)
const geofenceCenter = { lat: 11.111, lng: 7.722 };
const geofenceRadius = 10; // km

// Haversine formula for distance
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Listen for vehicle updates
onValue(vehiclesRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  // Update table
  const tbody = document.getElementById("statusTableBody");
  if (!tbody) return; // avoid null error
  tbody.innerHTML = "";

  Object.keys(data).forEach(vehicleId => {
    const v = data[vehicleId];
    if (!v.lat || !v.lng) return;

    const latlng = [v.lat, v.lng];

    // --- Marker logic ---
    if (!vehicleMarkers[vehicleId]) {
      vehicleMarkers[vehicleId] = L.marker(latlng).addTo(map);
      vehiclePaths[vehicleId] = [latlng];
      vehicleTrails[vehicleId] = L.polyline(vehiclePaths[vehicleId], { color: getColor(vehicleId) }).addTo(map);
    } else {
      vehicleMarkers[vehicleId].setLatLng(latlng);
      vehiclePaths[vehicleId].push(latlng);
      vehicleTrails[vehicleId].setLatLngs(vehiclePaths[vehicleId]);
    }

    vehicleMarkers[vehicleId].bindPopup(
      `${vehicleId}<br>Speed: ${v.speed || 0} km/h`
    );

    // --- Geofence check ---
    const dist = haversine(geofenceCenter.lat, geofenceCenter.lng, v.lat, v.lng);
    let status = "Inside";
    if (dist > geofenceRadius) {
      status = "⚠ Outside";
      alert(`${vehicleId} has left the geofence!`);
    }

    // --- Update table row ---
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${vehicleId}</td>
      <td>${v.speed || 0}</td>
      <td>${v.lat.toFixed(5)}</td>
      <td>${v.lng.toFixed(5)}</td>
      <td>${status}</td>
    `;
    tbody.appendChild(row);
  });
});

// Assign colors to trails by vehicle
function getColor(vehicleId) {
  const colors = ["blue", "green", "red", "orange", "purple", "brown"];
  const ids = Object.keys(vehicleMarkers);
  const index = ids.indexOf(vehicleId) % colors.length;
  return colors[index];
}

// --- Override button logic ---
document.getElementById("overrideOn").addEventListener("click", () => {
  update(controlRef, { override: true });
  alert("Override ENABLED");
});

document.getElementById("overrideOff").addEventListener("click", () => {
  update(controlRef, { override: false });
  alert("Override DISABLED");
});

