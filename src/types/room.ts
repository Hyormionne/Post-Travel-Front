export type RoomRole = 'OWNER' | 'MEMBER';

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
}
