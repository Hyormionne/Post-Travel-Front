// sessionStorage 기반 타입 안전 스토어 + 구독.
// React 외부 스토어(useSyncExternalStore)와 호환시키려면 getSnapshot이
// 동일한 상태에 대해 동일한 참조를 반환해야 한다(아니면 무한 렌더 루프).
// → raw 문자열을 키로 parsed 값을 캐시.
import { useSyncExternalStore } from 'react';

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

interface CacheEntry {
  raw: string | null;
  parsed: unknown;
}
const snapshotCache = new Map<string, CacheEntry>();

function notify(key: string) {
  const s = listeners.get(key);
  if (s) s.forEach((fn) => fn());
}

// raw가 그대로면 같은 parsed 참조를 돌려준다.
// fallback도 키-안정적으로 한 번만 반환되도록 캐시에 저장.
function getCachedSnapshot<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.sessionStorage.getItem(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.parsed as T;
  let parsed: T;
  if (raw == null) {
    parsed = fallback;
  } else {
    try {
      parsed = JSON.parse(raw) as T;
    } catch {
      parsed = fallback;
    }
  }
  snapshotCache.set(key, { raw, parsed });
  return parsed;
}

export function readSession<T>(key: string, fallback: T): T {
  return getCachedSnapshot(key, fallback);
}

export function writeSession<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(value);
    window.sessionStorage.setItem(key, raw);
    // 새 값을 캐시에 미리 넣어 다음 React 읽기에서 같은 참조를 돌려준다.
    snapshotCache.set(key, { raw, parsed: value });
    notify(key);
  } catch {
    // quota / disabled — 무시
  }
}

export function clearSession(key: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(key);
  snapshotCache.delete(key);
  notify(key);
}

export function useSession<T>(key: string, fallback: T): [T, (next: T) => void] {
  const value = useSyncExternalStore(
    (cb) => {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(cb);
      return () => {
        set!.delete(cb);
      };
    },
    () => getCachedSnapshot<T>(key, fallback),
    () => fallback,
  );
  const setter = (next: T) => writeSession(key, next);
  return [value, setter];
}
