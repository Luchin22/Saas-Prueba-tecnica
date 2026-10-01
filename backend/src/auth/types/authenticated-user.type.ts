import { Role } from '../../common/enums/role.enum';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: Role;
  companyId: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
  companyId: string;
};
