import { api } from './api.js';
import { getCurrentUser } from './state.js';

const chatList = document.getElementById('chatList');
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

let selectedConvoyID = null;

// ================= LOAD CONVOYS =================
export async function loadConvoyChats() {
  const user = getCurrentUser();
  if (!user) return;

  chatList.innerHTML = '';

  try {
    const convoys = await api('/convoys/my');

    convoys.forEach(c => {
      const div = document.createElement('div');
      div.className = 'chat-item';
      div.textContent = `Convoy: ${c.convoyID}`;

      div.onclick = () => {
        selectedConvoyID = c.convoyID;
        loadMessages();
      };

      chatList.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    chatList.innerHTML = 'Failed to load convoys.';
  }
}

// ================= LOAD MESSAGES =================
async function loadMessages() {
  if (!selectedConvoyID) return;

  chatBox.innerHTML = 'Loading...';

  try {
    const messages = await api(`/groups/convoy/${selectedConvoyID}`);

    chatBox.innerHTML = '';

    messages.forEach(m => {
      const div = document.createElement('div');
      div.className = 'message';

      div.innerHTML = `
        <strong>${m.userName}</strong>: ${m.message_text}
      `;

      chatBox.appendChild(div);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  } catch (err) {
    console.error(err);
    chatBox.innerHTML = 'Could not load convoy messages.';
  }
}

// ================= SEND MESSAGE =================
sendBtn.onclick = async () => {
  const user = getCurrentUser();
  const text = chatInput.value.trim();

  if (!text || !selectedConvoyID) return;

  try {
    await api('/groups/convoy/send', {
      method: 'POST',
      body: JSON.stringify({
        convoyID: selectedConvoyID,
        sender_id: user.userID,
        message_text: text
      })
    });

    chatInput.value = '';
    loadMessages();
  } catch (err) {
    console.error(err);
    alert('Could not send convoy message.');
  }
};