import { UsersPrismaRepository } from './users.prisma.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../common/enums/role.enum';

type PrismaMock = {
  user: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
  };
};

describe('UsersPrismaRepository', () => {
  let prisma: PrismaMock;
  let repository: UsersPrismaRepository;

  const rawUser = {
    id: 'user-1',
    email: 'admin@acme.test',
    passwordHash: 'hash',
    role: 'ADMIN',
    companyId: 'company-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    };
    repository = new UsersPrismaRepository(prisma as unknown as PrismaService);
  });

  it('findByEmail returns null when no user matches', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(repository.findByEmail('missing@acme.test')).resolves.toBeNull();
  });

  it('findByEmail maps the persisted record to a domain entity', async () => {
    prisma.user.findUnique.mockResolvedValue(rawUser);
    const result = await repository.findByEmail('admin@acme.test');
    expect(result).toEqual({ ...rawUser, role: Role.ADMIN });
  });

  it('findById maps the persisted record to a domain entity', async () => {
    prisma.user.findUnique.mockResolvedValue(rawUser);
    const result = await repository.findById('user-1');
    expect(result?.id).toBe('user-1');
  });

  it('findManyByCompany maps every record', async () => {
    prisma.user.findMany.mockResolvedValue([rawUser]);
    const result = await repository.findManyByCompany('company-1');
    expect(result).toHaveLength(1);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'company-1' } }),
    );
  });

  it('findManyByCompanyWithLicenseStatus flags users with an active license', async () => {
    prisma.user.findMany.mockResolvedValue([
      { ...rawUser, license: { status: 'ACTIVE' } },
      { ...rawUser, id: 'user-2', license: { status: 'REVOKED' } },
      { ...rawUser, id: 'user-3', license: null },
    ]);

    const result = await repository.findManyByCompanyWithLicenseStatus('company-1');

    expect(result).toEqual([
      expect.objectContaining({ id: 'user-1', hasActiveLicense: true }),
      expect.objectContaining({ id: 'user-2', hasActiveLicense: false }),
      expect.objectContaining({ id: 'user-3', hasActiveLicense: false }),
    ]);
  });

  it('create persists and maps the new user', async () => {
    prisma.user.create.mockResolvedValue(rawUser);
    const result = await repository.create({
      email: 'admin@acme.test',
      passwordHash: 'hash',
      role: Role.ADMIN,
      companyId: 'company-1',
    });
    expect(result.id).toBe('user-1');
  });
});
