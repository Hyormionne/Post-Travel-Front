// 알림 누적 store. WebSocket 이벤트가 도착할 때마다 카드로 변환해서 push.
// Phase 5 A 토스트와 5 C 알림 센터에서 공통 사용.
import { readSession, useSession, writeSession } from '../lib/session';
import { MOCK_NOTIFICATIONS, type MockNotification } from '../mocks/data';

export type Notification = MockNotification & {
  receivedAt: string;
  read: boolean;
};

const KEY = 'yh.notifications';

// 모듈 레벨에서 한 번만 생성. 매번 새 배열을 만들면 React 의존성 비교가 깨진다.
const SEED: Notification[] = MOCK_NOTIFICATIONS.map((m, i) => ({
  ...m,
  receivedAt: new Date(Date.now() - i * 60_000).toISOString(),
  read: false,
}));

// null = 세션에 키 자체가 없음(첫 진입) → SEED 표시
// []   = 사용자가 명시적으로 전체 삭제 → 빈 목록 유지
export function getNotifications(): Notification[] {
  const stored = readSession<Notification[] | null>(KEY, null);
  if (stored === null) {
    writeSession<Notification[]>(KEY, SEED);
    return SEED;
  }
  return stored;
}

export function pushNotification(n: Omit<Notification, 'receivedAt' | 'read'>): void {
  const cur = getNotifications();
  writeSession<Notification[]>(KEY, [{ ...n, receivedAt: new Date().toISOString(), read: false }, ...cur]);
}

export function markAllRead(): void {
  writeSession<Notification[]>(KEY, []);
}

export function markRead(id: string): void {
  const cur = getNotifications();
  writeSession<Notification[]>(KEY, cur.map((n) => (n.id === id ? { ...n, read: true } : n)));
}

export function unreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

export function useNotifications(): {
  list: Notification[];
  unread: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  push: (n: Omit<Notification, 'receivedAt' | 'read'>) => void;
} {
  const [stored] = useSession<Notification[] | null>(KEY, null);
  const effective = stored === null ? SEED : stored;
  return {
    list: effective,
    unread: effective.filter((n) => !n.read).length,
    markAllRead,
    markRead,
    push: pushNotification,
  };
}
