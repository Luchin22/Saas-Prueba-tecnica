import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ILicensesRepository, LICENSES_REPOSITORY } from '../domain/licenses.repository.interface';
import { LicenseEntity } from '../domain/license.entity';
import { IUsersRepository, USERS_REPOSITORY } from '../../users/domain/users.repository.interface';
import {
  COMPANIES_REPOSITORY,
  ICompaniesRepository,
} from '../../companies/domain/companies.repository.interface';

@Injectable()
export class AssignLicenseUseCase {
  constructor(
    @Inject(LICENSES_REPOSITORY) private readonly licensesRepository: ILicensesRepository,
    @Inject(USERS_REPOSITORY) private readonly usersRepository: IUsersRepository,
    @Inject(COMPANIES_REPOSITORY) private readonly companiesRepository: ICompaniesRepository,
  ) {}

  async execute(adminCompanyId: string, targetUserId: string): Promise<LicenseEntity> {
    const targetUser = await this.usersRepository.findById(targetUserId);
    if (!targetUser || targetUser.companyId !== adminCompanyId) {
      throw new NotFoundException('User not found in your company');
    }

    const company = await this.companiesRepository.findById(adminCompanyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const result = await this.licensesRepository.assignWithinLimit(
      targetUserId,
      adminCompanyId,
      company.licenseLimit,
    );

    switch (result.outcome) {
      case 'already_active':
        throw new ConflictException('User already has an active license');
      case 'limit_exceeded':
        throw new UnprocessableEntityException(
          `Company has reached its contracted license limit (${company.licenseLimit})`,
        );
      case 'assigned':
        return result.license;
    }
  }
}
