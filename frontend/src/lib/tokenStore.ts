const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

let accessToken: string | null = localStorage.getItem(ACCESS_KEY);
let refreshToken: string | null = localStorage.getItem(REFRESH_KEY);
let onUnauthorized: (() => void) | null = null;

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function setAccessToken(access: string) {
  accessToken = access;
  localStorage.setItem(ACCESS_KEY, access);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

export function notifyUnauthorized() {
  onUnauthorized?.();
}
