import { api } from './api.js';

import { getCurrentUser, setConvoyList } from './state.js';

import {
  convoyResult,
  createConvoyForm,
  joinConvoyForm,
  activeConvoySelect,
  membersList,
  gpsList
} from './doc.js';

import { setText, requireLogin, getActiveConvoyID } from './ui.js';

import { loadGps } from './gps.js';

export async function loadConvoys() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return;
  }

  try {
    const convoys = await api(`/convoys/by-user/${currentUser.userID}`);

    setConvoyList(convoys);

    if (!activeConvoySelect) return;

    activeConvoySelect.innerHTML = '';

    if (convoys.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No convoys yet';
      activeConvoySelect.appendChild(option);

      if (membersList) membersList.innerHTML = '';
      if (gpsList) gpsList.innerHTML = '';
      return;
    }

    convoys.forEach(function (convoy) {
      const option = document.createElement('option');
      option.value = convoy.convoyID;
      option.textContent = `${convoy.name} (${convoy.joinCode})`;
      activeConvoySelect.appendChild(option);
    });

    await loadMembers();
    await loadGps();

  } catch (error) {
    setText(convoyResult, error.message, true);
  }
}

export async function createConvoy(event) {
  event.preventDefault();

  if (!requireLogin()) {
    return;
  }

  const currentUser = getCurrentUser();

  const convoyName = document.getElementById('convoyName').value.trim();
  const joinCode = document.getElementById('createJoinCode').value.trim();

  try {
    const data = await api('/convoys', {
      method: 'POST',
      body: JSON.stringify({
        userID: currentUser.userID,
        name: convoyName,
        joinCode: joinCode
      })
    });

    setText(convoyResult, `${data.message} Convoy ID: ${data.convoyID}`);

    if (createConvoyForm) {
      createConvoyForm.reset();
    }

    await loadConvoys();

  } catch (error) {
    setText(convoyResult, error.message, true);
  }
}

export async function joinConvoy(event) {
  event.preventDefault();

  if (!requireLogin()) {
    return;
  }

  const currentUser = getCurrentUser();

  const joinCode = document.getElementById('joinCode').value.trim();

  try {
    const data = await api('/convoys/join', {
      method: 'POST',
      body: JSON.stringify({
        userID: currentUser.userID,
        joinCode: joinCode
      })
    });

    setText(convoyResult, `${data.message} Convoy ID: ${data.convoyID}`);

    if (joinConvoyForm) {
      joinConvoyForm.reset();
    }

    await loadConvoys();

  } catch (error) {
    setText(convoyResult, error.message, true);
  }
}

export async function makeHost(userID, convoyID) {
  try {
    const currentUser = getCurrentUser();

    const data = await api(`/convoys/${convoyID}/host`, {
      method: 'PUT',
      body: JSON.stringify({
        currentUserID: currentUser.userID,
        newHostID: userID
      })
    });

    setText(convoyResult, data.message);

    await loadMembers();
  } catch (error) {
    setText(convoyResult, error.message, true);
  }
}

export async function kickMember(userID, convoyID) {
  try {
    const currentUser = getCurrentUser();

    const data = await api(`/convoys/${convoyID}/members/${userID}`, {
      method: 'DELETE',
      body: JSON.stringify({
        currentUserID: currentUser.userID
      })
    });

    setText(convoyResult, data.message);

    await loadMembers();
  } catch (error) {
    setText(convoyResult, error.message, true);
  }
}

export async function loadMembers() {
  const convoyID = getActiveConvoyID();
  const currentUser = getCurrentUser();

  if (!convoyID) {
    if (membersList) membersList.innerHTML = '<p>No active convoy selected.</p>';
    return;
  }

  try {
    const members = await api(`/convoys/${convoyID}/members`);

    if (members.length === 0) {
      if (membersList) membersList.innerHTML = '<p>No members found.</p>';
      return;
    }

    membersList.innerHTML = '';

    const hostMember = members.find(function (member) {
      return member.role === 'host';
    });

    members.forEach(function (member) {
      const div = document.createElement('div');
      div.className = 'member-row';
      div.textContent = `${member.userName} - ${member.role}`;

      if (
        hostMember &&
        currentUser &&
        Number(currentUser.userID) === Number(hostMember.userID) &&
        member.role !== 'host'
      ) {
        const hostBtn = document.createElement('button');
        hostBtn.textContent = 'Make Host';
        hostBtn.onclick = function () {
          makeHost(member.userID, convoyID);
        };
        div.appendChild(hostBtn);

        const kickBtn = document.createElement('button');
        kickBtn.textContent = 'Kick';
        kickBtn.onclick = function () {
          kickMember(member.userID, convoyID);
        };
        div.appendChild(kickBtn);
      }

      membersList.appendChild(div);
    });

  } catch (error) {
    if (membersList) membersList.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

  export async function leaveConvoy() {
  const currentUser = getCurrentUser();
  const convoyID = getActiveConvoyID();

  if (!currentUser || !convoyID) {
    setText(convoyResult, 'Select a convoy first.', true);
    return;
  }

  try {
    const data = await api(`/convoys/${convoyID}/leave`, {
      method: 'DELETE',
      body: JSON.stringify({
        userID: currentUser.userID
      })
    });

    setText(convoyResult, data.message);
    await loadConvoys();
  } catch (error) {
    setText(convoyResult, error.message, true);
  }
}

export async function deleteConvoy() {
  const currentUser = getCurrentUser();
  const convoyID = getActiveConvoyID();

  if (!currentUser || !convoyID) {
    setText(convoyResult, 'Select a convoy first.', true);
    return;
  }

  const confirmed = confirm(
    'Are you sure you want to delete this convoy? This will remove all members and GPS data.'
  );

  if (!confirmed) {
    return;
  }

  try {
    const data = await api(`/convoys/${convoyID}`, {
      method: 'DELETE',
      body: JSON.stringify({
        currentUserID: currentUser.userID
      })
    });

    setText(convoyResult, data.message);

    if (membersList) membersList.innerHTML = '';
    if (gpsList) gpsList.innerHTML = '';

    await loadConvoys();
  } catch (error) {
    setText(convoyResult, error.message, true);
  }
}