import { UsagePrismaRepository } from './usage.prisma.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('UsagePrismaRepository', () => {
  it('createRecord persists a new usage record', async () => {
    const prisma = {
      apiUsageRecord: { create: jest.fn(), aggregate: jest.fn(), findMany: jest.fn() },
    };
    const repository = new UsagePrismaRepository(prisma as unknown as PrismaService);

    await repository.createRecord('company-1', 42);

    expect(prisma.apiUsageRecord.create).toHaveBeenCalledWith({
      data: { companyId: 'company-1', count: 42 },
    });
  });

  it('sumByCompany returns 0 when there are no records', async () => {
    const prisma = {
      apiUsageRecord: {
        create: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _sum: { count: null } }),
        findMany: jest.fn(),
      },
    };
    const repository = new UsagePrismaRepository(prisma as unknown as PrismaService);

    await expect(repository.sumByCompany('company-1')).resolves.toBe(0);
  });

  it('sumByCompany returns the aggregated total', async () => {
    const prisma = {
      apiUsageRecord: {
        create: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _sum: { count: 123 } }),
        findMany: jest.fn(),
      },
    };
    const repository = new UsagePrismaRepository(prisma as unknown as PrismaService);

    await expect(repository.sumByCompany('company-1')).resolves.toBe(123);
  });

  it('findDailyHistory buckets records by day', async () => {
    const prisma = {
      apiUsageRecord: {
        create: jest.fn(),
        aggregate: jest.fn(),
        findMany: jest.fn().mockResolvedValue([
          { count: 10, recordedAt: new Date('2026-01-01T08:00:00.000Z') },
          { count: 5, recordedAt: new Date('2026-01-01T20:00:00.000Z') },
          { count: 7, recordedAt: new Date('2026-01-02T09:00:00.000Z') },
        ]),
      },
    };
    const repository = new UsagePrismaRepository(prisma as unknown as PrismaService);

    const result = await repository.findDailyHistory('company-1', 14);

    expect(result).toEqual([
      { date: '2026-01-01', count: 15 },
      { date: '2026-01-02', count: 7 },
    ]);
  });
});
