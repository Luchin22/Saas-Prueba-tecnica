import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DailyUsage, IUsageRepository } from '../domain/usage.repository.interface';

@Injectable()
export class UsagePrismaRepository implements IUsageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRecord(companyId: string, count: number): Promise<void> {
    await this.prisma.apiUsageRecord.create({ data: { companyId, count } });
  }

  async sumByCompany(companyId: string): Promise<number> {
    const result = await this.prisma.apiUsageRecord.aggregate({
      where: { companyId },
      _sum: { count: true },
    });
    return result._sum.count ?? 0;
  }

  async findDailyHistory(companyId: string, days: number): Promise<DailyUsage[]> {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const records = await this.prisma.apiUsageRecord.findMany({
      where: { companyId, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
      select: { count: true, recordedAt: true },
    });

    const buckets = new Map<string, number>();
    for (const record of records) {
      const key = record.recordedAt.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + record.count);
    }

    // Zero-fill every day in the window, not just the ones with activity —
    // otherwise a chart over this data can't draw a consistent 14-day trend
    // line whenever usage is concentrated on a single day (e.g. right after a
    // fresh seed, before historical data has accumulated).
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(since);
      date.setDate(since.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      return { date: key, count: buckets.get(key) ?? 0 };
    });
  }
}
