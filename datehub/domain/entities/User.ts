import { Email } from "@/domain/value-objects/Email";

export interface UserProps {
  id: string;
  username: string;
  email: Email;
  passwordHash: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    if (!props.username || props.username.length < 3) {
      throw new Error("Username must be at least 3 characters");
    }
    return new User(props);
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  get id(): string { return this.props.id; }
  get username(): string { return this.props.username; }
  get email(): Email { return this.props.email; }
  get passwordHash(): string { return this.props.passwordHash; }
  get avatarUrl(): string | null { return this.props.avatarUrl; }
  get createdAt(): Date { return this.props.createdAt; }

  updateAvatar(url: string): User {
    return new User({ ...this.props, avatarUrl: url });
  }
}
