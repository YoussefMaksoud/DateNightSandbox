import { AvatarConfigProps } from "@/domain/value-objects/AvatarConfig";

export interface AvatarRecord {
  id: string;
  userId: string;
  config: AvatarConfigProps;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAvatarRepository {
  findByUserId(userId: string): Promise<AvatarRecord | null>;
  save(userId: string, config: AvatarConfigProps): Promise<AvatarRecord>;
}
