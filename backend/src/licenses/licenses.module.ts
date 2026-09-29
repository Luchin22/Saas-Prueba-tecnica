import { Module } from '@nestjs/common';
import { LicensesController } from './licenses.controller';
import { AssignLicenseUseCase } from './application/assign-license.use-case';
import { LICENSES_REPOSITORY } from './domain/licenses.repository.interface';
import { LicensesPrismaRepository } from './infrastructure/licenses.prisma.repository';
import { UsersModule } from '../users/users.module';
import { CompaniesModule } from '../companies/companies.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [UsersModule, CompaniesModule, RealtimeModule],
  controllers: [LicensesController],
  providers: [
    AssignLicenseUseCase,
    { provide: LICENSES_REPOSITORY, useClass: LicensesPrismaRepository },
  ],
  exports: [LICENSES_REPOSITORY],
})
export class LicensesModule {}
