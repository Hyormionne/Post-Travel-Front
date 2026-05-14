// 알림 누적 store. WebSocket 이벤트가 도착할 때마다 카드로 변환해서 push.
// Phase 5 A 토스트와 5 C 알림 센터에서 공통 사용.
import { readSession, useSession, writeSession } from '../lib/session';

export interface Notification {
  id: string;
  kind: 'blog:published' | 'photo:processing_progress' | 'member:added_photos';
  title: string;
  meta: string;
  highlight?: boolean;
  progress?: number;
  actor?: string;
  blogId?: string;
  roomId?: string;
  jobId?: string;
  receivedAt: string;
  read: boolean;
}

const KEY = 'yh.notifications';

export function getNotifications(): Notification[] {
  return readSession<Notification[]>(KEY, []);
}

export function pushNotification(n: Omit<Notification, 'receivedAt' | 'read'>): void {
  const cur = getNotifications();
  writeSession<Notification[]>(KEY, [{ ...n, receivedAt: new Date().toISOString(), read: false }, ...cur]);
}

export function markAllRead(): void {
  const cur = getNotifications();
  writeSession<Notification[]>(KEY, cur.map((n) => ({ ...n, read: true })));
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
  const [list] = useSession<Notification[]>(KEY, []);
  return {
    list,
    unread: list.filter((n) => !n.read).length,
    markAllRead,
    markRead,
    push: pushNotification,
  };
}
