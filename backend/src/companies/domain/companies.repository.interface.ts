import { CompanyEntity } from './company.entity';

export const COMPANIES_REPOSITORY = Symbol('COMPANIES_REPOSITORY');

export interface ICompaniesRepository {
  findById(id: string): Promise<CompanyEntity | null>;
}
