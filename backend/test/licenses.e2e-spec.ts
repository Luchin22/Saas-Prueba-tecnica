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

async function login(app: INestApplication, email: string): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: E2E_PASSWORD })
    .expect(200);
  return response.body.accessToken as string;
}

describe('Licenses (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fixture: TestCompanyFixture;
  let adminToken: string;
  let employeeToken: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    fixture = await seedTestCompany(prisma, { licenseLimit: 1 });
    adminToken = await login(app, fixture.adminEmail);
    employeeToken = await login(app, fixture.employeeEmail);
  });

  afterAll(async () => {
    await cleanupTestCompany(prisma, fixture.companyId);
    await app.close();
  });

  it('rejects assignment attempts from a non-admin user', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/licenses/assign')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ userId: fixture.employeeId })
      .expect(403);
  });

  it('assigns a license to an employee of the admin company', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/licenses/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: fixture.employeeId })
      .expect(201);

    expect(response.body).toMatchObject({
      userId: fixture.employeeId,
      companyId: fixture.companyId,
      status: 'ACTIVE',
    });
  });

  it('rejects assigning a second active license to the same user', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/licenses/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: fixture.employeeId })
      .expect(409);
  });

  it('rejects assignment once the contracted license limit is reached', async () => {
    const secondEmployee = await prisma.user.create({
      data: {
        email: `employee2-${fixture.companyId}@e2e.test`,
        passwordHash: (await prisma.user.findUniqueOrThrow({ where: { id: fixture.employeeId } }))
          .passwordHash,
        role: 'USER',
        companyId: fixture.companyId,
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/licenses/assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: secondEmployee.id })
      .expect(422);
  });

  it('rejects assigning a license to a user outside the admin company', async () => {
    const otherFixture = await seedTestCompany(prisma);
    try {
      await request(app.getHttpServer())
        .post('/api/v1/licenses/assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: otherFixture.employeeId })
        .expect(404);
    } finally {
      await cleanupTestCompany(prisma, otherFixture.companyId);
    }
  });

  it('lists the active licenses for the admin company', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/licenses')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ userId: fixture.employeeId })]),
    );
  });
});
