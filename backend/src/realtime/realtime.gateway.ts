import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/types/authenticated-user.type';

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = this.extractToken(client);
    if (!token) {
      this.rejectConnection(client);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      await client.join(this.companyRoom(payload.companyId));
    } catch {
      this.rejectConnection(client);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  emitToCompany(companyId: string, event: string, payload: unknown): void {
    this.server.to(this.companyRoom(companyId)).emit(event, payload);
  }

  private companyRoom(companyId: string): string {
    return `company:${companyId}`;
  }

  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.['token'] as string | undefined;
    if (authToken) {
      return authToken;
    }
    const queryToken = client.handshake.query?.['token'];
    return typeof queryToken === 'string' ? queryToken : undefined;
  }

  private rejectConnection(client: Socket): void {
    client.emit('error', { message: 'Unauthorized' });
    client.disconnect(true);
  }
}
