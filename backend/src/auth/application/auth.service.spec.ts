import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { IUsersRepository } from '../../users/domain/users.repository.interface';
import { Role } from '../../common/enums/role.enum';

describe('AuthService', () => {
  let usersRepository: jest.Mocked<IUsersRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let authService: AuthService;

  beforeEach(() => {
    usersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findManyByCompany: jest.fn(),
      findManyByCompanyWithLicenseStatus: jest.fn(),
      create: jest.fn(),
    };
    jwtService = { signAsync: jest.fn() } as unknown as jest.Mocked<JwtService>;
    authService = new AuthService(usersRepository, jwtService);
  });

  it('throws Unauthorized when the user does not exist', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.login('missing@acme.test', 'password')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws Unauthorized when the password does not match', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    usersRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'admin@acme.test',
      passwordHash,
      role: Role.ADMIN,
      companyId: 'company-1',
      createdAt: new Date(),
    });

    await expect(authService.login('admin@acme.test', 'wrong-password')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('returns an access token and user summary on valid credentials', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    usersRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'admin@acme.test',
      passwordHash,
      role: Role.ADMIN,
      companyId: 'company-1',
      createdAt: new Date(),
    });
    jwtService.signAsync.mockResolvedValue('signed-jwt');

    const result = await authService.login('admin@acme.test', 'correct-password');

    expect(result.accessToken).toBe('signed-jwt');
    expect(result.user).toEqual({
      id: 'user-1',
      email: 'admin@acme.test',
      role: Role.ADMIN,
      companyId: 'company-1',
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'admin@acme.test',
      role: Role.ADMIN,
      companyId: 'company-1',
    });
  });
});
