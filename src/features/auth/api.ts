import { setTokens, setUser, setHasProfile, getRefreshToken, getAccessToken, getUser, getSavedEmoji, type AuthUser } from '../../store/auth';
import { API_BASE } from '../../lib/mockMode';

<<<<<<< HEAD
const BASE_URL = API_BASE;
=======
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';
>>>>>>> 319d24e6d4d3fee9422126b0d7df0206eec6837a

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// JWT payload — 백엔드가 nickname을 포함할 경우 복원에 활용
function parseJwtPayload(token: string): { sub: string; email: string; nickname?: string } | null {
  try {
    const payload = token.split('.')[1];
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = JSON.parse(atob(padded));
    return {
      sub: decoded.sub ?? '',
      email: decoded.email ?? '',
      nickname: decoded.nickname ?? decoded.name,
    };
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
// nickname: JWT payload에 포함되어 있으면 복원, 없으면 빈 문자열
// profileEmoji: DB에 없는 필드 — 로그아웃 후에도 남기는 별도 키(yh_emoji_pref)에서 복원
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
    nickname: parsed?.nickname ?? '',
    profileEmoji: getSavedEmoji(),
  });
  setHasProfile(true);
  return { hasProfile: true };
}

<<<<<<< HEAD
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
    profileEmoji: getSavedEmoji(),
  });
  setHasProfile(false);
  return { hasProfile: false };
}

// 구글 로그인. 백엔드: POST /auth/google/token → { accessToken, refreshToken }
// upsertByGoogleSub 으로 신규/기존 유저 자동 처리 — 별도 가입 플로우 없음
// nickname은 구글 계정 이름에서 자동 생성, profileEmoji는 별도 키에서 복원
export async function loginWithGoogle(idToken: string): Promise<{ hasProfile: boolean }> {
  const data = await post<TokenResponse>('/auth/google/token', { idToken });
  setTokens(data.accessToken, data.refreshToken);
  const parsed = parseJwtPayload(data.accessToken);
  setUser({
    id: parsed?.sub ?? '',
    email: parsed?.email ?? '',
    nickname: parsed?.nickname ?? '',
    profileEmoji: getSavedEmoji(),
  });
  // 구글 계정엔 항상 이름이 있으므로 hasProfile true로 처리
  setHasProfile(true);
  return { hasProfile: true };
}

// 개발용 목 로그인.
=======
interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// 이메일 로그인. 토큰 저장 + /users/me로 유저 정보 가져옴.
export async function emailLogin(email: string, password: string): Promise<void> {
  const data = await post<AuthTokenResponse>('/auth/login', { email, password });
  setTokens(data.accessToken, data.refreshToken);
  const res = await fetch(`${BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${data.accessToken}` },
  });
  if (res.ok) {
    const user = (await res.json()) as AuthUser;
    setUser(user);
  }
  setHasProfile(true);
}

// 이메일 회원가입. 토큰 저장 + /users/me로 유저 정보 가져옴.
export async function emailSignup(email: string, password: string, nickname: string): Promise<void> {
  const data = await post<AuthTokenResponse>('/auth/signup', { email, password, nickname });
  setTokens(data.accessToken, data.refreshToken);
  const res = await fetch(`${BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${data.accessToken}` },
  });
  if (res.ok) {
    const user = (await res.json()) as AuthUser;
    setUser(user);
  }
  setHasProfile(true);
}

// 개발용 목 로그인 — 백엔드 없이 흐름 확인.
>>>>>>> 319d24e6d4d3fee9422126b0d7df0206eec6837a
export function mockLogin() {
  setTokens('mock_access_token', 'mock_refresh_token');
  setHasProfile(false);
}

// 프로필 최초 생성 — PATCH /users/me 없음, 로컬 저장만.
export async function createProfile(
  nickname: string,
  profileEmoji: string,
  accessToken: string,
): Promise<void> {
  const parsed = parseJwtPayload(accessToken);
  const existing = getUser();
  setUser({
    id: parsed?.sub ?? existing?.id ?? '',
    email: parsed?.email ?? existing?.email ?? '',
    nickname,
    profileEmoji,
  });
  setHasProfile(true);
}

// 목 프로필 생성 — 개발용.
export function mockCreateProfile(nickname: string, profileEmoji: string) {
  setUser({ id: 'mock_user', email: 'dev@mock.com', nickname, profileEmoji });
  setHasProfile(true);
}

// 프로필 수정 — PATCH /users/me 없음, 로컬 저장만.
export async function updateProfile(
  nickname: string,
  profileEmoji: string,
  accessToken: string,
): Promise<void> {
  const parsed = parseJwtPayload(accessToken);
  const existing = getUser();
  setUser({
    id: parsed?.sub ?? existing?.id ?? '',
    email: parsed?.email ?? existing?.email ?? '',
    nickname,
    profileEmoji,
  });
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
