export interface RegisterUserDto {
  username: string;
  email: string;
  password: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface AuthResultDto {
  token: string;
}

export interface RegisterResultDto {
  message: string;
}
