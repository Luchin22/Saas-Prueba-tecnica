export const USAGE_REPOSITORY = Symbol('USAGE_REPOSITORY');

export type DailyUsage = {
  date: string;
  count: number;
};

export interface IUsageRepository {
  createRecord(companyId: string, count: number): Promise<void>;
  sumByCompany(companyId: string): Promise<number>;
  findDailyHistory(companyId: string, days: number): Promise<DailyUsage[]>;
}
