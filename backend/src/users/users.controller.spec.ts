import { UsersController } from './users.controller';
import { UsersService } from './application/users.service';
import { Role } from '../common/enums/role.enum';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

describe('UsersController', () => {
  let usersService: jest.Mocked<UsersService>;
  let controller: UsersController;

  const admin: AuthenticatedUser = {
    id: 'admin-1',
    email: 'admin@acme.test',
    role: Role.ADMIN,
    companyId: 'company-1',
  };

  beforeEach(() => {
    usersService = {
      listByCompany: jest.fn(),
      createEmployee: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;
    controller = new UsersController(usersService);
  });

  it('lists users of the current admin company', async () => {
    usersService.listByCompany.mockResolvedValue([
      {
        id: 'user-1',
        email: 'employee@acme.test',
        passwordHash: 'hash',
        role: Role.USER,
        companyId: 'company-1',
        createdAt: new Date(),
        hasActiveLicense: true,
      },
    ]);

    const result = await controller.list(admin);

    expect(usersService.listByCompany).toHaveBeenCalledWith('company-1');
    expect(result).toHaveLength(1);
    expect(result[0].hasActiveLicense).toBe(true);
  });

  it('creates a new employee for the current admin company', async () => {
    usersService.createEmployee.mockResolvedValue({
      id: 'user-2',
      email: 'new@acme.test',
      passwordHash: 'hash',
      role: Role.USER,
      companyId: 'company-1',
      createdAt: new Date(),
    });

    const result = await controller.create(admin, {
      email: 'new@acme.test',
      password: 'password123',
    });

    expect(usersService.createEmployee).toHaveBeenCalledWith(
      'company-1',
      'new@acme.test',
      'password123',
    );
    expect(result.hasActiveLicense).toBe(false);
  });
});
