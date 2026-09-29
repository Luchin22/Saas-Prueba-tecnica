import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

function createContext(): ExecutionContext {
  return {
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({}), getResponse: () => ({}) }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let reflector: Reflector;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('bypasses passport authentication for public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('delegates to passport authentication for non-public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const superCanActivate = jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
      .mockReturnValue(true);

    expect(guard.canActivate(createContext())).toBe(true);
    expect(superCanActivate).toHaveBeenCalled();
  });
});
