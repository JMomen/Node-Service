import { api } from './api.js';
import { getCurrentUser } from './state.js';
import { gpsResult, gpsList } from './doc.js';
import { setText, requireLogin, getActiveConvoyID } from './ui.js';

const addressCache = {};

async function getAddressFromCoords(latitude, longitude) {
  const lat = Number(latitude).toFixed(6);
  const lng = Number(longitude).toFixed(6);
  const cacheKey = `${lat},${lng}`;

  if (addressCache[cacheKey]) {
    return addressCache[cacheKey];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );

    const data = await response.json();

    if (!data.address) {
      const fallback = `Near ${lat}, ${lng}`;
      addressCache[cacheKey] = fallback;
      return fallback;
    }

    const addr = data.address;

    const place =
      addr.amenity ||
      addr.shop ||
      addr.building ||
      addr.road ||
      addr.neighbourhood ||
      addr.suburb ||
      addr.county ||
      'nearby area';

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.hamlet ||
      addr.county ||
      '';

    const address = city
      ? `Near ${place}, ${city}`
      : `Near ${place}`;

    addressCache[cacheKey] = address;

    return address;
  } catch (error) {
    const fallback = `Near ${lat}, ${lng}`;
    addressCache[cacheKey] = fallback;
    return fallback;
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

  if (!gpsList) {
    return;
  }

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

    const htmlParts = await Promise.all(
      locations.map(async function (row) {
        const address = await getAddressFromCoords(row.latitude, row.longitude);

        return `
          <div class="gps-location-card">
            <strong>${row.userName}</strong><br>
            ${address}<br>
            <a href="https://www.google.com/maps?q=${row.latitude},${row.longitude}" target="_blank" rel="noreferrer">
              View on map
            </a>
          </div>
        `;
      })
    );

    const newHtml = htmlParts.join('');

    if (gpsList.innerHTML.trim() !== newHtml.trim()) {
      gpsList.innerHTML = newHtml;
    }
  } catch (error) {
    gpsList.innerHTML = `<p class="error">${error.message}</p>`;
  }
}