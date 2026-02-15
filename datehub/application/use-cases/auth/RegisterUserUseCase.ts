import { v4 as uuidv4 } from "uuid";
import { IUserRepository } from "@/domain/repositories";
import { IAuthService } from "@/application/ports";
import { User } from "@/domain/entities";
import { Email } from "@/domain/value-objects";
import { UserAlreadyExistsError, ValidationError } from "@/domain/errors";
import { RegisterUserDto, RegisterResultDto } from "@/application/dtos";

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authService: IAuthService
  ) {}

  async execute(dto: RegisterUserDto): Promise<RegisterResultDto> {
    const email = Email.create(dto.email);

    if (!dto.password || dto.password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters");
    }
    if (!dto.username || dto.username.length < 3) {
      throw new ValidationError("Username must be at least 3 characters");
    }

    const existingByEmail = await this.userRepository.findByEmail(email.toString());
    if (existingByEmail) {
      throw new UserAlreadyExistsError(dto.email);
    }

    const existingByUsername = await this.userRepository.findByUsername(dto.username);
    if (existingByUsername) {
      throw new UserAlreadyExistsError(dto.username);
    }

    const passwordHash = await this.authService.hashPassword(dto.password);

    const user = User.create({
      id: uuidv4(),
      username: dto.username,
      email,
      passwordHash,
      avatarUrl: null,
      createdAt: new Date(),
    });

    await this.userRepository.create(user);

    return { message: "Registration successful" };
  }
}
