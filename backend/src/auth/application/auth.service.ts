import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUsersRepository, USERS_REPOSITORY } from '../../users/domain/users.repository.interface';
import { JwtPayload } from '../types/authenticated-user.type';
import { LoginResponseDto } from '../dto/login-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly usersRepository: IUsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponseDto> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    };
  }
}
