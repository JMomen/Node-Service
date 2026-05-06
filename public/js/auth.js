
import { api } from './api.js';

import {
  setCurrentUser,
  setSelectedContact,
  setConvoyList,
  getMessagePoll,
  setMessagePoll
} from './state.js';

import { registerForm, registerResult, loginResult } from './doc.js';

import { setText, renderCurrentUser, clearUiOnLogout } from './ui.js';

export async function registerUser(event) {
  event.preventDefault();

  const userName = document.getElementById('regUserName').value.trim();
  const firstName = document.getElementById('regFirstName').value.trim();
  const lastName = document.getElementById('regLastName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  try {
    const data = await api('/register', {
      method: 'POST',
      body: JSON.stringify({
        userName,
        first_name: firstName,
        last_name: lastName,
        email,
        password
      })
    });

    if (registerResult) {
      setText(registerResult, `${data.message} User ID: ${data.userID}`);
    }

    if (registerForm) {
      registerForm.reset();
    }
  } catch (error) {
    if (registerResult) {
      setText(registerResult, error.message, true);
    }
  }
}

export async function loginUser(event) {
  event.preventDefault();

  const userName = document.getElementById('loginUserName').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const data = await api('/login', {
      method: 'POST',
      body: JSON.stringify({ userName, password })
    });

    setCurrentUser(data.user);
    renderCurrentUser();

    if (loginResult) {
      setText(loginResult, data.message);
    }

    window.location.href = '/dashboard.html';
  } catch (error) {
    if (loginResult) {
      setText(loginResult, error.message, true);
    }
  }
}

export function logout() {
  const poll = getMessagePoll();

  setCurrentUser(null);
  setSelectedContact(null);
  setConvoyList([]);

  if (poll) {
    clearInterval(poll);
  }

  setMessagePoll(null);

  renderCurrentUser();
  clearUiOnLogout();

  if (loginResult) {
    setText(loginResult, 'Logged out.');
  }

  window.location.href = '/login.html';
}
