import { AlertStateUpdate, CompanyEntity } from './company.entity';

export const COMPANIES_REPOSITORY = Symbol('COMPANIES_REPOSITORY');

export interface ICompaniesRepository {
  findById(id: string): Promise<CompanyEntity | null>;
  findAll(): Promise<CompanyEntity[]>;
  updateAlertState(id: string, data: AlertStateUpdate): Promise<void>;
}
