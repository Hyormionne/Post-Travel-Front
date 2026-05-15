// Socket.IO 싱글톤 클라이언트
// - Namespace: /realtime (API.md §8)
// - 인증: auth.token = 'Bearer <accessToken>'
// - 백엔드 미연결 시 자동 fallback (연결 오류 → 조용히 실패, fake progress가 대신 동작)
import { API_BASE } from './mockMode';
import { getAccessToken } from '../store/auth';

let _socket: import('socket.io-client').Socket | null = null;
let _connecting = false;

export async function getSocket(): Promise<import('socket.io-client').Socket | null> {
  if (typeof window === 'undefined') return null;

  if (_socket?.connected) return _socket;

  // 이미 연결 중이면 연결 완료를 기다림
  if (_connecting && _socket) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 3000);
      _socket!.once('connect', () => {
        clearTimeout(timeout);
        resolve(_socket);
      });
      _socket!.once('connect_error', () => {
        clearTimeout(timeout);
        resolve(null);
      });
    });
  }

  const token = getAccessToken();
  if (!token) return null;

  try {
    const { io } = await import('socket.io-client');

    // WS base URL: API_BASE의 http(s) 그대로 사용 (socket.io가 ws:// 로 업그레이드)
    const wsUrl = API_BASE;

    _connecting = true;
    _socket = io(`${wsUrl}/realtime`, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 3000,
    });

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        _connecting = false;
        resolve(null); // 타임아웃 → fallback으로
      }, 3000);

      _socket!.once('connect', () => {
        clearTimeout(timeout);
        _connecting = false;
        resolve(_socket);
      });

      _socket!.once('connect_error', (err) => {
        clearTimeout(timeout);
        _connecting = false;
        console.warn('[socket] connect_error — using fake progress fallback:', err.message);
        resolve(null);
      });
    });
  } catch {
    _connecting = false;
    return null;
  }
}

export function subscribeRoom(socket: import('socket.io-client').Socket, roomId: string) {
  socket.emit('room:subscribe', { roomId });
}

export function disconnectSocket() {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}
