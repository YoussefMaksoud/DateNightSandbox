import { IUserRepository } from "@/domain/repositories";
import { IAuthService } from "@/application/ports";
import { Email } from "@/domain/value-objects";
import { InvalidCredentialsError } from "@/domain/errors";
import { LoginUserDto, AuthResultDto } from "@/application/dtos";

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authService: IAuthService
  ) {}

  async execute(dto: LoginUserDto): Promise<AuthResultDto> {
    const email = Email.create(dto.email);

    const user = await this.userRepository.findByEmail(email.toString());
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValidPassword = await this.authService.comparePassword(
      dto.password,
      user.passwordHash
    );
    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    const token = this.authService.generateToken({
      userId: user.id,
      email: user.email.toString(),
    });

    return { token };
  }
}
