// src/utils/storage.js

export function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getItem(key) {
  const v = localStorage.getItem(key);
  return v ? JSON.parse(v) : null;
}

export function removeItem(key) {
  localStorage.removeItem(key);
}
