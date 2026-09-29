import { JwtService } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';
import { Role } from '../common/enums/role.enum';

function createSocket(auth: Record<string, unknown> = {}, query: Record<string, unknown> = {}) {
  return {
    id: 'socket-1',
    handshake: { auth, query },
    join: jest.fn().mockResolvedValue(undefined),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };
}

describe('RealtimeGateway', () => {
  let jwtService: jest.Mocked<JwtService>;
  let gateway: RealtimeGateway;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() } as unknown as jest.Mocked<JwtService>;
    gateway = new RealtimeGateway(jwtService);
  });

  it('rejects a connection with no token', async () => {
    const socket = createSocket();
    await gateway.handleConnection(socket as never);

    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('rejects a connection with an invalid token', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));
    const socket = createSocket({ token: 'bad-token' });

    await gateway.handleConnection(socket as never);

    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });

  it('joins the company room for a valid token in the auth payload', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'admin@acme.test',
      role: Role.ADMIN,
      companyId: 'company-1',
    });
    const socket = createSocket({ token: 'good-token' });

    await gateway.handleConnection(socket as never);

    expect(socket.join).toHaveBeenCalledWith('company:company-1');
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('falls back to the query string token when auth token is absent', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'admin@acme.test',
      role: Role.ADMIN,
      companyId: 'company-1',
    });
    const socket = createSocket({}, { token: 'query-token' });

    await gateway.handleConnection(socket as never);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('query-token');
    expect(socket.join).toHaveBeenCalledWith('company:company-1');
  });

  it('emits events to the company room', () => {
    const server = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
    (gateway as unknown as { server: unknown }).server = server;

    gateway.emitToCompany('company-1', 'usage:update', { totalCalls: 10 });

    expect(server.to).toHaveBeenCalledWith('company:company-1');
    expect(server.emit).toHaveBeenCalledWith('usage:update', { totalCalls: 10 });
  });

  it('handleDisconnect does not throw', () => {
    const socket = createSocket();
    expect(() => gateway.handleDisconnect(socket as never)).not.toThrow();
  });
});
