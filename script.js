import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-database.js";

// Initialize the map
const map = L.map('map').setView([11.1533, 7.6544], 13);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Admin location marker
L.circleMarker([11.1533, 7.6544], {
  radius: 8,
  color: "black",
  fillColor: "black",
  fillOpacity: 1
}).addTo(map).bindPopup("Admin Location");

// Containers
const markers = {};
const trails = {};
const colors = ["blue", "green", "orange", "purple", "red"];

// Listen to Firebase vehicle data
const dbRef = ref(window.db, "vehicle");
onValue(dbRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  Object.entries(data).forEach(([vehicleId, v], i) => {
    const lat = Number(v.lat);   // force to number
    const lng = Number(v.lng);   // force to number

    if (isNaN(lat) || isNaN(lng)) return; // skip bad values
    const latlng = [lat, lng];

    // If first time → create marker + trail
    if (!markers[vehicleId]) {
      markers[vehicleId] = L.marker(latlng).addTo(map);
      trails[vehicleId] = L.polyline([latlng], { color: colors[i % colors.length] }).addTo(map);
    } else {
      // Update position & trail
      markers[vehicleId].setLatLng(latlng);
      trails[vehicleId].addLatLng(latlng);
    }

    // Popup with speed
    markers[vehicleId].bindPopup(
      `${vehicleId}<br>Speed: ${v.speed || 0} km/h`
    );
  });
});

// Override buttons
document.getElementById("overrideOn").addEventListener("click", () => {
  set(ref(window.db, "admin/override"), "ON");
  alert("Override ENABLED");
});

document.getElementById("overrideOff").addEventListener("click", () => {
  set(ref(window.db, "admin/override"), "OFF");
  alert("Override DISABLED");
});
