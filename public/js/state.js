
export const API = '/api';

let currentUser = null;
let selectedContact = null;
let selectedChat = null;
let convoyList = [];
let messagePoll = null;

try {
  const savedUser = localStorage.getItem('convoyUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
  }
} catch (error) {
  currentUser = null;
}

export function getCurrentUser() {
  return currentUser;
}

export function setCurrentUser(user) {
  currentUser = user;

  if (user) {
    localStorage.setItem('convoyUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('convoyUser');
  }
}

export function getSelectedContact() {
  return selectedContact;
}

export function setSelectedContact(contact) {
  selectedContact = contact;
}

export function getSelectedChat() {
  return selectedChat;
}

export function setSelectedChat(chat) {
  selectedChat = chat;
}

export function getConvoyList() {
  return convoyList;
}

export function setConvoyList(list) {
  convoyList = list;
}

export function getMessagePoll() {
  return messagePoll;
}

export function setMessagePoll(poll) {
  messagePoll = poll;
}
