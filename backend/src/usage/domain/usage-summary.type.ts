import { DailyUsage } from './usage.repository.interface';

export type UsageSummary = {
  totalCalls: number;
  usageLimit: number;
  percentage: number;
  alertThreshold: number;
  history: DailyUsage[];
};
