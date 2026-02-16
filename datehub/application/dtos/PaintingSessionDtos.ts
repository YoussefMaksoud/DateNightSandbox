export interface CreatePaintingSessionDto {
  userId: string;
  difficulty: string;
  theme: string;
}

export interface PaintingSessionDto {
  id: string;
  userId: string;
  dateNightId: string | null;
  difficulty: string;
  theme: string;
  referenceUrl: string;
  palette: string[];
  status: string;
  createdAt: string;
}

export interface UpdatePaintingSessionStatusDto {
  userId: string;
  sessionId: string;
  status: string;
}
