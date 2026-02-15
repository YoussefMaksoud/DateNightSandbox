import { prisma } from "@/lib/db";
import { IUserRepository } from "@/domain/repositories";
import { User } from "@/domain/entities/User";
import { Email } from "@/domain/value-objects/Email";

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const record = await prisma.user.findUnique({ where: { id } });
    if (!record) return null;
    return User.reconstitute({
      id: record.id,
      username: record.username,
      email: Email.create(record.email),
      passwordHash: record.passwordHash,
      avatarUrl: record.avatarUrl,
      createdAt: record.createdAt,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await prisma.user.findUnique({ where: { email } });
    if (!record) return null;
    return User.reconstitute({
      id: record.id,
      username: record.username,
      email: Email.create(record.email),
      passwordHash: record.passwordHash,
      avatarUrl: record.avatarUrl,
      createdAt: record.createdAt,
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    const record = await prisma.user.findUnique({ where: { username } });
    if (!record) return null;
    return User.reconstitute({
      id: record.id,
      username: record.username,
      email: Email.create(record.email),
      passwordHash: record.passwordHash,
      avatarUrl: record.avatarUrl,
      createdAt: record.createdAt,
    });
  }

  async create(user: User): Promise<User> {
    const record = await prisma.user.create({
      data: {
        id: user.id,
        username: user.username,
        email: user.email.toString(),
        passwordHash: user.passwordHash,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
    return User.reconstitute({
      id: record.id,
      username: record.username,
      email: Email.create(record.email),
      passwordHash: record.passwordHash,
      avatarUrl: record.avatarUrl,
      createdAt: record.createdAt,
    });
  }

  async update(user: User): Promise<User> {
    const record = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: user.username,
        email: user.email.toString(),
        passwordHash: user.passwordHash,
        avatarUrl: user.avatarUrl,
      },
    });
    return User.reconstitute({
      id: record.id,
      username: record.username,
      email: Email.create(record.email),
      passwordHash: record.passwordHash,
      avatarUrl: record.avatarUrl,
      createdAt: record.createdAt,
    });
  }
}
