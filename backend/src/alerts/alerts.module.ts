import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AlertsService } from './application/alerts.service';
import { AlertsScheduler } from './alerts.scheduler';
import { CompaniesModule } from '../companies/companies.module';
import { LicensesModule } from '../licenses/licenses.module';
import { UsageModule } from '../usage/usage.module';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CompaniesModule,
    LicensesModule,
    UsageModule,
    UsersModule,
    MailModule,
  ],
  providers: [AlertsService, AlertsScheduler],
})
export class AlertsModule {}
