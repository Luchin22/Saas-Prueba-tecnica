import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { AssignLicenseUseCase } from './application/assign-license.use-case';
import { ILicensesRepository, LICENSES_REPOSITORY } from './domain/licenses.repository.interface';
import { AssignLicenseDto } from './dto/assign-license.dto';
import { LicenseResponseDto } from './dto/license-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('api/v1/licenses')
export class LicensesController {
  constructor(
    private readonly assignLicenseUseCase: AssignLicenseUseCase,
    @Inject(LICENSES_REPOSITORY) private readonly licensesRepository: ILicensesRepository,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Get()
  @Roles(Role.ADMIN)
  async list(@CurrentUser() currentUser: AuthenticatedUser): Promise<LicenseResponseDto[]> {
    const licenses = await this.licensesRepository.findManyActiveByCompany(currentUser.companyId);
    return licenses.map((license) => LicenseResponseDto.fromEntity(license));
  }

  @Post('assign')
  @Roles(Role.ADMIN)
  async assign(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: AssignLicenseDto,
  ): Promise<LicenseResponseDto> {
    const license = await this.assignLicenseUseCase.execute(currentUser.companyId, dto.userId);

    this.realtimeGateway.emitToCompany(currentUser.companyId, 'licenses:updated', {
      userId: license.userId,
      status: license.status,
    });

    return LicenseResponseDto.fromEntity(license);
  }
}
