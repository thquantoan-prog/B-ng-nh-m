export interface ImageItem {
  id: string;
  url: string;
  rotation: number; // 0, 90, 180, 270
  uploadedAt: number;
}

export interface GroupData {
  id: number; // 1, 2, 3, 4, 5, 6
  name: string;
  images: ImageItem[];
  stars: number; // 0 to 10
  qrKey: string; // token used to check QR validity
}

export interface SessionState {
  sessionId: string;
  groupCount: number;
  groups: GroupData[];
  lastUpdated: number;
}

export interface WSMessage {
  type: 'INIT' | 'STATE_UPDATE' | 'NOTIFICATION' | 'ERROR';
  state?: SessionState;
  message?: string;
  targetGroup?: number;
}
