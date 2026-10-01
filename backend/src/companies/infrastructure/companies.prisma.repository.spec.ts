import { CompaniesPrismaRepository } from './companies.prisma.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('CompaniesPrismaRepository', () => {
  it('returns the company when found', async () => {
    const prisma = { company: { findUnique: jest.fn().mockResolvedValue({ id: 'company-1' }) } };
    const repository = new CompaniesPrismaRepository(prisma as unknown as PrismaService);

    const result = await repository.findById('company-1');

    expect(result).toEqual({ id: 'company-1' });
    expect(prisma.company.findUnique).toHaveBeenCalledWith({ where: { id: 'company-1' } });
  });

  it('returns null when the company does not exist', async () => {
    const prisma = { company: { findUnique: jest.fn().mockResolvedValue(null) } };
    const repository = new CompaniesPrismaRepository(prisma as unknown as PrismaService);

    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('returns every company for findAll', async () => {
    const prisma = { company: { findMany: jest.fn().mockResolvedValue([{ id: 'company-1' }]) } };
    const repository = new CompaniesPrismaRepository(prisma as unknown as PrismaService);

    await expect(repository.findAll()).resolves.toEqual([{ id: 'company-1' }]);
  });

  it('persists the alert state via updateAlertState', async () => {
    const prisma = { company: { update: jest.fn().mockResolvedValue({}) } };
    const repository = new CompaniesPrismaRepository(prisma as unknown as PrismaService);
    const sentAt = new Date('2026-01-01T00:00:00Z');

    await repository.updateAlertState('company-1', { usageAlertSentAt: sentAt });

    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: 'company-1' },
      data: { usageAlertSentAt: sentAt },
    });
  });
});
