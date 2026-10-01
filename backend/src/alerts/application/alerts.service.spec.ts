import { ConfigService } from '@nestjs/config';
import { AlertsService } from './alerts.service';
import { ICompaniesRepository } from '../../companies/domain/companies.repository.interface';
import { ILicensesRepository } from '../../licenses/domain/licenses.repository.interface';
import { IUsageRepository } from '../../usage/domain/usage.repository.interface';
import { IUsersRepository } from '../../users/domain/users.repository.interface';
import { MailService } from '../../mail/mail.service';
import { Role } from '../../common/enums/role.enum';
import { LicenseEntity } from '../../licenses/domain/license.entity';

describe('AlertsService', () => {
  let companiesRepository: jest.Mocked<ICompaniesRepository>;
  let licensesRepository: jest.Mocked<ILicensesRepository>;
  let usageRepository: jest.Mocked<IUsageRepository>;
  let usersRepository: jest.Mocked<IUsersRepository>;
  let configService: jest.Mocked<ConfigService>;
  let mailService: jest.Mocked<MailService>;
  let service: AlertsService;

  const baseCompany = {
    id: 'company-1',
    name: 'Acme Corp',
    licenseLimit: 10,
    usageLimit: 1000,
    usageAlertSentAt: null as Date | null,
    licenseAlertSentAt: null as Date | null,
    createdAt: new Date(),
  };

  const admin = {
    id: 'admin-1',
    email: 'admin@acme.test',
    passwordHash: 'hash',
    role: Role.ADMIN,
    companyId: 'company-1',
    createdAt: new Date(),
  };

  const employee = {
    id: 'user-1',
    email: 'employee@acme.test',
    passwordHash: 'hash',
    role: Role.USER,
    companyId: 'company-1',
    createdAt: new Date(),
  };

  const activeLicense = (id: string): LicenseEntity => ({
    id,
    userId: `user-${id}`,
    companyId: 'company-1',
    status: 'ACTIVE',
    assignedAt: new Date(),
    revokedAt: null,
  });

  beforeEach(() => {
    companiesRepository = {
      findById: jest.fn().mockResolvedValue(baseCompany),
      findAll: jest.fn().mockResolvedValue([baseCompany]),
      updateAlertState: jest.fn(),
    };
    licensesRepository = {
      findManyActiveByCompany: jest.fn().mockResolvedValue([]),
      assignWithinLimit: jest.fn(),
    };
    usageRepository = {
      createRecord: jest.fn(),
      sumByCompany: jest.fn().mockResolvedValue(0),
      findDailyHistory: jest.fn(),
    };
    usersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findManyByCompany: jest.fn().mockResolvedValue([admin, employee]),
      findManyByCompanyWithLicenseStatus: jest.fn(),
      create: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('0.8'),
    } as unknown as jest.Mocked<ConfigService>;
    mailService = {
      sendUsageAlert: jest.fn(),
      sendLicenseAlert: jest.fn(),
    } as unknown as jest.Mocked<MailService>;

    service = new AlertsService(
      companiesRepository,
      licensesRepository,
      usageRepository,
      usersRepository,
      configService,
      mailService,
    );
  });

  it('sends a usage alert to ADMINs only the first time a company crosses the threshold', async () => {
    usageRepository.sumByCompany.mockResolvedValue(850);

    await service.checkAndNotify();

    expect(mailService.sendUsageAlert).toHaveBeenCalledWith(
      ['admin@acme.test'],
      expect.objectContaining({ companyName: 'Acme Corp', totalCalls: 850 }),
    );
    expect(companiesRepository.updateAlertState).toHaveBeenCalledWith('company-1', {
      usageAlertSentAt: expect.any(Date),
    });
  });

  it('does not re-send the usage alert while already above threshold and already notified', async () => {
    companiesRepository.findById.mockResolvedValue({
      ...baseCompany,
      usageAlertSentAt: new Date(),
    });
    usageRepository.sumByCompany.mockResolvedValue(900);

    await service.checkAndNotify();

    expect(mailService.sendUsageAlert).not.toHaveBeenCalled();
  });

  it('resets the usage alert flag once usage drops back below the threshold', async () => {
    companiesRepository.findById.mockResolvedValue({
      ...baseCompany,
      usageAlertSentAt: new Date(),
    });
    usageRepository.sumByCompany.mockResolvedValue(100);

    await service.checkAndNotify();

    expect(companiesRepository.updateAlertState).toHaveBeenCalledWith('company-1', {
      usageAlertSentAt: null,
    });
    expect(mailService.sendUsageAlert).not.toHaveBeenCalled();
  });

  it('sends a license alert to ADMINs only the first time licenses cross the threshold', async () => {
    licensesRepository.findManyActiveByCompany.mockResolvedValue([
      activeLicense('1'),
      activeLicense('2'),
      activeLicense('3'),
      activeLicense('4'),
      activeLicense('5'),
      activeLicense('6'),
      activeLicense('7'),
      activeLicense('8'),
      activeLicense('9'),
    ]);

    await service.checkAndNotify();

    expect(mailService.sendLicenseAlert).toHaveBeenCalledWith(
      ['admin@acme.test'],
      expect.objectContaining({ companyName: 'Acme Corp', activeLicenses: 9, licenseLimit: 10 }),
    );
    expect(companiesRepository.updateAlertState).toHaveBeenCalledWith('company-1', {
      licenseAlertSentAt: expect.any(Date),
    });
  });

  it('does nothing when both metrics stay below their thresholds', async () => {
    usageRepository.sumByCompany.mockResolvedValue(100);
    licensesRepository.findManyActiveByCompany.mockResolvedValue([activeLicense('1')]);

    await service.checkAndNotify();

    expect(mailService.sendUsageAlert).not.toHaveBeenCalled();
    expect(mailService.sendLicenseAlert).not.toHaveBeenCalled();
    expect(companiesRepository.updateAlertState).not.toHaveBeenCalled();
  });

  it('sweeps every company returned by findAll', async () => {
    const secondCompany = { ...baseCompany, id: 'company-2', name: 'Globex' };
    companiesRepository.findAll.mockResolvedValue([baseCompany, secondCompany]);
    companiesRepository.findById.mockImplementation((id) =>
      Promise.resolve(id === 'company-2' ? secondCompany : baseCompany),
    );

    await service.checkAndNotify();

    expect(companiesRepository.findById).toHaveBeenCalledWith('company-1');
    expect(companiesRepository.findById).toHaveBeenCalledWith('company-2');
  });
});
