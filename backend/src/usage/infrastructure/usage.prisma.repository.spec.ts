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

  describe('findDailyHistory', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-10T12:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('zero-fills every day in the window, not just the days with activity', async () => {
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

      expect(result).toHaveLength(14);
      expect(result[0]).toEqual({ date: '2025-12-28', count: 0 });
      expect(result).toContainEqual({ date: '2026-01-01', count: 15 });
      expect(result).toContainEqual({ date: '2026-01-02', count: 7 });
      expect(result).toContainEqual({ date: '2026-01-03', count: 0 });
      expect(result[result.length - 1]).toEqual({ date: '2026-01-10', count: 0 });
    });

    it('returns 14 zero-count days when there is no activity at all', async () => {
      const prisma = {
        apiUsageRecord: {
          create: jest.fn(),
          aggregate: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
        },
      };
      const repository = new UsagePrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findDailyHistory('company-1', 14);

      expect(result).toHaveLength(14);
      expect(result.every((entry) => entry.count === 0)).toBe(true);
    });
  });
});
