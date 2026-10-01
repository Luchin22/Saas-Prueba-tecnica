import { ConflictException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import {
  IUsersRepository,
  USERS_REPOSITORY,
  UserWithLicenseStatus,
} from '../domain/users.repository.interface';
import { UserEntity } from '../domain/user.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: IUsersRepository) {}

  async listByCompany(companyId: string): Promise<UserWithLicenseStatus[]> {
    return this.usersRepository.findManyByCompanyWithLicenseStatus(companyId);
  }

  async createEmployee(companyId: string, email: string, password: string): Promise<UserEntity> {
    const existing = await this.usersRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    return this.usersRepository.create({
      email,
      passwordHash,
      role: Role.USER,
      companyId,
    });
  }
}
