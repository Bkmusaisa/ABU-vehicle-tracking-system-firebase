import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-database.js";

// Initialize the map
const map = L.map('map').setView([11.1533, 7.6544], 13);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Admin location marker (black dot)
L.circleMarker([11.1533, 7.6544], {
  radius: 8,
  color: "black",
  fillColor: "black",
  fillOpacity: 1
}).addTo(map).bindPopup("Admin Location");

// Data containers
const markers = {};
const trails = {};
const colors = ["blue", "green", "orange", "purple", "red"];

// Listen to Firebase "vehicle"
const dbRef = ref(window.db, "vehicle");
onValue(dbRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  Object.entries(data).forEach(([key, v], i) => {
    const lat = v.lat;
    const lng = v.lng;

    if (lat == null || lng == null) return;  // skip if missing
    const latlng = [lat, lng];

    // Create marker & trail if first time
    if (!markers[key]) {
      markers[key] = L.marker(latlng).addTo(map);
      trails[key] = L.polyline([latlng], { color: colors[i % colors.length] }).addTo(map);
    } else {
      markers[key].setLatLng(latlng);    // update marker position
      trails[key].addLatLng(latlng);     // extend trail
    }
  });
});

// Override buttons
document.getElementById("overrideOn").addEventListener("click", () => {
  set(ref(window.db, "admin/override"), "ON");
});

document.getElementById("overrideOff").addEventListener("click", () => {
  set(ref(window.db, "admin/override"), "OFF");
});
