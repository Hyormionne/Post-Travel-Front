import { setTokens, setUser, setHasProfile, getRefreshToken, type AuthUser } from '../../store/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface GoogleLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser & { hasProfile: boolean };
}

interface ProfileResponse {
  user: AuthUser;
}

async function post<T>(path: string, body: unknown, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function patch<T>(path: string, body: unknown, accessToken: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// 구글 idToken으로 백엔드 로그인. 토큰·유저 정보를 store에 저장.
export async function loginWithGoogle(idToken: string): Promise<{ hasProfile: boolean }> {
  const data = await post<GoogleLoginResponse>('/auth/google/token', { idToken });
  setTokens(data.accessToken, data.refreshToken);
  const { hasProfile, ...userFields } = data.user;
  setUser(userFields);
  setHasProfile(hasProfile);
  return { hasProfile };
}

// 개발용 목 로그인 — 백엔드 없이 흐름 확인.
export function mockLogin() {
  setTokens('mock_access_token', 'mock_refresh_token');
  setHasProfile(false);
}

// 프로필 최초 생성.
export async function createProfile(
  nickname: string,
  profileEmoji: string,
  accessToken: string,
): Promise<void> {
  const data = await patch<ProfileResponse>('/users/me', { nickname, profileEmoji }, accessToken);
  setUser(data.user);
  setHasProfile(true);
}

// 목 프로필 생성 — 개발용.
export function mockCreateProfile(nickname: string, profileEmoji: string) {
  setUser({ id: 'mock_user', email: 'dev@mock.com', nickname, profileEmoji });
  setHasProfile(true);
}

// 프로필 수정 (닉네임·이모지).
export async function updateProfile(
  nickname: string,
  profileEmoji: string,
  accessToken: string,
): Promise<void> {
  const data = await patch<ProfileResponse>('/users/me', { nickname, profileEmoji }, accessToken);
  setUser(data.user);
}

// 목 프로필 수정 — 개발용.
export function mockUpdateProfile(nickname: string, profileEmoji: string) {
  const prev = (typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('yh_user') ?? 'null')
    : null) as import('../../store/auth').AuthUser | null;
  setUser({ id: prev?.id ?? 'mock_user', email: prev?.email ?? 'dev@mock.com', nickname, profileEmoji });
}

// 비밀번호 변경.
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  accessToken: string,
): Promise<void> {
  await patch('/users/me/password', { currentPassword, newPassword }, accessToken);
}

// 계정 삭제.
export async function deleteAccount(accessToken: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/users/me`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
}

// 로그아웃. /auth/logout은 refresh token을 헤더에 실음 (CLAUDE.md 주의사항).
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
    }).catch(() => {});
  }
}
