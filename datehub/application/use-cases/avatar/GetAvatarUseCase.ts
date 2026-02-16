import { IAvatarRepository } from "@/domain/repositories";
import { AvatarDto } from "@/application/dtos";
import { AvatarConfig } from "@/domain/value-objects";

export class GetAvatarUseCase {
  constructor(private readonly avatarRepository: IAvatarRepository) {}

  async execute(userId: string): Promise<AvatarDto> {
    const record = await this.avatarRepository.findByUserId(userId);
    if (record) {
      return record.config;
    }
    // Return defaults
    return AvatarConfig.create({}).toJSON();
  }
}
