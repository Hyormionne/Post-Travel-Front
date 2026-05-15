// 사용자가 참여한 방 ID 목록을 localStorage에 보관.
// 백엔드에 GET /rooms (목록) API가 없으므로, 방 생성/참가 시 여기에 등록하고
// 메인 맵/타임라인 진입 시 개별 GET /rooms/:roomId로 조회한다.

const KEY = 'yh.roomIds';

function read(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(ids));
}

export function getRoomIds(): string[] {
  return read();
}

export function addRoomId(roomId: string): void {
  const ids = read();
  if (!ids.includes(roomId)) {
    write([roomId, ...ids]);
  }
}

export function removeRoomId(roomId: string): void {
  write(read().filter((id) => id !== roomId));
}
