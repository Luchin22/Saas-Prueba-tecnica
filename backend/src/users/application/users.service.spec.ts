import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { IUsersRepository } from '../domain/users.repository.interface';
import { Role } from '../../common/enums/role.enum';

describe('UsersService', () => {
  let usersRepository: jest.Mocked<IUsersRepository>;
  let usersService: UsersService;

  beforeEach(() => {
    usersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findManyByCompany: jest.fn(),
      findManyByCompanyWithLicenseStatus: jest.fn(),
      create: jest.fn(),
    };
    usersService = new UsersService(usersRepository);
  });

  describe('listByCompany', () => {
    it('delegates to the repository', async () => {
      usersRepository.findManyByCompanyWithLicenseStatus.mockResolvedValue([]);
      await usersService.listByCompany('company-1');
      expect(usersRepository.findManyByCompanyWithLicenseStatus).toHaveBeenCalledWith('company-1');
    });
  });

  describe('createEmployee', () => {
    it('throws Conflict when the email is already registered', async () => {
      usersRepository.findByEmail.mockResolvedValue({
        id: 'existing',
        email: 'dup@acme.test',
        passwordHash: 'hash',
        role: Role.USER,
        companyId: 'company-1',
        createdAt: new Date(),
      });

      await expect(
        usersService.createEmployee('company-1', 'dup@acme.test', 'password123'),
      ).rejects.toThrow(ConflictException);
      expect(usersRepository.create).not.toHaveBeenCalled();
    });

    it('creates a USER-role employee scoped to the admin company', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue({
        id: 'new-user',
        email: 'new@acme.test',
        passwordHash: 'hashed',
        role: Role.USER,
        companyId: 'company-1',
        createdAt: new Date(),
      });

      const result = await usersService.createEmployee('company-1', 'new@acme.test', 'password123');

      expect(result.email).toBe('new@acme.test');
      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@acme.test',
          role: Role.USER,
          companyId: 'company-1',
        }),
      );
    });
  });
});
