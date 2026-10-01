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

describe('Usage (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fixture: TestCompanyFixture;
  let adminToken: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    fixture = await seedTestCompany(prisma, { usageLimit: 100 });

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: fixture.adminEmail, password: E2E_PASSWORD })
      .expect(200);
    adminToken = login.body.accessToken as string;
  });

  afterAll(async () => {
    await cleanupTestCompany(prisma, fixture.companyId);
    await app.close();
  });

  it('GET /api/v1/usage starts at zero consumption', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/usage')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toMatchObject({ totalCalls: 0, usageLimit: 100 });
  });

  it('POST /api/v1/usage/simulate records calls and updates the aggregate', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/usage/simulate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ count: 90 })
      .expect(201);

    expect(response.body.totalCalls).toBe(90);
    expect(response.body.percentage).toBeCloseTo(0.9);
  });

  it('rejects an out-of-range simulate payload', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/usage/simulate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ count: -5 })
      .expect(400);
  });
});
