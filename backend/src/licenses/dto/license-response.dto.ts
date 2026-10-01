import { LicenseEntity } from '../domain/license.entity';

export class LicenseResponseDto {
  id: string;
  userId: string;
  companyId: string;
  status: string;
  assignedAt: Date;

  static fromEntity(license: LicenseEntity): LicenseResponseDto {
    const dto = new LicenseResponseDto();
    dto.id = license.id;
    dto.userId = license.userId;
    dto.companyId = license.companyId;
    dto.status = license.status;
    dto.assignedAt = license.assignedAt;
    return dto;
  }
}
