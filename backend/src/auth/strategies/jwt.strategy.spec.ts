import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { Role } from '../../common/enums/role.enum';

describe('JwtStrategy', () => {
  it('maps a JWT payload to an authenticated user', () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('secret'),
    } as unknown as ConfigService;
    const strategy = new JwtStrategy(configService);

    const result = strategy.validate({
      sub: 'user-1',
      email: 'admin@acme.test',
      role: Role.ADMIN,
      companyId: 'company-1',
    });

    expect(result).toEqual({
      id: 'user-1',
      email: 'admin@acme.test',
      role: Role.ADMIN,
      companyId: 'company-1',
    });
  });
});
