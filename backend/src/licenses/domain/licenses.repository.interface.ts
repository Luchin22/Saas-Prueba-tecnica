import { AssignLicenseResult, LicenseEntity } from './license.entity';

export const LICENSES_REPOSITORY = Symbol('LICENSES_REPOSITORY');

export interface ILicensesRepository {
  findManyActiveByCompany(companyId: string): Promise<LicenseEntity[]>;
  assignWithinLimit(
    userId: string,
    companyId: string,
    licenseLimit: number,
  ): Promise<AssignLicenseResult>;
}
