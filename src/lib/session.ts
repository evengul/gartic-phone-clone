"use client";

const KEY_PREFIX = "gartic-session-";
const ACTIVE_KEY = "gartic-active-code";

export function saveSessionToken(gameCode: string, token: string) {
  sessionStorage.setItem(`${KEY_PREFIX}${gameCode}`, token);
  sessionStorage.setItem(ACTIVE_KEY, gameCode);
}

export function getSessionToken(gameCode: string): string | null {
  return sessionStorage.getItem(`${KEY_PREFIX}${gameCode}`);
}

export function getActiveSessionToken(): string | null {
  const code = sessionStorage.getItem(ACTIVE_KEY);
  if (!code) return null;
  return getSessionToken(code);
}

export function gameFetch(
  gameCode: string,
  url: string,
  init?: RequestInit
): Promise<Response> {
  const token = getSessionToken(gameCode);
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("X-Session-Token", token);
  }
  return fetch(url, { ...init, headers });
}
