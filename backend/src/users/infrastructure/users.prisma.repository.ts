import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../common/enums/role.enum';
import { IUsersRepository, UserWithLicenseStatus } from '../domain/users.repository.interface';
import { CreateUserData, UserEntity } from '../domain/user.entity';

@Injectable()
export class UsersPrismaRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this.toEntity(user) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toEntity(user) : null;
  }

  async findManyByCompany(companyId: string): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((user) => this.toEntity(user));
  }

  async findManyByCompanyWithLicenseStatus(companyId: string): Promise<UserWithLicenseStatus[]> {
    const users = await this.prisma.user.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
      include: { license: true },
    });

    return users.map((user) => ({
      ...this.toEntity(user),
      hasActiveLicense: user.license?.status === 'ACTIVE',
    }));
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const user = await this.prisma.user.create({ data });
    return this.toEntity(user);
  }

  private toEntity(user: {
    id: string;
    email: string;
    passwordHash: string;
    role: string;
    companyId: string;
    createdAt: Date;
  }): UserEntity {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role as Role,
      companyId: user.companyId,
      createdAt: user.createdAt,
    };
  }
}
