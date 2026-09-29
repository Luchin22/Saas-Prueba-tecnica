import { UsageController } from './usage.controller';
import { UsageService } from './application/usage.service';
import { Role } from '../common/enums/role.enum';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

describe('UsageController', () => {
  const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'employee@acme.test',
    role: Role.USER,
    companyId: 'company-1',
  };

  let usageService: jest.Mocked<UsageService>;
  let controller: UsageController;

  const summary = {
    totalCalls: 100,
    usageLimit: 1000,
    percentage: 0.1,
    alertThreshold: 0.8,
    history: [],
  };

  beforeEach(() => {
    usageService = {
      getSummary: jest.fn().mockResolvedValue(summary),
      simulateUsage: jest.fn().mockResolvedValue(summary),
    } as unknown as jest.Mocked<UsageService>;
    controller = new UsageController(usageService);
  });

  it('returns the usage summary for the current company', async () => {
    const result = await controller.getUsage(user);
    expect(usageService.getSummary).toHaveBeenCalledWith('company-1');
    expect(result.totalCalls).toBe(100);
  });

  it('simulates usage with the provided count', async () => {
    await controller.simulate(user, { count: 33 });
    expect(usageService.simulateUsage).toHaveBeenCalledWith('company-1', 33);
  });

  it('simulates usage with a random count within range when none is provided', async () => {
    await controller.simulate(user, {});
    const [, count] = usageService.simulateUsage.mock.calls[0];
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(50);
  });
});
