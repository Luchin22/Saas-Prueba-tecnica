import { Role } from '../../common/enums/role.enum';

export class LoginResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: Role;
    companyId: string;
  };
}
