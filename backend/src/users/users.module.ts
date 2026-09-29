import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './application/users.service';
import { USERS_REPOSITORY } from './domain/users.repository.interface';
import { UsersPrismaRepository } from './infrastructure/users.prisma.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, { provide: USERS_REPOSITORY, useClass: UsersPrismaRepository }],
  exports: [UsersService, USERS_REPOSITORY],
})
export class UsersModule {}
