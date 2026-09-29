import { Role } from '../../common/enums/role.enum';
import { UserEntity } from '../domain/user.entity';

export class UserResponseDto {
  id: string;
  email: string;
  role: Role;
  companyId: string;
  createdAt: Date;
  hasActiveLicense: boolean;

  static fromEntity(user: UserEntity, hasActiveLicense: boolean): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.role = user.role;
    dto.companyId = user.companyId;
    dto.createdAt = user.createdAt;
    dto.hasActiveLicense = hasActiveLicense;
    return dto;
  }
}
