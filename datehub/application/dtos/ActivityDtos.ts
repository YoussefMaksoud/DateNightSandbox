export interface ActivityDto {
  id: string;
  title: string;
  description: string | null;
  type: string;
}

export interface StartActivityDto {
  activityId: string;
  userId: string;
}

export interface StartActivityResultDto {
  sessionId: string;
}
