import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  cleanupTestCompany,
  createTestApp,
  E2E_PASSWORD,
  seedTestCompany,
  TestCompanyFixture,
} from './support/test-app.helper';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fixture: TestCompanyFixture;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    fixture = await seedTestCompany(prisma);
  });

  afterAll(async () => {
    await cleanupTestCompany(prisma, fixture.companyId);
    await app.close();
  });

  it('POST /api/v1/auth/login returns a JWT for valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: fixture.adminEmail, password: E2E_PASSWORD })
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({ email: fixture.adminEmail, role: 'ADMIN' });
  });

  it('POST /api/v1/auth/login rejects an invalid password', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: fixture.adminEmail, password: 'wrong-password' })
      .expect(401);
  });

  it('POST /api/v1/auth/login rejects a malformed payload', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email' })
      .expect(400);
  });

  it('rejects requests without a bearer token', async () => {
    await request(app.getHttpServer()).get('/api/v1/usage').expect(401);
  });

  it('throttles repeated login attempts from the same client', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 10; i += 1) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: fixture.adminEmail, password: 'wrong-password' });
      statuses.push(response.status);
    }

    expect(statuses.some((status) => status === 429)).toBe(true);
  });
});
