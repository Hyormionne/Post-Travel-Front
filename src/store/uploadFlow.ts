// 업로드 흐름(/upload → /metadata → /clusters)의 임시 state.
// sessionStorage에 보관해 새로고침에도 살아남음. 완료 시 reset.
import { readSession, useSession, writeSession, clearSession } from '../lib/session';
import type { MarkerBgColor, MarkerShape } from '../types/room';

export interface MarkerCustom {
  emoji: string;
  bgColor: MarkerBgColor;
  shape: MarkerShape;
}

export interface UploadFlowState {
  // 선택된 사진들의 임시 ID (presigned 발급 전엔 로컬 인덱스)
  selectedLocalIds: string[];
  tripName: string;
  marker: MarkerCustom;
  invitedNames: string[];
  coverPhotoId: string | null;
  // 업로드 시작 후 받은 룸 ID (presigned + complete 호출용)
  roomId: string | null;
  inviteToken: string | null;
  jobId: string | null;
}

const KEY = 'yh.uploadFlow';

const DEFAULT_MARKER: MarkerCustom = {
  emoji: '✨',
  bgColor: '#d8c9a5',
  shape: 'classic',
};

const DEFAULT_STATE: UploadFlowState = {
  selectedLocalIds: [],
  tripName: '',
  marker: DEFAULT_MARKER,
  invitedNames: ['나'],
  coverPhotoId: null,
  roomId: null,
  inviteToken: null,
  jobId: null,
};

export function getUploadFlow(): UploadFlowState {
  return readSession<UploadFlowState>(KEY, DEFAULT_STATE);
}

export function setUploadFlow(patch: Partial<UploadFlowState>): void {
  const cur = getUploadFlow();
  writeSession<UploadFlowState>(KEY, { ...cur, ...patch });
}

export function resetUploadFlow(): void {
  clearSession(KEY);
}

export function useUploadFlow(): [UploadFlowState, (patch: Partial<UploadFlowState>) => void] {
  const [state] = useSession<UploadFlowState>(KEY, DEFAULT_STATE);
  return [state, setUploadFlow];
}
