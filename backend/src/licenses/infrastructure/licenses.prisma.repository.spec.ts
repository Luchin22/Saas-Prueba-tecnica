import { Prisma } from '@prisma/client';
import { LicensesPrismaRepository } from './licenses.prisma.repository';
import { PrismaService } from '../../prisma/prisma.service';

type TxMock = {
  license: {
    findUnique: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
};

function createPrismaMock() {
  const tx: TxMock = {
    license: { findUnique: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
  };
  const prisma = {
    license: { findMany: jest.fn() },
    $transaction: jest.fn((callback: (tx: TxMock) => unknown) => callback(tx)),
  };
  return { prisma, tx };
}

describe('LicensesPrismaRepository', () => {
  it('findManyActiveByCompany maps persisted licenses', async () => {
    const { prisma } = createPrismaMock();
    prisma.license.findMany.mockResolvedValue([
      {
        id: 'license-1',
        userId: 'user-1',
        companyId: 'company-1',
        status: 'ACTIVE',
        assignedAt: new Date(),
        revokedAt: null,
      },
    ]);
    const repository = new LicensesPrismaRepository(prisma as unknown as PrismaService);

    const result = await repository.findManyActiveByCompany('company-1');

    expect(result).toHaveLength(1);
    expect(prisma.license.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'company-1', status: 'ACTIVE' } }),
    );
  });

  describe('assignWithinLimit', () => {
    it('returns already_active when the user has an active license', async () => {
      const { prisma, tx } = createPrismaMock();
      tx.license.findUnique.mockResolvedValue({ userId: 'user-1', status: 'ACTIVE' });
      const repository = new LicensesPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.assignWithinLimit('user-1', 'company-1', 5);

      expect(result).toEqual({ outcome: 'already_active' });
      expect(tx.license.count).not.toHaveBeenCalled();
    });

    it('returns limit_exceeded when the company has reached its license limit', async () => {
      const { prisma, tx } = createPrismaMock();
      tx.license.findUnique.mockResolvedValue(null);
      tx.license.count.mockResolvedValue(5);
      const repository = new LicensesPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.assignWithinLimit('user-1', 'company-1', 5);

      expect(result).toEqual({ outcome: 'limit_exceeded' });
      expect(tx.license.create).not.toHaveBeenCalled();
    });

    it('creates a new license when none exists and the limit is not reached', async () => {
      const { prisma, tx } = createPrismaMock();
      tx.license.findUnique.mockResolvedValue(null);
      tx.license.count.mockResolvedValue(2);
      tx.license.create.mockResolvedValue({
        id: 'license-1',
        userId: 'user-1',
        companyId: 'company-1',
        status: 'ACTIVE',
        assignedAt: new Date(),
        revokedAt: null,
      });
      const repository = new LicensesPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.assignWithinLimit('user-1', 'company-1', 5);

      expect(result.outcome).toBe('assigned');
      expect(tx.license.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', companyId: 'company-1', status: 'ACTIVE' },
      });
    });

    it('reactivates a previously revoked license instead of creating a new row', async () => {
      const { prisma, tx } = createPrismaMock();
      tx.license.findUnique.mockResolvedValue({ userId: 'user-1', status: 'REVOKED' });
      tx.license.count.mockResolvedValue(0);
      tx.license.update.mockResolvedValue({
        id: 'license-1',
        userId: 'user-1',
        companyId: 'company-1',
        status: 'ACTIVE',
        assignedAt: new Date(),
        revokedAt: null,
      });
      const repository = new LicensesPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.assignWithinLimit('user-1', 'company-1', 5);

      expect(result.outcome).toBe('assigned');
      expect(tx.license.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
      expect(tx.license.create).not.toHaveBeenCalled();
    });

    it('treats a serialization conflict (P2034) as limit_exceeded', async () => {
      const { prisma } = createPrismaMock();
      prisma.$transaction = jest.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Transaction conflict', {
          code: 'P2034',
          clientVersion: '7.10.0',
        }),
      );
      const repository = new LicensesPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.assignWithinLimit('user-1', 'company-1', 5);

      expect(result).toEqual({ outcome: 'limit_exceeded' });
    });

    it('rethrows unrelated errors', async () => {
      const { prisma } = createPrismaMock();
      prisma.$transaction = jest.fn().mockRejectedValue(new Error('connection lost'));
      const repository = new LicensesPrismaRepository(prisma as unknown as PrismaService);

      await expect(repository.assignWithinLimit('user-1', 'company-1', 5)).rejects.toThrow(
        'connection lost',
      );
    });
  });
});
