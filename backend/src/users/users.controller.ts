import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './application/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  async list(@CurrentUser() currentUser: AuthenticatedUser): Promise<UserResponseDto[]> {
    const users = await this.usersService.listByCompany(currentUser.companyId);
    return users.map((user) => UserResponseDto.fromEntity(user, user.hasActiveLicense));
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.createEmployee(
      currentUser.companyId,
      dto.email,
      dto.password,
    );
    return UserResponseDto.fromEntity(user, false);
  }
}
