import { CreateUserData, UserEntity } from './user.entity';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export type UserWithLicenseStatus = UserEntity & { hasActiveLicense: boolean };

export interface IUsersRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  findManyByCompany(companyId: string): Promise<UserEntity[]>;
  findManyByCompanyWithLicenseStatus(companyId: string): Promise<UserWithLicenseStatus[]>;
  create(data: CreateUserData): Promise<UserEntity>;
}
