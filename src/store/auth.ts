// 인증 상태 관리 — localStorage(토큰) + 쿠키(미들웨어 가드용).
// 쿠키는 서버 미들웨어가 읽는 단순 플래그, 실제 토큰 값은 localStorage에.

const KEY_ACCESS = 'yh_access';
const KEY_REFRESH = 'yh_refresh';
const KEY_PROFILE = 'yh_profile';
const KEY_USER = 'yh_user';

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  profileEmoji: string;
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function setTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_ACCESS, accessToken);
  localStorage.setItem(KEY_REFRESH, refreshToken);
  setCookie('yh_session', '1');
}

export function setUser(user: AuthUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_USER, JSON.stringify(user));
}

export function setHasProfile(value: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_PROFILE, value ? '1' : '0');
  if (value) {
    setCookie('yh_profile', '1');
  } else {
    removeCookie('yh_profile');
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEY_ACCESS);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEY_REFRESH);
}

export function getHasProfile(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEY_PROFILE) === '1';
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
  localStorage.removeItem(KEY_PROFILE);
  localStorage.removeItem(KEY_USER);
  removeCookie('yh_session');
  removeCookie('yh_profile');
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}
