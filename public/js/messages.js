
import { api } from './api.js';

import {
  getCurrentUser,
  getSelectedContact,
  setSelectedContact,
  getMessagePoll,
  setMessagePoll
} from './state.js';

import { chatTitle, messagesBox } from './doc.js';

import { requireLogin, showChatPanel } from './ui.js';

import { escapeHtml } from './utils.js';

export async function selectContact(contact) {
  setSelectedContact(contact);
  showChatPanel(`Chat with ${contact.first_name} ${contact.last_name}`);

  await loadMessages();

  const oldPoll = getMessagePoll();

  if (oldPoll) {
    clearInterval(oldPoll);
  }

  const newPoll = setInterval(loadMessages, 3000);
  setMessagePoll(newPoll);
}

export async function loadMessages() {
  const currentUser = getCurrentUser();
  const selectedContact = getSelectedContact();

  if (!currentUser || !selectedContact || !messagesBox) {
    return;
  }

  try {
    const messages = await api(`/messages/${currentUser.userID}/${selectedContact.userID}`);

    if (messages.length === 0) {
      messagesBox.innerHTML = '<p>No messages yet.</p>';
      return;
    }

    messagesBox.innerHTML = messages
      .map(function (message) {
        let who = selectedContact.first_name;
        let extraClass = '';

        if (Number(message.sender_id) === Number(currentUser.userID)) {
          who = 'You';
          extraClass = 'mine';
        }

        return `<div class="message ${extraClass}"><strong>${who}:</strong> ${escapeHtml(message.message_text)}</div>`;
      })
      .join('');

    messagesBox.scrollTop = messagesBox.scrollHeight;
  } catch (error) {
    messagesBox.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

export async function sendDirectMessage(event) {
  event.preventDefault();

  if (!requireLogin()) {
    return;
  }

  const currentUser = getCurrentUser();
  const selectedContact = getSelectedContact();

  if (!selectedContact) {
    alert('Select someone to message first.');
    return;
  }

  const input = document.getElementById('messageInput');
  const messageText = input.value.trim();

  if (!messageText) {
    return;
  }

  try {
    await api('/messages', {
      method: 'POST',
      body: JSON.stringify({
        sender_id: currentUser.userID,
        receiver_id: selectedContact.userID,
        message_text: messageText
      })
    });

    input.value = '';

    await loadMessages();
  } catch (error) {
    alert(error.message);
  }
}
