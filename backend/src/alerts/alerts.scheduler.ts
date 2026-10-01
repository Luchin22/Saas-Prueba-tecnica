import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AlertsService } from './application/alerts.service';

const INTERVAL_NAME = 'alerts-sweep';

@Injectable()
export class AlertsScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlertsScheduler.name);

  constructor(
    private readonly alertsService: AlertsService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const intervalMs = Number(this.configService.get<string>('ALERT_CHECK_INTERVAL_MS', '15000'));
    const interval = setInterval(() => void this.sweep(), intervalMs);
    this.schedulerRegistry.addInterval(INTERVAL_NAME, interval);
    this.logger.log(`AlertsScheduler running every ${intervalMs}ms`);
  }

  onModuleDestroy(): void {
    if (this.schedulerRegistry.doesExist('interval', INTERVAL_NAME)) {
      this.schedulerRegistry.deleteInterval(INTERVAL_NAME);
    }
  }

  async sweep(): Promise<void> {
    this.logger.debug('Sweeping companies for usage/license threshold crossings');
    await this.alertsService.checkAndNotify();
  }
}
