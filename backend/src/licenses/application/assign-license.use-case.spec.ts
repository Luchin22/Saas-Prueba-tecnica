import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { AssignLicenseUseCase } from './assign-license.use-case';
import { ILicensesRepository } from '../domain/licenses.repository.interface';
import { IUsersRepository } from '../../users/domain/users.repository.interface';
import { ICompaniesRepository } from '../../companies/domain/companies.repository.interface';
import { Role } from '../../common/enums/role.enum';

describe('AssignLicenseUseCase', () => {
  let licensesRepository: jest.Mocked<ILicensesRepository>;
  let usersRepository: jest.Mocked<IUsersRepository>;
  let companiesRepository: jest.Mocked<ICompaniesRepository>;
  let useCase: AssignLicenseUseCase;

  const targetUser = {
    id: 'user-1',
    email: 'employee@acme.test',
    passwordHash: 'hash',
    role: Role.USER,
    companyId: 'company-1',
    createdAt: new Date(),
  };

  const company = {
    id: 'company-1',
    name: 'Acme Corp',
    licenseLimit: 5,
    usageLimit: 1000,
    usageAlertSentAt: null,
    licenseAlertSentAt: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    licensesRepository = {
      findManyActiveByCompany: jest.fn(),
      assignWithinLimit: jest.fn(),
    };
    usersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findManyByCompany: jest.fn(),
      findManyByCompanyWithLicenseStatus: jest.fn(),
      create: jest.fn(),
    };
    companiesRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      updateAlertState: jest.fn(),
    };
    useCase = new AssignLicenseUseCase(licensesRepository, usersRepository, companiesRepository);
  });

  it('throws NotFound when the target user does not exist', async () => {
    usersRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('company-1', 'user-1')).rejects.toThrow(NotFoundException);
    expect(licensesRepository.assignWithinLimit).not.toHaveBeenCalled();
  });

  it('throws NotFound when the target user belongs to a different company', async () => {
    usersRepository.findById.mockResolvedValue({ ...targetUser, companyId: 'other-company' });

    await expect(useCase.execute('company-1', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFound when the admin company cannot be found', async () => {
    usersRepository.findById.mockResolvedValue(targetUser);
    companiesRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('company-1', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('throws Conflict when the user already has an active license', async () => {
    usersRepository.findById.mockResolvedValue(targetUser);
    companiesRepository.findById.mockResolvedValue(company);
    licensesRepository.assignWithinLimit.mockResolvedValue({ outcome: 'already_active' });

    await expect(useCase.execute('company-1', 'user-1')).rejects.toThrow(ConflictException);
  });

  it('throws UnprocessableEntity when the company license limit is reached', async () => {
    usersRepository.findById.mockResolvedValue(targetUser);
    companiesRepository.findById.mockResolvedValue(company);
    licensesRepository.assignWithinLimit.mockResolvedValue({ outcome: 'limit_exceeded' });

    await expect(useCase.execute('company-1', 'user-1')).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('returns the created license when assignment succeeds', async () => {
    usersRepository.findById.mockResolvedValue(targetUser);
    companiesRepository.findById.mockResolvedValue(company);
    const license = {
      id: 'license-1',
      userId: 'user-1',
      companyId: 'company-1',
      status: 'ACTIVE' as const,
      assignedAt: new Date(),
      revokedAt: null,
    };
    licensesRepository.assignWithinLimit.mockResolvedValue({ outcome: 'assigned', license });

    const result = await useCase.execute('company-1', 'user-1');

    expect(result).toEqual(license);
    expect(licensesRepository.assignWithinLimit).toHaveBeenCalledWith('user-1', 'company-1', 5);
  });
});
