import { api } from './api.js';
import { getCurrentUser } from './state.js';

function showDot(type, show) {
  const link = document.querySelector(`[data-notify="${type}"]`);
  if (!link) return;

  const dot = link.querySelector('.notification-dot');
  if (!dot) return;

  if (show) {
    dot.classList.remove('hidden');
  } else {
    dot.classList.add('hidden');
  }
}

function storageKey(type, userID) {
  return `convoyapp_${type}_seen_${userID}`;
}

export async function checkNotifications() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  await checkFriendNotifications(currentUser);
  await checkMessageNotifications(currentUser);
  await checkConvoyNotifications(currentUser);
}

async function checkFriendNotifications(currentUser) {
  try {
    const requests = await api(`/friends/requests/${currentUser.userID}`);
    showDot('friends', requests.length > 0);
  } catch (error) {
    showDot('friends', false);
  }
}

async function checkMessageNotifications(currentUser) {
  try {
    const contacts = await api(`/users/${currentUser.userID}/contacts`);

    let newestIncomingMessageID = 0;

    for (const contact of contacts) {
      const messages = await api(`/messages/${currentUser.userID}/${contact.userID}`);

      messages.forEach(message => {
        if (Number(message.receiver_id) === Number(currentUser.userID)) {
          newestIncomingMessageID = Math.max(newestIncomingMessageID, Number(message.id));
        }
      });
    }

    const seenID = Number(localStorage.getItem(storageKey('messages', currentUser.userID)) || 0);

    showDot('messages', newestIncomingMessageID > seenID);

    return newestIncomingMessageID;
  } catch (error) {
    showDot('messages', false);
    return 0;
  }
}

async function checkConvoyNotifications(currentUser) {
  try {
    const convoys = await api(`/convoys/by-user/${currentUser.userID}`);

    let newestGpsTime = 0;

    for (const convoy of convoys) {
      const gpsRows = await api(`/gps/${convoy.convoyID}`);

      gpsRows.forEach(row => {
        if (Number(row.userID) !== Number(currentUser.userID)) {
          const time = new Date(row.updatedAt).getTime();
          newestGpsTime = Math.max(newestGpsTime, time);
        }
      });
    }

    const seenTime = Number(localStorage.getItem(storageKey('convoys', currentUser.userID)) || 0);

    showDot('convoys', newestGpsTime > seenTime);

    return newestGpsTime;
  } catch (error) {
    showDot('convoys', false);
    return 0;
  }
}

export async function markCurrentPageAsRead() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const path = window.location.pathname;

  if (path.endsWith('/friends.html')) {
    localStorage.setItem(storageKey('friends', currentUser.userID), Date.now());
    showDot('friends', false);
  }

  if (path.endsWith('/messages.html')) {
    const newestMessageID = await checkMessageNotifications(currentUser);
    localStorage.setItem(storageKey('messages', currentUser.userID), newestMessageID);
    showDot('messages', false);
  }

  if (path.endsWith('/convoys.html')) {
    const newestGpsTime = await checkConvoyNotifications(currentUser);
    localStorage.setItem(storageKey('convoys', currentUser.userID), newestGpsTime);
    showDot('convoys', false);
  }
}

export function startNotificationSystem() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  checkNotifications();
  markCurrentPageAsRead();

  setInterval(checkNotifications, 5000);
}