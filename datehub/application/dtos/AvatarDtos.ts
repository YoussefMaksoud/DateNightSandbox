export interface AvatarDto {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  outfit: string;
  outfitColor: string;
  accessory: string;
  expression: string;
  background: string;
}

export interface SaveAvatarDto {
  userId: string;
  config: Partial<AvatarDto>;
}

export interface SaveAvatarResultDto {
  avatar: AvatarDto;
}
