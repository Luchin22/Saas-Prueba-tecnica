import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsageService } from './application/usage.service';
import { SimulateUsageDto } from './dto/simulate-usage.dto';
import { UsageResponseDto } from './dto/usage-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

const DEFAULT_SIMULATED_CALLS_MIN = 1;
const DEFAULT_SIMULATED_CALLS_MAX = 50;

@Controller('api/v1/usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get()
  async getUsage(@CurrentUser() currentUser: AuthenticatedUser): Promise<UsageResponseDto> {
    const summary = await this.usageService.getSummary(currentUser.companyId);
    return UsageResponseDto.fromSummary(summary);
  }

  @Post('simulate')
  async simulate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: SimulateUsageDto,
  ): Promise<UsageResponseDto> {
    const count = dto.count ?? this.randomCallCount();
    const summary = await this.usageService.simulateUsage(currentUser.companyId, count);
    return UsageResponseDto.fromSummary(summary);
  }

  private randomCallCount(): number {
    return (
      Math.floor(Math.random() * (DEFAULT_SIMULATED_CALLS_MAX - DEFAULT_SIMULATED_CALLS_MIN + 1)) +
      DEFAULT_SIMULATED_CALLS_MIN
    );
  }
}
