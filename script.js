// script.js (Firebase v9 compatible)

import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-database.js";

const db = window.db; // from index.html firebase setup
const vehiclesRef = ref(db, "vehicle");
const controlRef = ref(db, "control");

// Initialize Leaflet map centered at ABU Zaria
const map = L.map("map").setView([11.1533, 7.6544], 15);

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// Keep markers and trails
const vehicleMarkers = {};
const vehicleTrails = {};
const vehiclePaths = {};

// Geofence center (ABU Zaria Senate building)
const geofenceCenter = { lat: 11.1533, lng: 7.6544 };
const geofenceRadius = 10; // km

// Haversine formula for distance
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Assign fixed colors to vehicles
function getColor(vehicleId) {
  const colorMap = {
    vehicle1: "blue",
    vehicle2: "green",
  };
  return colorMap[vehicleId] || "red"; // default red if not listed
}

// Listen for vehicle updates
onValue(vehiclesRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  // ✅ Fix: use the actual table <tbody> in index.html
  const tbody = document.querySelector("#statusTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  Object.keys(data).forEach((vehicleId) => {
    const v = data[vehicleId];
    if (!v.lat || !v.lng) return;

    const latlng = [v.lat, v.lng];

    // --- Marker logic ---
    if (!vehicleMarkers[vehicleId]) {
      const markerIcon = L.AwesomeMarkers.icon({
        icon: "car",
        prefix: "fa",
        markerColor: getColor(vehicleId),
      });

      vehicleMarkers[vehicleId] = L.marker(latlng, { icon: markerIcon }).addTo(map);

      vehiclePaths[vehicleId] = [latlng];
      vehicleTrails[vehicleId] = L.polyline(vehiclePaths[vehicleId], {
        color: getColor(vehicleId),
      }).addTo(map);
    } else {
      vehicleMarkers[vehicleId].setLatLng(latlng);
      vehiclePaths[vehicleId].push(latlng);
      vehicleTrails[vehicleId].setLatLngs(vehiclePaths[vehicleId]);
    }

    vehicleMarkers[vehicleId].bindPopup(
      `${vehicleId}<br>Speed: ${v.speed || 0} km/h`
    );

    // --- Geofence check ---
    const dist = haversine(
      geofenceCenter.lat,
      geofenceCenter.lng,
      v.lat,
      v.lng
    );
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

// --- Override button logic ---
document.getElementById("overrideOn").addEventListener("click", () => {
  update(controlRef, { override: true });
  alert("Override ENABLED");
});

document.getElementById("overrideOff").addEventListener("click", () => {
  update(controlRef, { override: false });
  alert("Override DISABLED");
});
