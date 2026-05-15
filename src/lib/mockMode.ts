// 백엔드 연결 전이거나 서버가 죽었을 때도 mock으로 동작.
// USE_MOCKS=true → 항상 mock 사용 (개발 기본).
// USE_MOCKS=false → 실 API 사용 (실패 시 에러 전파).
// NEXT_PUBLIC_API_BASE가 localhost가 아닌 실서버로 설정된 경우 자동으로 real 모드.
export const API_BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) ||
  'http://localhost:3000';

export const REAL_TIMEOUT_MS = 30000; // S3 업로드 포함 충분한 타임아웃

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function getStoredToken(key: 'yh_access' | 'yh_refresh'): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

// 토큰 갱신 — POST /auth/refresh (refresh token을 헤더에 실음)
// rotation 방식: 한 번 쓰면 블랙리스트, 응답으로 새 쌍 받음
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  // 동시에 여러 요청이 401 나도 refresh는 한 번만
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = getStoredToken('yh_refresh');
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${refreshToken}` },
      });
      if (!res.ok) return false;
      const data = await res.json() as { accessToken: string; refreshToken: string };
      localStorage.setItem('yh_access', data.accessToken);
      localStorage.setItem('yh_refresh', data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

// 실 API 호출 — Authorization 헤더 자동 주입, 401 시 토큰 갱신 후 재시도
export async function realFetch(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const { timeoutMs = REAL_TIMEOUT_MS, ...rest } = init;

  const doFetch = (token: string | null) => {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    const headers: Record<string, string> = { ...(rest.headers as Record<string, string>) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...rest, headers, signal: ctrl.signal }).finally(() => clearTimeout(id));
  };

  const res = await doFetch(getStoredToken('yh_access'));

  // 401: 토큰 만료 → refresh 시도 후 재요청
  if (res.status === 401) {
    const ok = await tryRefresh();
    if (ok) {
      return doFetch(getStoredToken('yh_access'));
    }
    // refresh도 실패 → 로그아웃 처리
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
  try {
    return await real();
  } catch (err) {
    if (typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('[api] real API failed → mock fallback:', err);
    }
    return mock();
  }
}
