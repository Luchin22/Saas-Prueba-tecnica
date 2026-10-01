import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  COMPANIES_REPOSITORY,
  ICompaniesRepository,
} from '../../companies/domain/companies.repository.interface';
import { IUsageRepository, USAGE_REPOSITORY } from '../domain/usage.repository.interface';
import { UsageSummary } from '../domain/usage-summary.type';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

const USAGE_HISTORY_DAYS = 14;

@Injectable()
export class UsageService {
  constructor(
    @Inject(USAGE_REPOSITORY) private readonly usageRepository: IUsageRepository,
    @Inject(COMPANIES_REPOSITORY) private readonly companiesRepository: ICompaniesRepository,
    private readonly configService: ConfigService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async getSummary(companyId: string): Promise<UsageSummary> {
    const company = await this.getCompanyOrThrow(companyId);
    return this.buildSummary(companyId, company.usageLimit);
  }

  async simulateUsage(companyId: string, count: number): Promise<UsageSummary> {
    const company = await this.getCompanyOrThrow(companyId);

    await this.usageRepository.createRecord(companyId, count);
    const summary = await this.buildSummary(companyId, company.usageLimit);

    this.realtimeGateway.emitToCompany(companyId, 'usage:update', summary);

    if (summary.percentage >= summary.alertThreshold) {
      this.realtimeGateway.emitToCompany(companyId, 'usage:alert', {
        percentage: summary.percentage,
        threshold: summary.alertThreshold,
      });
    }

    // Emailing admins is handled by AlertsScheduler, which sweeps all companies
    // on an interval and persists an alert-sent flag — that way it also catches
    // threshold crossings that don't go through this exact code path, and never
    // double-sends while a company stays above the threshold.
    return summary;
  }

  private async buildSummary(companyId: string, usageLimit: number): Promise<UsageSummary> {
    const [totalCalls, history] = await Promise.all([
      this.usageRepository.sumByCompany(companyId),
      this.usageRepository.findDailyHistory(companyId, USAGE_HISTORY_DAYS),
    ]);

    const alertThreshold = Number(this.configService.get<string>('USAGE_ALERT_THRESHOLD', '0.8'));
    const percentage = usageLimit > 0 ? totalCalls / usageLimit : 0;

    return { totalCalls, usageLimit, percentage, alertThreshold, history };
  }

  private async getCompanyOrThrow(companyId: string) {
    const company = await this.companiesRepository.findById(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }
}
