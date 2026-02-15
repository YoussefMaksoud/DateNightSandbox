export class Password {
  private readonly value: string;

  private constructor(password: string) {
    this.value = password;
  }

  static create(password: string): Password {
    if (!password || password.length < 6) {
      throw new WeakPasswordError();
    }
    return new Password(password);
  }

  toString(): string {
    return this.value;
  }
}

class WeakPasswordError extends Error {
  constructor() {
    super("Password must be at least 6 characters");
    this.name = "WeakPasswordError";
  }
}
