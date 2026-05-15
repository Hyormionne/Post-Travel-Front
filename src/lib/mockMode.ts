// 백엔드 연결 전이거나 서버가 죽었을 때도 mock으로 동작.
// USE_MOCKS=true → 항상 mock 사용 (개발 기본).
// USE_MOCKS=false → 실 API 사용 (실패 시 에러 전파).
// NEXT_PUBLIC_API_BASE가 localhost가 아닌 실서버로 설정된 경우 자동으로 real 모드.
export const API_BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) ||
  'http://localhost:3000';

const _isLocalhost = API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1');
const _explicitMocks =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_USE_MOCKS : undefined;

export const USE_MOCKS =
  _explicitMocks === 'false'
    ? false
    : _explicitMocks === 'true'
      ? true
      : _isLocalhost; // API_BASE가 실서버면 기본 false, localhost면 기본 true


export const REAL_TIMEOUT_MS = 2500;

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Token auto-refresh ──────────────────────────────
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const refreshToken = localStorage.getItem('yh_refresh');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('yh_access', data.accessToken);
    localStorage.setItem('yh_refresh', data.refreshToken);
    // 쿠키 갱신 (미들웨어 가드용)
    document.cookie = `yh_session=1; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    return true;
  } catch {
    return false;
  }
}

// 동시 401이 여러 개 뜰 때 refresh를 한 번만 호출
function refreshOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = tryRefreshToken().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

// ── 실 API 호출 ─────────────────────────────────────
async function rawFetch(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = typeof window !== 'undefined' ? localStorage.getItem('yh_access') : null;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  init.headers = headers;
  delete (init as Record<string, unknown>).credentials;

  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

// 실 API 호출 — 타임아웃 + JWT 자동 첨부 + 401 시 토큰 갱신 후 재시도
export async function realFetch(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const { timeoutMs = REAL_TIMEOUT_MS, ...rest } = init;

  const res = await rawFetch(url, { ...rest }, timeoutMs);

  // 401이면 refresh 시도 후 1회 재시도
  if (res.status === 401 && !url.includes('/auth/refresh')) {
    const ok = await refreshOnce();
    if (ok) {
      return rawFetch(url, { ...rest }, timeoutMs);
    }
    // refresh 실패 — 로그인 페이지로
    if (typeof window !== 'undefined') {
      localStorage.removeItem('yh_access');
      localStorage.removeItem('yh_refresh');
      localStorage.removeItem('yh_profile');
      localStorage.removeItem('yh_user');
      document.cookie = 'yh_session=; path=/; max-age=0';
      document.cookie = 'yh_profile=; path=/; max-age=0';
      window.location.href = '/login';
    }
  }

  return res;
}

// USE_MOCKS=true면 mock 사용, false면 실 API만 사용 (실패 시 에러 전파).
export async function withMockFallback<T>(real: () => Promise<T>, mock: () => Promise<T>): Promise<T> {
  if (USE_MOCKS) return mock();
  return real();
}
