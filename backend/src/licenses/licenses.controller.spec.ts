import { LicensesController } from './licenses.controller';
import { AssignLicenseUseCase } from './application/assign-license.use-case';
import { ILicensesRepository } from './domain/licenses.repository.interface';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { Role } from '../common/enums/role.enum';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

describe('LicensesController', () => {
  const admin: AuthenticatedUser = {
    id: 'admin-1',
    email: 'admin@acme.test',
    role: Role.ADMIN,
    companyId: 'company-1',
  };

  let assignLicenseUseCase: jest.Mocked<AssignLicenseUseCase>;
  let licensesRepository: jest.Mocked<ILicensesRepository>;
  let realtimeGateway: jest.Mocked<RealtimeGateway>;
  let controller: LicensesController;

  beforeEach(() => {
    assignLicenseUseCase = { execute: jest.fn() } as unknown as jest.Mocked<AssignLicenseUseCase>;
    licensesRepository = { findManyActiveByCompany: jest.fn(), assignWithinLimit: jest.fn() };
    realtimeGateway = { emitToCompany: jest.fn() } as unknown as jest.Mocked<RealtimeGateway>;
    controller = new LicensesController(assignLicenseUseCase, licensesRepository, realtimeGateway);
  });

  it('lists active licenses for the current company', async () => {
    licensesRepository.findManyActiveByCompany.mockResolvedValue([
      {
        id: 'license-1',
        userId: 'user-1',
        companyId: 'company-1',
        status: 'ACTIVE',
        assignedAt: new Date(),
        revokedAt: null,
      },
    ]);

    const result = await controller.list(admin);

    expect(licensesRepository.findManyActiveByCompany).toHaveBeenCalledWith('company-1');
    expect(result).toHaveLength(1);
  });

  it('assigns a license and broadcasts the update over the realtime gateway', async () => {
    const license = {
      id: 'license-1',
      userId: 'user-1',
      companyId: 'company-1',
      status: 'ACTIVE' as const,
      assignedAt: new Date(),
      revokedAt: null,
    };
    assignLicenseUseCase.execute.mockResolvedValue(license);

    const result = await controller.assign(admin, { userId: 'user-1' });

    expect(assignLicenseUseCase.execute).toHaveBeenCalledWith('company-1', 'user-1');
    expect(realtimeGateway.emitToCompany).toHaveBeenCalledWith('company-1', 'licenses:updated', {
      userId: 'user-1',
      status: 'ACTIVE',
    });
    expect(result.id).toBe('license-1');
  });
});
