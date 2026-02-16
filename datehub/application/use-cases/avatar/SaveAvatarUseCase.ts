import { IAvatarRepository } from "@/domain/repositories";
import { AvatarDto } from "@/application/dtos";
import { AvatarConfig } from "@/domain/value-objects";

export class SaveAvatarUseCase {
  constructor(private readonly avatarRepository: IAvatarRepository) {}

  async execute(userId: string, config: Partial<AvatarDto>): Promise<AvatarDto> {
    // Merge with existing or defaults
    const existing = await this.avatarRepository.findByUserId(userId);
    const merged = { ...(existing?.config ?? {}), ...config };
    const validated = AvatarConfig.create(merged);
    const saved = await this.avatarRepository.save(userId, validated.toJSON());
    return saved.config;
  }
}
