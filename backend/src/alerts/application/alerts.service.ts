import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  COMPANIES_REPOSITORY,
  ICompaniesRepository,
} from '../../companies/domain/companies.repository.interface';
import {
  ILicensesRepository,
  LICENSES_REPOSITORY,
} from '../../licenses/domain/licenses.repository.interface';
import { IUsageRepository, USAGE_REPOSITORY } from '../../usage/domain/usage.repository.interface';
import { IUsersRepository, USERS_REPOSITORY } from '../../users/domain/users.repository.interface';
import { Role } from '../../common/enums/role.enum';
import { MailService } from '../../mail/mail.service';

type ThresholdAction = 'send' | 'reset' | 'none';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @Inject(COMPANIES_REPOSITORY) private readonly companiesRepository: ICompaniesRepository,
    @Inject(LICENSES_REPOSITORY) private readonly licensesRepository: ILicensesRepository,
    @Inject(USAGE_REPOSITORY) private readonly usageRepository: IUsageRepository,
    @Inject(USERS_REPOSITORY) private readonly usersRepository: IUsersRepository,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async checkAndNotify(): Promise<void> {
    const companies = await this.companiesRepository.findAll();
    await Promise.all(companies.map((company) => this.checkCompany(company.id)));
  }

  private async checkCompany(companyId: string): Promise<void> {
    const company = await this.companiesRepository.findById(companyId);
    if (!company) {
      return;
    }

    const usageThreshold = Number(this.configService.get<string>('USAGE_ALERT_THRESHOLD', '0.8'));
    const licenseThreshold = Number(
      this.configService.get<string>('LICENSE_ALERT_THRESHOLD', '0.8'),
    );

    const totalCalls = await this.usageRepository.sumByCompany(companyId);
    const usagePercentage = company.usageLimit > 0 ? totalCalls / company.usageLimit : 0;
    const usageAction = this.evaluate(usagePercentage, usageThreshold, company.usageAlertSentAt);

    const activeLicenses = await this.licensesRepository.findManyActiveByCompany(companyId);
    const licensePercentage =
      company.licenseLimit > 0 ? activeLicenses.length / company.licenseLimit : 0;
    const licenseAction = this.evaluate(
      licensePercentage,
      licenseThreshold,
      company.licenseAlertSentAt,
    );

    if (usageAction === 'none' && licenseAction === 'none') {
      return;
    }

    if (usageAction === 'reset') {
      await this.companiesRepository.updateAlertState(companyId, { usageAlertSentAt: null });
    }
    if (licenseAction === 'reset') {
      await this.companiesRepository.updateAlertState(companyId, { licenseAlertSentAt: null });
    }

    if (usageAction !== 'send' && licenseAction !== 'send') {
      return;
    }

    const admins = await this.usersRepository.findManyByCompany(companyId);
    const adminEmails = admins.filter((user) => user.role === Role.ADMIN).map((user) => user.email);

    if (usageAction === 'send') {
      await this.mailService.sendUsageAlert(adminEmails, {
        companyName: company.name,
        totalCalls,
        usageLimit: company.usageLimit,
        percentage: usagePercentage,
        alertThreshold: usageThreshold,
      });
      await this.companiesRepository.updateAlertState(companyId, { usageAlertSentAt: new Date() });
      this.logger.log(`Usage alert sent for company ${company.name} (${companyId})`);
    }

    if (licenseAction === 'send') {
      await this.mailService.sendLicenseAlert(adminEmails, {
        companyName: company.name,
        activeLicenses: activeLicenses.length,
        licenseLimit: company.licenseLimit,
        percentage: licensePercentage,
        alertThreshold: licenseThreshold,
      });
      await this.companiesRepository.updateAlertState(companyId, {
        licenseAlertSentAt: new Date(),
      });
      this.logger.log(`License alert sent for company ${company.name} (${companyId})`);
    }
  }

  // A threshold is only ever "sent" once per crossing: a persisted timestamp on
  // the company marks it as already notified so a periodic sweep never spams the
  // same alert, and it resets once the metric drops back below the threshold so
  // a future crossing can alert again.
  private evaluate(
    percentage: number,
    threshold: number,
    alreadySentAt: Date | null,
  ): ThresholdAction {
    if (percentage >= threshold) {
      return alreadySentAt ? 'none' : 'send';
    }
    return alreadySentAt ? 'reset' : 'none';
  }
}
