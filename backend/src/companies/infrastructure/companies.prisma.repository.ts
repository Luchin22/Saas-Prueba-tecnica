import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ICompaniesRepository } from '../domain/companies.repository.interface';
import { CompanyEntity } from '../domain/company.entity';

@Injectable()
export class CompaniesPrismaRepository implements ICompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CompanyEntity | null> {
    return this.prisma.company.findUnique({ where: { id } });
  }
}
