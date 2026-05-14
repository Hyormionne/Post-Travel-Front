export type RoomRole = 'OWNER' | 'MEMBER';

export type MarkerShape = 'classic' | 'polaroid' | 'sticker' | 'dot' | 'flag' | 'ribbon';

export type MarkerBgColor =
  | '#d8c9a5'
  | '#cfd8c2'
  | '#e2c9bc'
  | '#c9d2db'
  | '#decfd8'
  | '#f0ead2';

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  role: RoomRole;
  joinedAt: string;
}

export interface Room {
  id: string;
  title: string;
  inviteToken: string;
  createdBy: string;
  createdAt: string;
  members: RoomMember[];
  markerEmoji: string;
  markerBgColor: MarkerBgColor;
  markerShape: MarkerShape;
}

export interface CreateRoomRequest {
  title?: string;
  markerEmoji?: string;
  markerBgColor?: MarkerBgColor;
  markerShape?: MarkerShape;
}

export interface UpdateRoomRequest {
  title?: string;
  markerEmoji?: string;
  markerBgColor?: MarkerBgColor;
  markerShape?: MarkerShape;
}

export interface InviteTokenResponse {
  inviteToken: string;
}

export interface TripSummary {
  id: string;
  emoji: string;
  title: string;
  dates: string;
  info: string;
  status: '발행됨' | '초안' | '작성중';
  lat: number;
  lng: number;
  year: string;
  thumbnails: string[];
}
