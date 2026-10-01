import { Module } from '@nestjs/common';
import { UsageController } from './usage.controller';
import { UsageService } from './application/usage.service';
import { USAGE_REPOSITORY } from './domain/usage.repository.interface';
import { UsagePrismaRepository } from './infrastructure/usage.prisma.repository';
import { CompaniesModule } from '../companies/companies.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [CompaniesModule, RealtimeModule],
  controllers: [UsageController],
  providers: [UsageService, { provide: USAGE_REPOSITORY, useClass: UsagePrismaRepository }],
  exports: [USAGE_REPOSITORY],
})
export class UsageModule {}
