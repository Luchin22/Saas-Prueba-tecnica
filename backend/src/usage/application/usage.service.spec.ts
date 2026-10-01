import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsageService } from './usage.service';
import { IUsageRepository } from '../domain/usage.repository.interface';
import { ICompaniesRepository } from '../../companies/domain/companies.repository.interface';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

describe('UsageService', () => {
  let usageRepository: jest.Mocked<IUsageRepository>;
  let companiesRepository: jest.Mocked<ICompaniesRepository>;
  let configService: jest.Mocked<ConfigService>;
  let realtimeGateway: jest.Mocked<RealtimeGateway>;
  let service: UsageService;

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
    usageRepository = {
      createRecord: jest.fn(),
      sumByCompany: jest.fn(),
      findDailyHistory: jest.fn().mockResolvedValue([]),
    };
    companiesRepository = {
      findById: jest.fn().mockResolvedValue(company),
      findAll: jest.fn(),
      updateAlertState: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('0.8'),
    } as unknown as jest.Mocked<ConfigService>;
    realtimeGateway = { emitToCompany: jest.fn() } as unknown as jest.Mocked<RealtimeGateway>;
    service = new UsageService(
      usageRepository,
      companiesRepository,
      configService,
      realtimeGateway,
    );
  });

  it('getSummary throws NotFound when the company does not exist', async () => {
    companiesRepository.findById.mockResolvedValue(null);
    await expect(service.getSummary('company-1')).rejects.toThrow(NotFoundException);
  });

  it('getSummary computes the usage percentage against the contracted limit', async () => {
    usageRepository.sumByCompany.mockResolvedValue(400);

    const result = await service.getSummary('company-1');

    expect(result).toEqual({
      totalCalls: 400,
      usageLimit: 1000,
      percentage: 0.4,
      alertThreshold: 0.8,
      history: [],
    });
  });

  it('simulateUsage records the call and always emits usage:update', async () => {
    usageRepository.sumByCompany.mockResolvedValue(200);

    await service.simulateUsage('company-1', 20);

    expect(usageRepository.createRecord).toHaveBeenCalledWith('company-1', 20);
    expect(realtimeGateway.emitToCompany).toHaveBeenCalledWith(
      'company-1',
      'usage:update',
      expect.objectContaining({ totalCalls: 200 }),
    );
  });

  it('simulateUsage emits usage:alert once the threshold is crossed', async () => {
    usageRepository.sumByCompany.mockResolvedValue(850);

    await service.simulateUsage('company-1', 100);

    expect(realtimeGateway.emitToCompany).toHaveBeenCalledWith(
      'company-1',
      'usage:alert',
      expect.objectContaining({ percentage: 0.85, threshold: 0.8 }),
    );
  });

  it('simulateUsage does not emit usage:alert below the threshold', async () => {
    usageRepository.sumByCompany.mockResolvedValue(100);

    await service.simulateUsage('company-1', 10);

    const alertCalls = realtimeGateway.emitToCompany.mock.calls.filter(
      ([, event]) => event === 'usage:alert',
    );
    expect(alertCalls).toHaveLength(0);
  });
});
