// 백엔드 연결 전이거나 서버가 죽었을 때도 mock으로 동작.
// USE_MOCKS=true → 항상 mock 사용 (개발 기본).
// USE_MOCKS=false → 실 API 우선, 실패/타임아웃 시 mock으로 폴백.
export const USE_MOCKS =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_USE_MOCKS !== 'false'
    : true;

export const API_BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) ||
  'http://localhost:3000';

export const REAL_TIMEOUT_MS = 30000; // S3 업로드 포함 충분한 타임아웃

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function getStoredToken(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('yh_access') : null;
  } catch {
    return null;
  }
}

// 실 API 호출 — Authorization 헤더 자동 주입, AbortController로 타임아웃 부여
export async function realFetch(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const { timeoutMs = REAL_TIMEOUT_MS, ...rest } = init;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  const token = getStoredToken();
  const headers: Record<string, string> = { ...(rest.headers as Record<string, string>) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    return await fetch(url, { ...rest, headers, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

// real 우선 시도, 실패/타임아웃 시 mock 폴백.
// USE_MOCKS=true면 real을 건너뛰고 즉시 mock.
export async function withMockFallback<T>(real: () => Promise<T>, mock: () => Promise<T>): Promise<T> {
  if (USE_MOCKS) return mock();
  try {
    return await real();
  } catch (err) {
    if (typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('[api] real call failed, falling back to mock:', err);
    }
    return mock();
  }
}
