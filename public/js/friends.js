import { api } from './api.js';
import { getCurrentUser } from './state.js';

import {
  friendRequestForm,
  friendResult,
  friendsList,
  requestsList,
  contactsList
} from './doc.js';

import { setText, requireLogin, showChatPanel } from './ui.js';
import { selectContact } from './messages.js';
import { setSelectedGroupChat } from './groupchats.js';

let showingBlocked = false;

export async function sendFriendRequest(event) {
  event.preventDefault();

  if (!requireLogin()) {
    return;
  }

  const currentUser = getCurrentUser();
  const friendUsername = document.getElementById('friendUsername').value.trim();

  try {
    const data = await api('/friends/request', {
      method: 'POST',
      body: JSON.stringify({
        currentUserID: currentUser.userID,
        friendUsername: friendUsername
      })
    });

    setText(friendResult, data.message);
    friendRequestForm.reset();
    await loadRequests();
  } catch (error) {
    setText(friendResult, error.message, true);
  }
}

export async function loadFriends() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  try {
    if (showingBlocked) {
      const blocked = await api(`/friends/blocked/${currentUser.userID}`);

      if (blocked.length === 0) {
        friendsList.innerHTML = '<p>No blocked users.</p>';
        return;
      }

      friendsList.innerHTML = blocked.map(user => `
        <div class="friend-row">
          <span>${user.userName}</span>
          <div class="friend-actions">
            <button class="unblock-btn" data-id="${user.userID}">Unblock</button>
          </div>
        </div>
      `).join('');

      friendsList.querySelectorAll('.unblock-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          await unblockUser(Number(btn.dataset.id));
        });
      });

      return;
    }

    const friends = await api(`/friends/list/${currentUser.userID}`);

    if (friends.length === 0) {
      friendsList.innerHTML = '<p>No friends yet.</p>';
      return;
    }

    friendsList.innerHTML = friends.map(friend => `
      <div class="friend-row">
        <span>${friend.userName}</span>
        <div class="friend-actions">
          <button class="remove-btn" data-id="${friend.userID}">Unadd</button>
          <button class="block-btn" data-id="${friend.userID}">Block</button>
        </div>
      </div>
    `).join('');

    friendsList.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await removeFriend(Number(btn.dataset.id));
      });
    });

    friendsList.querySelectorAll('.block-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await blockUser(Number(btn.dataset.id));
      });
    });

  } catch (error) {
    friendsList.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

export async function loadRequests() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  try {
    const requests = await api(`/friends/requests/${currentUser.userID}`);

    if (requests.length === 0) {
      requestsList.innerHTML = '<p>No pending requests.</p>';
      return;
    }

    requestsList.innerHTML = '';

    requests.forEach(request => {
      const row = document.createElement('div');
      row.className = 'request-row';

      row.innerHTML = `
        <span>${request.senderName}</span>
        <div class="row gap">
          <button type="button" data-id="${request.sender_id}" data-accept="true">Accept</button>
          <button type="button" data-id="${request.sender_id}" data-accept="false">Deny</button>
        </div>
      `;

      requestsList.appendChild(row);
    });

    requestsList.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', async () => {
        const senderID = Number(button.dataset.id);
        const accept = button.dataset.accept === 'true';
        await respondToRequest(senderID, accept);
      });
    });

  } catch (error) {
    requestsList.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

export async function respondToRequest(senderID, accept) {
  const currentUser = getCurrentUser();

  try {
    const data = await api('/friends/respond', {
      method: 'POST',
      body: JSON.stringify({
        sender_id: senderID,
        receiver_id: currentUser.userID,
        accept: accept
      })
    });

    setText(friendResult, data.message);
    await loadFriends();
    await loadRequests();

  } catch (error) {
    setText(friendResult, error.message, true);
  }
}

export async function loadContacts() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  showChatPanel('Select someone to chat');
  setSelectedGroupChat(null);

  const leaveGroupBtn = document.getElementById('leaveGroupBtn');
  if (leaveGroupBtn) leaveGroupBtn.style.display = 'none';

  try {
    const groupCreateBox = document.getElementById('groupCreateBox');
    if (groupCreateBox) groupCreateBox.style.display = 'none';

    const contacts = await api(`/users/${currentUser.userID}/contacts`);

    contactsList.innerHTML = '';

    if (contacts.length === 0) {
      contactsList.innerHTML = '<p>No contacts available.</p>';
      return;
    }

    contacts.forEach(contact => {
      const button = document.createElement('button');
      button.className = 'contact-btn';
      button.textContent = `${contact.first_name} ${contact.last_name} (@${contact.userName})`;

      button.addEventListener('click', () => {
        selectContact(contact);
      });

      contactsList.appendChild(button);
    });

  } catch (error) {
    contactsList.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

async function removeFriend(friendID) {
  const currentUser = getCurrentUser();

  try {
    const data = await api('/friends/remove', {
      method: 'POST',
      body: JSON.stringify({
        currentUserID: currentUser.userID,
        friendID: friendID
      })
    });

    setText(friendResult, data.message);
    await loadFriends();

  } catch (error) {
    setText(friendResult, error.message, true);
  }
}

async function blockUser(friendID) {
  const currentUser = getCurrentUser();

  try {
    const data = await api('/friends/block', {
      method: 'POST',
      body: JSON.stringify({
        currentUserID: currentUser.userID,
        targetUserID: friendID
      })
    });

    setText(friendResult, data.message);
    await loadFriends();

  } catch (error) {
    setText(friendResult, error.message, true);
  }
}

async function unblockUser(friendID) {
  const currentUser = getCurrentUser();

  try {
    const data = await api('/friends/unblock', {
      method: 'POST',
      body: JSON.stringify({
        currentUserID: currentUser.userID,
        targetUserID: friendID
      })
    });

    setText(friendResult, data.message);
    await loadFriends();

  } catch (error) {
    setText(friendResult, error.message, true);
  }
}

const toggleBlockedBtn = document.getElementById('toggleBlockedBtn');
if (toggleBlockedBtn) {
  toggleBlockedBtn.addEventListener('click', async function () {
    showingBlocked = !showingBlocked;

    this.textContent = showingBlocked
      ? 'Hide Blocked Users'
      : 'Show Blocked Users';

    await loadFriends();
  });
}

export async function showFriendsOnly() {
  showingBlocked = false;

  const toggleBlockedBtn = document.getElementById('toggleBlockedBtn');
  if (toggleBlockedBtn) {
    toggleBlockedBtn.textContent = 'Show Blocked Users';
  }

  await loadFriends();
}