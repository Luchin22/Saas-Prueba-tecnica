import { Role } from '../../common/enums/role.enum';

export type UserEntity = {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  companyId: string;
  createdAt: Date;
};

export type CreateUserData = {
  email: string;
  passwordHash: string;
  role: Role;
  companyId: string;
};
