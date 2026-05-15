import { setTokens, setUser, setHasProfile, getRefreshToken, getAccessToken, type AuthUser } from '../../store/auth';
import { API_BASE } from '../../lib/mockMode';

const BASE_URL = API_BASE;

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface ProfileResponse {
  user: AuthUser;
}

// JWT payload에서 사용자 기본 정보(id, email) 추출.
function parseJwtPayload(token: string): { sub: string; email: string } | null {
  try {
    const payload = token.split('.')[1];
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = JSON.parse(atob(padded));
    return { sub: decoded.sub ?? '', email: decoded.email ?? '' };
  } catch {
    return null;
  }
}

async function safeJson<T>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    throw new Error(`서버 응답 오류 (${res.status}). API 주소를 확인해주세요.`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await safeJson<{ message?: string }>(res).catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `오류가 발생했어요 (${res.status})`);
  }
  return safeJson<T>(res);
}

async function patch<T>(path: string, body: unknown, accessToken: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await safeJson<{ message?: string }>(res).catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `오류가 발생했어요 (${res.status})`);
  }
  return safeJson<T>(res);
}

// 이메일 로그인. 백엔드: POST /auth/login → { accessToken, refreshToken }
export async function loginWithEmail(
  email: string,
  password: string,
): Promise<{ hasProfile: boolean }> {
  const data = await post<TokenResponse>('/auth/login', { email, password });
  setTokens(data.accessToken, data.refreshToken);
  const parsed = parseJwtPayload(data.accessToken);
  setUser({
    id: parsed?.sub ?? '',
    email: parsed?.email ?? email,
    nickname: '',
    profileEmoji: '✈',
  });
  // 로그인이면 이미 가입한 사용자 — hasProfile true로 처리
  setHasProfile(true);
  return { hasProfile: true };
}

// 이메일 회원가입. 백엔드: POST /auth/signup → { accessToken, refreshToken }
export async function registerWithEmail(
  email: string,
  password: string,
  nickname: string,
): Promise<{ hasProfile: boolean }> {
  const data = await post<TokenResponse>('/auth/signup', { email, password, nickname });
  setTokens(data.accessToken, data.refreshToken);
  const parsed = parseJwtPayload(data.accessToken);
  setUser({
    id: parsed?.sub ?? '',
    email: parsed?.email ?? email,
    nickname,
    profileEmoji: '✈',
  });
  // 신규 가입 — 프로필 설정 페이지로 이동
  setHasProfile(false);
  return { hasProfile: false };
}

// 구글 idToken으로 백엔드 로그인. 백엔드: POST /auth/google/token → { accessToken, refreshToken }
export async function loginWithGoogle(idToken: string): Promise<{ hasProfile: boolean }> {
  const data = await post<TokenResponse>('/auth/google/token', { idToken });
  setTokens(data.accessToken, data.refreshToken);
  const parsed = parseJwtPayload(data.accessToken);
  setUser({
    id: parsed?.sub ?? '',
    email: parsed?.email ?? '',
    nickname: '',
    profileEmoji: '✈',
  });
  setHasProfile(false);
  return { hasProfile: false };
}

// 개발용 목 로그인.
export function mockLogin() {
  setTokens('mock_access_token', 'mock_refresh_token');
  setHasProfile(false);
}

// 프로필 최초 생성 — 백엔드 /users/me가 없으면 로컬 저장만.
export async function createProfile(
  nickname: string,
  profileEmoji: string,
  accessToken: string,
): Promise<void> {
  try {
    const data = await patch<ProfileResponse>('/users/me', { nickname, profileEmoji }, accessToken);
    setUser(data.user);
  } catch {
    // 백엔드 미지원 시 JWT에서 기본 정보만 추출해 로컬 저장
    const parsed = parseJwtPayload(accessToken);
    setUser({
      id: parsed?.sub ?? '',
      email: parsed?.email ?? '',
      nickname,
      profileEmoji,
    });
  }
  setHasProfile(true);
}

// 목 프로필 생성 — 개발용.
export function mockCreateProfile(nickname: string, profileEmoji: string) {
  setUser({ id: 'mock_user', email: 'dev@mock.com', nickname, profileEmoji });
  setHasProfile(true);
}

// 프로필 수정.
export async function updateProfile(
  nickname: string,
  profileEmoji: string,
  accessToken: string,
): Promise<void> {
  try {
    const data = await patch<ProfileResponse>('/users/me', { nickname, profileEmoji }, accessToken);
    setUser(data.user);
  } catch {
    const parsed = parseJwtPayload(accessToken);
    setUser({
      id: parsed?.sub ?? '',
      email: parsed?.email ?? '',
      nickname,
      profileEmoji,
    });
  }
}

// 목 프로필 수정 — 개발용.
export function mockUpdateProfile(nickname: string, profileEmoji: string) {
  const prev = (typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('yh_user') ?? 'null')
    : null) as AuthUser | null;
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
    const err = await safeJson<{ message?: string }>(res).catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `오류가 발생했어요 (${res.status})`);
  }
}

// 로그아웃. /auth/logout은 refresh token을 헤더에 실음.
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
    }).catch(() => {});
  }
}
