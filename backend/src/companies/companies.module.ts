import { Module } from '@nestjs/common';
import { COMPANIES_REPOSITORY } from './domain/companies.repository.interface';
import { CompaniesPrismaRepository } from './infrastructure/companies.prisma.repository';

@Module({
  providers: [{ provide: COMPANIES_REPOSITORY, useClass: CompaniesPrismaRepository }],
  exports: [COMPANIES_REPOSITORY],
})
export class CompaniesModule {}
