import { DailyUsage } from '../domain/usage.repository.interface';
import { UsageSummary } from '../domain/usage-summary.type';

export class UsageResponseDto {
  totalCalls: number;
  usageLimit: number;
  percentage: number;
  alertThreshold: number;
  history: DailyUsage[];

  static fromSummary(summary: UsageSummary): UsageResponseDto {
    const dto = new UsageResponseDto();
    dto.totalCalls = summary.totalCalls;
    dto.usageLimit = summary.usageLimit;
    dto.percentage = summary.percentage;
    dto.alertThreshold = summary.alertThreshold;
    dto.history = summary.history;
    return dto;
  }
}
