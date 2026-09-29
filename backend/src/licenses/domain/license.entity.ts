export type LicenseStatus = 'ACTIVE' | 'REVOKED';

export type LicenseEntity = {
  id: string;
  userId: string;
  companyId: string;
  status: LicenseStatus;
  assignedAt: Date;
  revokedAt: Date | null;
};

export type AssignLicenseResult =
  | { outcome: 'assigned'; license: LicenseEntity }
  | { outcome: 'already_active' }
  | { outcome: 'limit_exceeded' };
