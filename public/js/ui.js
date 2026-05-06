
import { getCurrentUser } from './state.js';

import {
  loginResult,
  currentUserEl,
  activeConvoySelect,
  contactsList,
  membersList,
  gpsList,
  friendsList,
  requestsList,
  messagesBox,
  chatTitle,
  chatPanel
} from './doc.js';

export function setText(element, text, isError = false) {
  if (!element) return;
  element.textContent = text;

  if (isError) {
    element.classList.add('error');
  } else {
    element.classList.remove('error');
  }
}

export function requireLogin() {
  const user = getCurrentUser();

  if (!user) {
    setText(loginResult, 'Please log in first.', true);
    return false;
  }

  return true;
}

export function getActiveConvoyID() {
  if (!activeConvoySelect) return null;
  const value = activeConvoySelect.value;
  if (!value) return null;
  return Number(value);
}

export function renderCurrentUser() {
  if (!currentUserEl) return;
  const user = getCurrentUser();

  if (user) {
    currentUserEl.textContent = `Logged in as ${user.first_name} ${user.last_name} (@${user.userName})`;
  } else {
    currentUserEl.textContent = 'Not logged in.';
  }
}

export function clearUiOnLogout() {
  if (activeConvoySelect) activeConvoySelect.innerHTML = '';
  if (contactsList) contactsList.innerHTML = '';
  if (membersList) membersList.innerHTML = '';
  if (gpsList) gpsList.innerHTML = '';
  if (friendsList) friendsList.innerHTML = '';
  if (requestsList) requestsList.innerHTML = '';
  if (messagesBox) messagesBox.innerHTML = '';
  hideChatPanel();
}

export function showChatPanel(title = 'Select someone to chat') {
  if (chatPanel) chatPanel.style.display = 'block';
  if (chatTitle) chatTitle.textContent = title;
  if (messagesBox) messagesBox.innerHTML = '';
}

export function hideChatPanel() {
  if (chatPanel) chatPanel.style.display = 'none';
  if (chatTitle) chatTitle.textContent = '';
  if (messagesBox) messagesBox.innerHTML = '';
}
