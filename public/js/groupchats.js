import { api } from './api.js';

import {
  getCurrentUser,
  setSelectedContact,
  getMessagePoll,
  setMessagePoll
} from './state.js';

import { chatTitle, messagesBox, contactsList } from './doc.js';

import { showChatPanel } from './ui.js';

import { escapeHtml } from './utils.js';

let selectedGroupChat = null;

export function getSelectedGroupChat() {
  return selectedGroupChat;
}

export function setSelectedGroupChat(group) {
  selectedGroupChat = group;
}

export async function loadGroupChats() {
  const currentUser = getCurrentUser();

  if (!currentUser || !contactsList) {
    return;
  }

  showChatPanel('Select a convoy chat');
  setSelectedContact(null);
  selectedGroupChat = null;
  messagesBox.innerHTML = '';

  const leaveGroupBtn = document.getElementById('leaveGroupBtn');
  if (leaveGroupBtn) leaveGroupBtn.style.display = 'none';

  contactsList.innerHTML = '';

  try {
    const groups = await api(`/groups/${currentUser.userID}`);

    if (groups.length === 0) {
      contactsList.innerHTML = '<p>Join or create a convoy first.</p>';
      return;
    }

    groups.forEach(function (group) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'contact-btn';
      button.textContent = `Convoy: ${group.name}`;

      button.addEventListener('click', function () {
        selectGroupChat(group);
      });

      contactsList.appendChild(button);
    });
  } catch (error) {
    contactsList.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

export async function createGroup(event) {
  if (event) event.preventDefault();
  alert('Group chats are now created automatically from convoys.');
}

export async function selectGroupChat(group) {
  selectedGroupChat = group;
  setSelectedContact(null);

  showChatPanel(`Convoy Chat: ${group.name}`);

  const leaveGroupBtn = document.getElementById('leaveGroupBtn');
  if (leaveGroupBtn) leaveGroupBtn.style.display = 'none';

  await loadGroupMessages();

  const oldPoll = getMessagePoll();
  if (oldPoll) clearInterval(oldPoll);

  const newPoll = setInterval(loadGroupMessages, 3000);
  setMessagePoll(newPoll);
}

export async function loadGroupMessages() {
  const currentUser = getCurrentUser();

  if (!currentUser || !selectedGroupChat || !messagesBox) {
    return;
  }

  try {
    const messages = await api(`/group-messages/${selectedGroupChat.id}`);

    if (messages.length === 0) {
      messagesBox.innerHTML = '<p>No convoy messages yet.</p>';
      return;
    }

    messagesBox.innerHTML = messages
      .map(function (message) {
        let who = `${message.first_name} ${message.last_name}`;
        let extraClass = '';

        if (Number(message.sender_id) === Number(currentUser.userID)) {
          who = 'You';
          extraClass = 'mine';
        }

        return `<div class="message ${extraClass}"><strong>${escapeHtml(who)}:</strong> ${escapeHtml(message.message_text)}</div>`;
      })
      .join('');

    messagesBox.scrollTop = messagesBox.scrollHeight;
  } catch (error) {
    messagesBox.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

export async function sendMessage(event) {
  event.preventDefault();

  const currentUser = getCurrentUser();

  if (!currentUser) return;

  if (!selectedGroupChat) {
    alert('Select a convoy chat first.');
    return;
  }

  const input = document.getElementById('messageInput');
  const messageText = input.value.trim();

  if (!messageText) return;

  try {
    await api('/group-messages', {
      method: 'POST',
      body: JSON.stringify({
        group_id: selectedGroupChat.id,
        sender_id: currentUser.userID,
        message_text: messageText
      })
    });

    input.value = '';
    await loadGroupMessages();
  } catch (error) {
    alert(error.message);
  }
}

export async function leaveGroupChat() {
  alert('Convoy chats are based on convoy membership. Leave the convoy to leave this chat.');
}
