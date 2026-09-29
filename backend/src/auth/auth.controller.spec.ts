import { AuthController } from './auth.controller';
import { AuthService } from './application/auth.service';
import { Role } from '../common/enums/role.enum';

describe('AuthController', () => {
  it('delegates login to the auth service', async () => {
    const authService = {
      login: jest.fn().mockResolvedValue({
        accessToken: 'jwt',
        user: { id: 'user-1', email: 'admin@acme.test', role: Role.ADMIN, companyId: 'company-1' },
      }),
    } as unknown as jest.Mocked<AuthService>;
    const controller = new AuthController(authService);

    const result = await controller.login({ email: 'admin@acme.test', password: 'password123' });

    expect(authService.login).toHaveBeenCalledWith('admin@acme.test', 'password123');
    expect(result.accessToken).toBe('jwt');
  });
});
