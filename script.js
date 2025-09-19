// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Your Firebase config (replace with your own)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Admin (geofence center)
const adminLocation = { lat: 11.1556, lng: 7.6625 }; // ABU Zaria coords
const geofenceRadius = 10000; // 10 km

// Leaflet map setup
const map = L.map("map").setView([adminLocation.lat, adminLocation.lng], 13);

// Tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

// Admin marker
L.circleMarker([adminLocation.lat, adminLocation.lng], {
  radius: 6,
  color: "black",
  fillColor: "black",
  fillOpacity: 1
}).addTo(map).bindPopup("Admin Location");

// Geofence circle
L.circle([adminLocation.lat, adminLocation.lng], {
  radius: geofenceRadius,
  color: "red",
  fill: false
}).addTo(map);

// Markers storage
const vehicleMarkers = {};
const vehiclePaths = {};

// Table reference
const tableBody = document.querySelector("#vehicleTable tbody");

// Distance helper
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// Listen for vehicle data
const vehiclesRef = ref(db, "vehicle");
onValue(vehiclesRef, (snapshot) => {
  const data = snapshot.val();
  tableBody.innerHTML = ""; // clear table

  Object.keys(data).forEach((id) => {
    const v = data[id];
    if (!v.lat || !v.lng) return;

    // Update or create marker
    if (!vehicleMarkers[id]) {
      vehicleMarkers[id] = L.marker([v.lat, v.lng]).addTo(map).bindPopup(`Vehicle ${id}`);
      vehiclePaths[id] = L.polyline([[v.lat, v.lng]], { color: getColor(id) }).addTo(map);
    } else {
      vehicleMarkers[id].setLatLng([v.lat, v.lng]);
      vehiclePaths[id].addLatLng([v.lat, v.lng]);
    }

    // Geofencing
    const distance = getDistance(v.lat, v.lng, adminLocation.lat, adminLocation.lng);
    if (distance > geofenceRadius) {
      alert(`⚠ Vehicle ${id} has exited the geofence!`);
    }

    // Speed limit alert
    if (v.speed && v.speed > 50) {
      alert(`⚠ Vehicle ${id} is overspeeding! (${v.speed} km/h)`);
    }

    // Update table row
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${id}</td>
      <td>${v.lat.toFixed(5)}</td>
      <td>${v.lng.toFixed(5)}</td>
      <td>${v.speed || 0}</td>
      <td>
        <button onclick="shutOffVehicle('${id}')">Shut Off</button>
        <button onclick="restoreVehicle('${id}')">Restore</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
});

// Color helper
function getColor(id) {
  const colors = ["blue", "green", "orange", "purple", "brown"];
  return colors[(parseInt(id) - 1) % colors.length];
}

// Vehicle control functions
window.shutOffVehicle = function (id) {
  const controlRef = ref(db, `vehicle/${id}/control`);
  set(controlRef, {
    command: "SHUT_OFF",
    timestamp: new Date().toISOString()
  }).then(() => alert(`Shutdown sent to Vehicle ${id}`));
};

window.restoreVehicle = function (id) {
  const controlRef = ref(db, `vehicle/${id}/control`);
  set(controlRef, {
    command: "RESTORE",
    timestamp: new Date().toISOString()
  }).then(() => alert(`Restore sent to Vehicle ${id}`));
};
