import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AlertsScheduler } from './alerts.scheduler';
import { AlertsService } from './application/alerts.service';

describe('AlertsScheduler', () => {
  let alertsService: jest.Mocked<AlertsService>;
  let configService: jest.Mocked<ConfigService>;
  let schedulerRegistry: jest.Mocked<SchedulerRegistry>;
  let scheduler: AlertsScheduler;

  beforeEach(() => {
    jest.useFakeTimers();
    alertsService = {
      checkAndNotify: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AlertsService>;
    configService = {
      get: jest.fn().mockReturnValue('15000'),
    } as unknown as jest.Mocked<ConfigService>;
    schedulerRegistry = {
      addInterval: jest.fn(),
      deleteInterval: jest.fn(),
      doesExist: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<SchedulerRegistry>;
    scheduler = new AlertsScheduler(alertsService, configService, schedulerRegistry);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('registers a recurring interval on module init', () => {
    scheduler.onModuleInit();

    expect(schedulerRegistry.addInterval).toHaveBeenCalledWith('alerts-sweep', expect.anything());
  });

  it('invokes AlertsService.checkAndNotify on every tick', () => {
    scheduler.onModuleInit();

    jest.advanceTimersByTime(15000);

    expect(alertsService.checkAndNotify).toHaveBeenCalledTimes(1);
  });

  it('removes the interval on module destroy when it exists', () => {
    scheduler.onModuleDestroy();

    expect(schedulerRegistry.deleteInterval).toHaveBeenCalledWith('alerts-sweep');
  });

  it('does not try to remove the interval when it was never registered', () => {
    schedulerRegistry.doesExist.mockReturnValue(false);

    scheduler.onModuleDestroy();

    expect(schedulerRegistry.deleteInterval).not.toHaveBeenCalled();
  });
});
