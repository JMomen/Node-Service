import { api } from './api.js';
import { getCurrentUser } from './state.js';
import { gpsResult, gpsList } from './doc.js';
import { setText, requireLogin, getActiveConvoyID } from './ui.js';

async function getAddressFromCoords(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );

    const data = await response.json();

    if (!data.address) {
      return `${latitude}, ${longitude}`;
    }

    const addr = data.address;

    const place =
      addr.amenity ||
      addr.shop ||
      addr.road ||
      addr.neighbourhood ||
      addr.suburb ||
      'Unknown area';

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      'Unknown city';

    return `Near "${place}" ${city}`;
  } catch (error) {
    return `${latitude}, ${longitude}`;
  }
}

export async function shareLocation() {
  if (!requireLogin()) {
    return;
  }

  const currentUser = getCurrentUser();
  const convoyID = getActiveConvoyID();

  if (!convoyID) {
    setText(gpsResult, 'Select a convoy first.', true);
    return;
  }

  if (!navigator.geolocation) {
    setText(gpsResult, 'Geolocation is not supported by this browser.', true);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async function (position) {
      try {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));

        await api('/gps', {
          method: 'POST',
          body: JSON.stringify({
            userID: currentUser.userID,
            convoyID: convoyID,
            latitude: latitude,
            longitude: longitude
          })
        });

        setText(gpsResult, 'Location shared successfully.');
        await loadGps();
      } catch (error) {
        setText(gpsResult, error.message, true);
      }
    },
    function (error) {
      setText(gpsResult, error.message || 'Could not get location.', true);
    }
  );
}

export async function loadGps() {
  const convoyID = getActiveConvoyID();

  if (!gpsList) return;

  if (!convoyID) {
    gpsList.innerHTML = '<p>No active convoy selected.</p>';
    return;
  }

  try {
    const locations = await api(`/gps/${convoyID}`);

    if (locations.length === 0) {
      gpsList.innerHTML = '<p>No GPS data yet.</p>';
      return;
    }

    gpsList.innerHTML = '<p>Loading addresses...</p>';

    const htmlParts = await Promise.all(
      locations.map(async function (row) {
        const address = await getAddressFromCoords(row.latitude, row.longitude);

        return `
          <div>
            <strong>${row.userName}</strong><br>
            ${address}<br>
            <a href="https://www.google.com/maps?q=${row.latitude},${row.longitude}" target="_blank" rel="noreferrer">
              View on map
            </a>
          </div>
        `;
      })
    );

    gpsList.innerHTML = htmlParts.join('');
  } catch (error) {
    gpsList.innerHTML = `<p class="error">${error.message}</p>`;
  }
}