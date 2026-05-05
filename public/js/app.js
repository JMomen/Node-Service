import { registerUser, loginUser, logout } from './auth.js';

import { createConvoy, joinConvoy, loadMembers, loadConvoys, makeHost, kickMember } from './convoys.js';

import { sendFriendRequest, loadFriends, loadRequests, loadContacts } from './friends.js';

import { sendDirectMessage } from './messages.js';

import { sendMessage as sendGroupMessage, loadGroupChats, createGroup, leaveGroupChat, getSelectedGroupChat } from './groupchats.js';

import { shareLocation, loadGps } from './gps.js';

import { renderCurrentUser, hideChatPanel, requireLogin } from './ui.js';

import { getCurrentUser } from './state.js';

import { startNotificationSystem } from './notifications.js';


// ================= ELEMENTS =================
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const createConvoyForm = document.getElementById('createConvoyForm');
const joinConvoyForm = document.getElementById('joinConvoyForm');
const friendRequestForm = document.getElementById('friendRequestForm');
const messageForm = document.getElementById('messageForm');
const createGroupForm = document.getElementById('createGroupForm');

const logoutBtn = document.getElementById('logoutBtn');
const loadMembersBtn = document.getElementById('loadMembersBtn');
const loadGpsBtn = document.getElementById('loadGpsBtn');
const showFriendsBtn = document.getElementById('showFriendsBtn');
const showRequestsBtn = document.getElementById('showRequestsBtn');
const shareLocationBtn = document.getElementById('shareLocationBtn');
const showDirectBtn = document.getElementById('showDirectBtn');
const showGroupsBtn = document.getElementById('showGroupsBtn');
const leaveGroupBtn = document.getElementById('leaveGroupBtn');

const contactsList = document.getElementById('contactsList');
const groupCreateBox = document.getElementById('groupCreateBox');
const activeConvoySelect = document.getElementById('activeConvoySelect');


// ================= EVENTS =================
if (registerForm) registerForm.addEventListener('submit', registerUser);
if (loginForm) loginForm.addEventListener('submit', loginUser);

if (createConvoyForm) createConvoyForm.addEventListener('submit', createConvoy);
if (joinConvoyForm) joinConvoyForm.addEventListener('submit', joinConvoy);

if (friendRequestForm) friendRequestForm.addEventListener('submit', sendFriendRequest);

if (messageForm) {
  messageForm.addEventListener('submit', function (event) {
    if (getSelectedGroupChat()) {
      sendGroupMessage(event);
    } else {
      sendDirectMessage(event);
    }
  });
}

if (createGroupForm) createGroupForm.addEventListener('submit', createGroup);

const dashboardUserInfo = document.getElementById('dashboardUserInfo');

if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (loadMembersBtn) loadMembersBtn.addEventListener('click', loadMembers);
if (loadGpsBtn) loadGpsBtn.addEventListener('click', loadGps);

if (showFriendsBtn) showFriendsBtn.addEventListener('click', loadFriends);
if (showRequestsBtn) showRequestsBtn.addEventListener('click', loadRequests);

if (shareLocationBtn) shareLocationBtn.addEventListener('click', shareLocation);

if (showDirectBtn) showDirectBtn.addEventListener('click', loadContacts);
if (showGroupsBtn) showGroupsBtn.addEventListener('click', loadGroupChats);
if (leaveGroupBtn) leaveGroupBtn.addEventListener('click', leaveGroupChat);


// convoy dropdown change
if (activeConvoySelect) {
  activeConvoySelect.addEventListener('change', function () {
    loadMembers();
    loadGps();
  });
}


// ================= UI RESET =================
if (contactsList) contactsList.innerHTML = '';
if (groupCreateBox) groupCreateBox.style.display = 'none';

renderCurrentUser();

if (dashboardUserInfo && getCurrentUser()) {
  const user = getCurrentUser();
  dashboardUserInfo.textContent = `${user.first_name} ${user.last_name} (@${user.userName})`;
}

if (document.getElementById('chatPanel')) {
  hideChatPanel();
}


// ================= AUTH / PAGE LOGIC =================
const currentUser = getCurrentUser();
const pathname = window.location.pathname;

if (pathname !== '/login.html' && pathname !== '/' && !currentUser) {
  window.location.href = '/login.html';
}

if (currentUser) {
  if (
    pathname.endsWith('/dashboard.html') ||
    pathname.endsWith('/convoys.html')
  ) {
    loadConvoys();
  }

  if (pathname.endsWith('/friends.html')) {
    loadFriends();
    loadRequests();
  }

  if (pathname.endsWith('/dashboard.html')) {
    loadFriends();
  }

  if (pathname.endsWith('/messages.html')) {
    loadContacts();
  }
}

startNotificationSystem();